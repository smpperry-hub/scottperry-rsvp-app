import { createClient } from "@supabase/supabase-js";
import type { Guest, Party } from "@/lib/supabase/types";

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getGuests(): Promise<Guest[]> {
  const { data, error } = await publicClient().from("guests").select("*").order("name");
  if (error) return [];
  return (data ?? []) as Guest[];
}

export async function getParties(): Promise<Party[]> {
  const { data, error } = await publicClient().from("parties").select("*").order("label");
  if (error) return [];
  return (data ?? []) as Party[];
}

export function getActiveRsvpType(): "save_the_date" | "formal_invite" {
  return process.env.ACTIVE_RSVP_TYPE === "formal_invite" ? "formal_invite" : "save_the_date";
}
