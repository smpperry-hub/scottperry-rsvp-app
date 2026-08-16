"use client";

import { useMemo, useState } from "react";
import type { Guest } from "@/lib/supabase/types";

type Props = {
  guests: Guest[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function RoommatePicker({ guests, selectedIds, onChange }: Props) {
  const [query, setQuery] = useState("");

  const selected = guests.filter((g) => selectedIds.includes(g.id));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests
      .filter((g) => !selectedIds.includes(g.id))
      .filter((g) => !q || g.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [guests, selectedIds, query]);

  function addGuest(id: string) {
    onChange([...selectedIds, id]);
    setQuery("");
  }

  function removeGuest(id: string) {
    onChange(selectedIds.filter((r) => r !== id));
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((guest) => (
            <span
              key={guest.id}
              className="flex items-center gap-1.5 rounded-full bg-clay/15 px-3 py-1 font-sans text-xs text-ink"
            >
              {guest.name}
              <button
                type="button"
                onClick={() => removeGuest(guest.id)}
                aria-label={`Remove ${guest.name}`}
                className="text-clay hover:text-ink"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search names…"
        className="w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
      />

      {query.trim().length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded border border-ochre/35 bg-cream">
          {results.length === 0 ? (
            <p className="px-4 py-3 font-sans text-sm text-ink/50">No matching names.</p>
          ) : (
            results.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onClick={() => addGuest(guest.id)}
                className="flex w-full items-center justify-between px-4 py-2 text-left font-sans text-sm text-ink hover:bg-sand"
              >
                <span>
                  {guest.name}
                  {guest.party_label ? (
                    <span className="ml-2 text-ink/50">— {guest.party_label}</span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
