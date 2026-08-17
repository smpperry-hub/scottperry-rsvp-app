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

  const { data, error } = await supabase.from("parties").select("*").order("label");
  if (error) {
    return NextResponse.json({ error: "Could not load parties." }, { status: 500 });
  }
  return NextResponse.json({ parties: data });
}

export async function POST(request: Request) {
  const { supabase, authorized } = await requireHost();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  if (!label) {
    return NextResponse.json({ error: "Party label is required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("parties")
    .select("*")
    .ilike("label", label)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ party: existing });
  }

  const { data, error } = await supabase.from("parties").insert({ label }).select("*").single();
  if (error) {
    return NextResponse.json({ error: "Could not create party." }, { status: 500 });
  }
  return NextResponse.json({ party: data });
}

export async function DELETE(request: Request) {
  const { supabase, authorized } = await requireHost();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Party id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("parties").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not remove party." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
