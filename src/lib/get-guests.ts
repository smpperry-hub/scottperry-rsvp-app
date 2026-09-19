import { createClient } from "@supabase/supabase-js";
import type { Party, PublicGuest } from "@/lib/supabase/types";

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Explicit columns on purpose: anon must never read invite_status/relation.
export async function getGuests(): Promise<PublicGuest[]> {
  const { data, error } = await publicClient()
    .from("guests")
    .select("id, name, party_id")
    .order("name");
  if (error) return [];
  return (data ?? []) as PublicGuest[];
}

export async function getParties(): Promise<Party[]> {
  const { data, error } = await publicClient().from("parties").select("*").order("label");
  if (error) return [];
  return (data ?? []) as Party[];
}

export function getActiveRsvpType(): "save_the_date" | "formal_invite" {
  return process.env.ACTIVE_RSVP_TYPE === "formal_invite" ? "formal_invite" : "save_the_date";
}
