import SaveTheDateForm from "@/components/save-the-date-form";
import { getGuests } from "@/lib/get-guests";

export const dynamic = "force-dynamic";

export default async function SaveTheDatePage() {
  const guests = await getGuests();

  return (
    <main className="flex-1">
      <header className="border-b border-ochre/20 bg-sand/60 px-6 py-16 text-center sm:py-24">
        <span className="mb-4 block font-sans text-xs font-medium uppercase tracking-[0.3em] text-clay">
          Scott &amp; Mia
        </span>
        <h1 className="font-display text-5xl italic text-ink sm:text-6xl">
          Save the date!
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-7 text-ink/70">
          November 6, 2027 · Palm Springs, California. Let us know if you think
          you can make it — a formal invite with all the details will follow.
        </p>
      </header>

      <section className="px-6 py-16">
        <SaveTheDateForm guests={guests} />
      </section>
    </main>
  );
}
