"use client";

import { useState } from "react";
import type { Guest } from "@/lib/supabase/types";

export default function GuestManager({ initialGuests }: { initialGuests: Guest[] }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [name, setName] = useState("");
  const [partyLabel, setPartyLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), party_label: partyLabel.trim() || null }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not add guest.");
      return;
    }

    setGuests((prev) => [...prev, data.guest].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setPartyLabel("");
  }

  async function removeGuest(id: string) {
    setBusy(true);
    const res = await fetch(`/api/guests?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
    }
  }

  return (
    <div className="rounded border border-ochre/25 bg-white/70 p-6">
      <h2 className="font-display text-xl italic text-ink">Guest list</h2>
      <p className="mt-1 font-sans text-xs text-ink/60">
        Names added here populate the rooming picker on the public RSVP form.
      </p>

      <form onSubmit={addGuest} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Guest name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-[160px] flex-1 rounded border border-ochre/35 bg-cream px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ochre"
        />
        <input
          type="text"
          placeholder="Party label (optional)"
          value={partyLabel}
          onChange={(e) => setPartyLabel(e.target.value)}
          className="min-w-[140px] flex-1 rounded border border-ochre/35 bg-cream px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ochre"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-ink px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-cream hover:bg-clay disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 font-sans text-sm text-clay">{error}</p>}

      <ul className="mt-4 max-h-64 divide-y divide-ochre/15 overflow-y-auto">
        {guests.map((guest) => (
          <li key={guest.id} className="flex items-center justify-between py-2">
            <span className="font-sans text-sm text-ink">
              {guest.name}
              {guest.party_label && (
                <span className="ml-2 text-ink/50">— {guest.party_label}</span>
              )}
            </span>
            <button
              onClick={() => removeGuest(guest.id)}
              disabled={busy}
              className="font-sans text-xs uppercase tracking-wider text-clay hover:underline disabled:opacity-60"
            >
              Remove
            </button>
          </li>
        ))}
        {guests.length === 0 && (
          <li className="py-4 text-center font-sans text-sm text-ink/50">No guests yet.</li>
        )}
      </ul>
    </div>
  );
}
