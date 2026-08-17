import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EMAILS = (process.env.HOST_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const INVITE_STATUSES = ["for_sure", "waitlist"] as const;
const RELATIONS = [
  "Scott Immediate Family",
  "Mia Immediate Family",
  "Mia Home Friends",
  "Scott Home Friends",
  "Joint Friends",
  "Scott College Friends",
  "Mia College Friends",
  "Scott Extended Family",
  "Mia Extended Family",
] as const;

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function requireHost() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
    return { supabase, authorized: false as const };
  }
  return { supabase, authorized: true as const };
}

async function findOrCreatePartyId(supabase: SupabaseServer, label: string): Promise<string> {
  const { data: existing } = await supabase
    .from("parties")
    .select("id")
    .ilike("label", label)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("parties")
    .insert({ label })
    .select("id")
    .single();
  return created!.id;
}

function parseInviteStatus(value: unknown): string | null {
  return typeof value === "string" &&
    INVITE_STATUSES.includes(value as (typeof INVITE_STATUSES)[number])
    ? value
    : null;
}

function parseRelation(value: unknown): string | null {
  return typeof value === "string" && RELATIONS.includes(value as (typeof RELATIONS)[number])
    ? value
    : null;
}

export async function GET() {
  const { supabase, authorized } = await requireHost();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.from("guests").select("*").order("name");
  if (error) {
    return NextResponse.json({ error: "Could not load guests." }, { status: 500 });
  }
  return NextResponse.json({ guests: data });
}

export async function POST(request: Request) {
  const { supabase, authorized } = await requireHost();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (Array.isArray(body?.guests)) {
    const partyIdByLabel = new Map<string, string>();
    const rows = [];
    for (const g of body.guests as { name?: unknown; party_label?: unknown }[]) {
      const name = typeof g?.name === "string" ? g.name.trim() : "";
      if (!name) continue;

      const label =
        typeof g?.party_label === "string" && g.party_label.trim()
          ? g.party_label.trim()
          : null;
      let party_id: string | null = null;
      if (label) {
        const key = label.toLowerCase();
        party_id = partyIdByLabel.get(key) ?? null;
        if (!party_id) {
          party_id = await findOrCreatePartyId(supabase, label);
          partyIdByLabel.set(key, party_id);
        }
      }
      rows.push({ name, party_id });
      if (rows.length >= 500) break;
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid guest names found." }, { status: 400 });
    }

    const { data, error } = await supabase.from("guests").insert(rows).select("*");
    if (error) {
      return NextResponse.json({ error: "Could not add guests." }, { status: 500 });
    }
    return NextResponse.json({ guests: data });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
  }

  let party_id: string | null = null;
  if (typeof body?.party_id === "string" && body.party_id) {
    party_id = body.party_id;
  } else if (typeof body?.party_label === "string" && body.party_label.trim()) {
    party_id = await findOrCreatePartyId(supabase, body.party_label.trim());
  }

  const { data, error } = await supabase
    .from("guests")
    .insert({
      name,
      party_id,
      invite_status: parseInviteStatus(body?.invite_status),
      relation: parseRelation(body?.relation),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not add guest." }, { status: 500 });
  }
  return NextResponse.json({ guest: data });
}

export async function PATCH(request: Request) {
  const { supabase, authorized } = await requireHost();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Guest id is required." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) {
    update.name = body.name.trim();
  }
  if ("party_id" in body) {
    update.party_id = typeof body.party_id === "string" && body.party_id ? body.party_id : null;
  }
  if ("invite_status" in body) {
    update.invite_status = parseInviteStatus(body.invite_status);
  }
  if ("relation" in body) {
    update.relation = parseRelation(body.relation);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("guests")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update guest." }, { status: 500 });
  }
  return NextResponse.json({ guest: data });
}

export async function DELETE(request: Request) {
  const { supabase, authorized } = await requireHost();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Guest id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not remove guest." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
