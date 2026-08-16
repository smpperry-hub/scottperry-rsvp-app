import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";

const ALLOWED_EMAILS = (process.env.HOST_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-cream">
      <header className="flex items-center justify-between bg-ink px-6 py-4 text-cream">
        <div>
          <h1 className="font-display text-xl italic">Scott &amp; Mia — RSVP Dashboard</h1>
          <p className="text-xs text-cream/50">{user.email}</p>
        </div>
        <SignOutButton />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
