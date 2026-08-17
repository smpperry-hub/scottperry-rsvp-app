"use client";

import { useMemo, useState } from "react";
import type { Guest, Party } from "@/lib/supabase/types";

type Props = {
  guests: Guest[];
  parties: Party[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

type Group = {
  key: string;
  label: string;
  guestIds: string[];
  memberNames: string[];
};

function buildGroups(guests: Guest[], parties: Party[]): Group[] {
  const partyLabelById = new Map(parties.map((p) => [p.id, p.label]));
  const byParty = new Map<string, Guest[]>();
  const ungrouped: Guest[] = [];

  for (const guest of guests) {
    if (guest.party_id) {
      const list = byParty.get(guest.party_id) ?? [];
      list.push(guest);
      byParty.set(guest.party_id, list);
    } else {
      ungrouped.push(guest);
    }
  }

  const groups: Group[] = [];
  for (const [partyId, members] of byParty) {
    groups.push({
      key: partyId,
      label: partyLabelById.get(partyId) ?? "Party",
      guestIds: members.map((m) => m.id),
      memberNames: members.map((m) => m.name),
    });
  }
  for (const guest of ungrouped) {
    groups.push({
      key: guest.id,
      label: guest.name,
      guestIds: [guest.id],
      memberNames: [],
    });
  }

  return groups.sort((a, b) => a.label.localeCompare(b.label));
}

export default function RoommatePicker({ guests, parties, selectedIds, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => buildGroups(guests, parties), [guests, parties]);

  const isFullySelected = (group: Group) => group.guestIds.every((id) => selectedIds.includes(id));

  const selected = groups.filter(isFullySelected);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((group) => {
      if (isFullySelected(group)) return false;
      if (!q) return true;
      return (
        group.label.toLowerCase().includes(q) ||
        group.memberNames.some((n) => n.toLowerCase().includes(q))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, selectedIds, query]);

  function addGroup(group: Group) {
    const merged = new Set(selectedIds);
    group.guestIds.forEach((id) => merged.add(id));
    onChange(Array.from(merged));
  }

  function removeGroup(group: Group) {
    onChange(selectedIds.filter((id) => !group.guestIds.includes(id)));
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {selected.map((group) => (
            <span
              key={group.key}
              className="flex items-center gap-1.5 rounded-full bg-clay/15 px-3 py-1 font-sans text-xs text-ink"
            >
              {group.label}
              <button
                type="button"
                onClick={() => removeGroup(group)}
                aria-label={`Remove ${group.label}`}
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
        placeholder="Search names…"
        className="w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
      />

      {open && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded border border-ochre/35 bg-cream">
          {results.length === 0 ? (
            <p className="px-4 py-3 font-sans text-sm text-ink/50">No matching names.</p>
          ) : (
            results.map((group) => (
              <button
                key={group.key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addGroup(group)}
                className="flex w-full items-center justify-between px-4 py-2 text-left font-sans text-sm text-ink hover:bg-sand"
              >
                {group.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
