import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RsvpPayload = {
  full_name?: unknown;
  additional_names?: unknown;
  email?: unknown;
  phone?: unknown;
  attending?: unknown;
  notes?: unknown;
  roommate_guest_ids?: unknown;
  room_type_preference?: unknown;
  confirmUpdate?: unknown;
};

const ROOM_TYPES = ["Studio", "1 Bedroom Suite", "Shared Suite", "No Preference"] as const;

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function findOrCreateGuestId(supabase: SupabaseAdmin, name: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("guests")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("guests")
    .insert({ name })
    .select("id")
    .single();

  return created?.id ?? null;
}

export async function POST(request: Request) {
  let body: RsvpPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const attending = body.attending;
  const email = typeof body.email === "string" ? body.email.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() : null;
  const roomTypePreference =
    typeof body.room_type_preference === "string" &&
    ROOM_TYPES.includes(body.room_type_preference as (typeof ROOM_TYPES)[number])
      ? body.room_type_preference
      : null;
  const confirmUpdate = body.confirmUpdate === true;
  const roommateIds = Array.isArray(body.roommate_guest_ids)
    ? body.roommate_guest_ids.filter((id): id is string => typeof id === "string")
    : [];
  const rawAdditionalNames = Array.isArray(body.additional_names)
    ? body.additional_names.filter((n): n is string => typeof n === "string")
    : [];

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (typeof attending !== "boolean") {
    return NextResponse.json(
      { error: "Please let us know whether you're attending." },
      { status: 400 }
    );
  }

  // De-dupe the party's names (case-insensitive), primary first.
  const seen = new Set([fullName.toLowerCase()]);
  const additionalNames: string[] = [];
  for (const raw of rawAdditionalNames) {
    const n = raw.trim();
    const key = n.toLowerCase();
    if (!n || seen.has(key)) continue;
    seen.add(key);
    additionalNames.push(n);
  }
  const allNames = [fullName, ...additionalNames];

  const supabase = createAdminClient();

  if (attending && roommateIds.length > 0) {
    const { data: matchedGuests, error: guestsError } = await supabase
      .from("guests")
      .select("id")
      .in("id", roommateIds);

    if (guestsError) {
      return NextResponse.json({ error: "Could not validate rooming picks." }, { status: 500 });
    }
    if ((matchedGuests?.length ?? 0) !== roommateIds.length) {
      return NextResponse.json(
        { error: "One or more rooming picks are no longer valid guests." },
        { status: 400 }
      );
    }
  }

  // Look up existing RSVPs for everyone in this submission.
  const existingByName = new Map<string, { id: string; full_name: string }>();
  for (const n of allNames) {
    const { data: existing, error: existingError } = await supabase
      .from("rsvps")
      .select("id, full_name")
      .ilike("full_name", n)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Could not check for an existing response." }, { status: 500 });
    }
    if (existing) existingByName.set(n, existing);
  }

  if (existingByName.size > 0 && !confirmUpdate) {
    const names = Array.from(existingByName.values()).map((e) => e.full_name);
    return NextResponse.json(
      {
        error: "duplicate",
        message: `${names.join(", ")} already ${
          names.length === 1 ? "has" : "have"
        } a response on file. Submit again to update.`,
        existingIds: Array.from(existingByName.values()).map((e) => e.id),
      },
      { status: 409 }
    );
  }

  // Make sure everyone in this submission has a guests-table entry, so
  // future rooming pickers and additional-name searches can find them.
  const guestIdByName = new Map<string, string | null>();
  for (const n of allNames) {
    guestIdByName.set(n, await findOrCreateGuestId(supabase, n));
  }

  async function upsertRsvp(name: string, submittedByRsvpId: string | null) {
    const existing = existingByName.get(name);
    if (existing) {
      const { error } = await supabase
        .from("rsvps")
        .update({
          full_name: name,
          guest_id: guestIdByName.get(name) ?? null,
          email,
          phone,
          attending,
          notes,
          room_type_preference: roomTypePreference,
          submitted_by_rsvp_id: submittedByRsvpId,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return null;
      await supabase.from("rooming_preferences").delete().eq("rsvp_id", existing.id);
      return existing.id;
    }

    const { data: inserted, error } = await supabase
      .from("rsvps")
      .insert({
        full_name: name,
        guest_id: guestIdByName.get(name) ?? null,
        email,
        phone,
        attending,
        notes,
        room_type_preference: roomTypePreference,
        submitted_by_rsvp_id: submittedByRsvpId,
      })
      .select("id")
      .single();
    if (error || !inserted) return null;
    return inserted.id;
  }

  const primaryId = await upsertRsvp(fullName, null);
  if (!primaryId) {
    return NextResponse.json({ error: "Could not save your response." }, { status: 500 });
  }

  const rsvpIds = [primaryId];
  for (const name of additionalNames) {
    const id = await upsertRsvp(name, primaryId);
    if (!id) {
      return NextResponse.json(
        { error: "Saved your response, but one of the additional names failed to save." },
        { status: 500 }
      );
    }
    rsvpIds.push(id);
  }

  if (attending && roommateIds.length > 0) {
    const roomingRows = rsvpIds.flatMap((rsvp_id) =>
      roommateIds.map((roommate_guest_id) => ({ rsvp_id, roommate_guest_id }))
    );
    const { error: roomingError } = await supabase.from("rooming_preferences").insert(roomingRows);
    if (roomingError) {
      return NextResponse.json({ error: "Saved your RSVP, but rooming picks failed to save." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, ids: rsvpIds, count: rsvpIds.length });
}
