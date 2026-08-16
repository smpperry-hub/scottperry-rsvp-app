import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EMAILS = (process.env.HOST_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const partyLabel =
    typeof body?.party_label === "string" && body.party_label.trim()
      ? body.party_label.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("guests")
    .insert({ name, party_label: partyLabel })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not add guest." }, { status: 500 });
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
