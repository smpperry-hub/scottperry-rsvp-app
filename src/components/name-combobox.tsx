"use client";

import { useMemo, useState } from "react";
import type { Guest } from "@/lib/supabase/types";

type Props = {
  guests: Guest[];
  value: string;
  onChange: (value: string) => void;
};

export default function NameCombobox({ guests, value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = value.trim().toLowerCase();
    return guests.filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [guests, value]);

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Start typing your name…"
        className="w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
        required
      />

      {open && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded border border-ochre/35 bg-cream">
          {results.length === 0 ? (
            <p className="px-4 py-3 font-sans text-sm text-ink/50">
              No match — just finish typing your name above.
            </p>
          ) : (
            results.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(guest.name);
                  setOpen(false);
                }}
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
