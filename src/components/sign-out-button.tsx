"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded border border-cream/30 px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-cream transition-colors hover:bg-cream/10"
    >
      Sign out
    </button>
  );
}
