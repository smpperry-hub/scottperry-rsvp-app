import { createClient } from "@/lib/supabase/server";

const ALLOWED_EMAILS = (process.env.HOST_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireHost() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
    return { supabase, authorized: false as const };
  }
  return { supabase, authorized: true as const };
}
