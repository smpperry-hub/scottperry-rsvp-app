import { createClient } from "@supabase/supabase-js";
import RsvpForm from "@/components/rsvp-form";
import type { Guest } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

async function getGuests(): Promise<Guest[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.from("guests").select("*").order("name");
  if (error) return [];
  return (data ?? []) as Guest[];
}

export default async function RsvpPage() {
  const guests = await getGuests();

  return (
    <main className="flex-1">
      <header className="border-b border-ochre/20 bg-sand/60 px-6 py-16 text-center sm:py-24">
        <span className="mb-4 block font-sans text-xs font-medium uppercase tracking-[0.3em] text-clay">
          Scott &amp; Mia
        </span>
        <h1 className="font-display text-5xl italic text-ink sm:text-6xl">
          Will you join us?
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-7 text-ink/70">
          November 6, 2027 · Palm Springs, California. Let us know if you can
          make it, and help us plan rooming for the weekend.
        </p>
      </header>

      <section className="px-6 py-16">
        <RsvpForm guests={guests} />
      </section>
    </main>
  );
}
