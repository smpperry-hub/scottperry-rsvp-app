import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Party, PublicGuest } from "@/lib/supabase/types";

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Only "For sure" guests are offered in the public name pickers. This runs
// server-side with the service role because anon can't read invite_status,
// so waitlisted names never reach the browser. Explicit columns on purpose.
export async function getGuests(): Promise<PublicGuest[]> {
  const { data, error } = await createAdminClient()
    .from("guests")
    .select("id, name, party_id")
    .eq("invite_status", "for_sure")
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
