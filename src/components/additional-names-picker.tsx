"use client";

import { useMemo, useState } from "react";
import type { Guest } from "@/lib/supabase/types";

type Props = {
  guests: Guest[];
  selectedNames: string[];
  onChange: (names: string[]) => void;
};

export default function AdditionalNamesPicker({ guests, selectedNames, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const normalizedSelected = useMemo(
    () => selectedNames.map((n) => n.toLowerCase()),
    [selectedNames]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests
      .filter((g) => !normalizedSelected.includes(g.name.toLowerCase()))
      .filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [guests, normalizedSelected, query]);

  const trimmedQuery = query.trim();
  const isDuplicate =
    trimmedQuery.length > 0 &&
    (normalizedSelected.includes(trimmedQuery.toLowerCase()) ||
      guests.some((g) => g.name.toLowerCase() === trimmedQuery.toLowerCase()));
  const showAddNew = trimmedQuery.length > 0 && !isDuplicate;

  function addName(name: string) {
    onChange([...selectedNames, name]);
    setQuery("");
  }

  function removeName(name: string) {
    onChange(selectedNames.filter((n) => n !== name));
  }

  return (
    <div>
      {selectedNames.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {selectedNames.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1.5 rounded-full bg-clay/15 px-3 py-1 font-sans text-xs text-ink"
            >
              {name}
              <button
                type="button"
                onClick={() => removeName(name)}
                aria-label={`Remove ${name}`}
                className="text-clay hover:text-ink"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="font-sans text-xs uppercase tracking-wider text-clay hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Search names or add someone new…"
        className="w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
      />

      {open && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded border border-ochre/35 bg-cream">
          {showAddNew && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addName(trimmedQuery)}
              className="flex w-full items-center gap-1 border-b border-ochre/20 px-4 py-2 text-left font-sans text-sm text-clay hover:bg-sand"
            >
              + Add &ldquo;{trimmedQuery}&rdquo;
            </button>
          )}
          {results.length === 0 && !showAddNew ? (
            <p className="px-4 py-3 font-sans text-sm text-ink/50">No matching names.</p>
          ) : (
            results.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addName(guest.name)}
                className="flex w-full items-center justify-between px-4 py-2 text-left font-sans text-sm text-ink hover:bg-sand"
              >
                <span>{guest.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
