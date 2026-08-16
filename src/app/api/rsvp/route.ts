import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RsvpPayload = {
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  attending?: unknown;
  notes?: unknown;
  roommate_guest_ids?: unknown;
  confirmUpdate?: unknown;
};

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
  const confirmUpdate = body.confirmUpdate === true;
  const roommateIds = Array.isArray(body.roommate_guest_ids)
    ? body.roommate_guest_ids.filter((id): id is string => typeof id === "string")
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

  const { data: existing, error: existingError } = await supabase
    .from("rsvps")
    .select("id, full_name")
    .ilike("full_name", fullName)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Could not check for an existing response." }, { status: 500 });
  }

  if (existing && !confirmUpdate) {
    return NextResponse.json(
      {
        error: "duplicate",
        message: `We already have a response from ${existing.full_name}. Submit again to update it.`,
        existingId: existing.id,
      },
      { status: 409 }
    );
  }

  let rsvpId = existing?.id;

  if (existing) {
    const { error: updateError } = await supabase
      .from("rsvps")
      .update({
        full_name: fullName,
        email,
        phone,
        attending,
        notes,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: "Could not update your response." }, { status: 500 });
    }

    await supabase.from("rooming_preferences").delete().eq("rsvp_id", existing.id);
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("rsvps")
      .insert({ full_name: fullName, email, phone, attending, notes })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ error: "Could not save your response." }, { status: 500 });
    }
    rsvpId = inserted.id;
  }

  if (attending && roommateIds.length > 0 && rsvpId) {
    const { error: roomingError } = await supabase
      .from("rooming_preferences")
      .insert(roommateIds.map((roommate_guest_id) => ({ rsvp_id: rsvpId!, roommate_guest_id })));

    if (roomingError) {
      return NextResponse.json({ error: "Saved your RSVP, but rooming picks failed to save." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id: rsvpId, updated: !!existing });
}
