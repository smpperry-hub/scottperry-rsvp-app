import { createClient } from "@supabase/supabase-js";
import type { Guest } from "@/lib/supabase/types";

export async function getGuests(): Promise<Guest[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.from("guests").select("*").order("name");
  if (error) return [];
  return (data ?? []) as Guest[];
}

export function getActiveRsvpType(): "save_the_date" | "formal_invite" {
  return process.env.ACTIVE_RSVP_TYPE === "formal_invite" ? "formal_invite" : "save_the_date";
}
