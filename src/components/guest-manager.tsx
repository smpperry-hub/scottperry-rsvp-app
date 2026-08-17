"use client";

import { useMemo, useState } from "react";
import type { Guest, InviteStatus, Party, Relation } from "@/lib/supabase/types";
import { RELATIONS } from "@/lib/supabase/types";

const INVITE_STATUSES: { value: InviteStatus; label: string }[] = [
  { value: "for_sure", label: "For sure" },
  { value: "waitlist", label: "Waitlist" },
];

type Props = {
  initialGuests: Guest[];
  initialParties: Party[];
};

export default function GuestManager({ initialGuests, initialParties }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [parties, setParties] = useState<Party[]>(initialParties);
  const [name, setName] = useState("");
  const [partyLabel, setPartyLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");

  const partyById = useMemo(() => new Map(parties.map((p) => [p.id, p])), [parties]);

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q)) return false;
      if (relationFilter && g.relation !== relationFilter) return false;
      if (statusFilter && g.invite_status !== statusFilter) return false;
      if (partyFilter && g.party_id !== partyFilter) return false;
      return true;
    });
  }, [guests, search, relationFilter, statusFilter, partyFilter]);

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
    if (data.guest.party_id && !partyById.has(data.guest.party_id)) {
      refreshParties();
    }
    setName("");
    setPartyLabel("");
  }

  async function addBulkGuests(e: React.FormEvent) {
    e.preventDefault();
    const rows = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [namePart, ...rest] = line.split(",");
        return {
          name: namePart.trim(),
          party_label: rest.join(",").trim() || null,
        };
      })
      .filter((row) => row.name.length > 0);

    if (rows.length === 0) return;

    setBusy(true);
    setError(null);
    setBulkStatus(null);

    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: rows }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not add guests.");
      return;
    }

    setGuests((prev) =>
      [...prev, ...data.guests].sort((a, b) => a.name.localeCompare(b.name))
    );
    refreshParties();
    setBulkStatus(`Added ${data.guests.length} guest${data.guests.length === 1 ? "" : "s"}.`);
    setBulkText("");
  }

  async function removeGuest(id: string) {
    setBusy(true);
    const res = await fetch(`/api/guests?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
    }
  }

  async function refreshParties() {
    const res = await fetch("/api/parties");
    if (res.ok) {
      const data = await res.json();
      setParties(data.parties);
    }
  }

  async function updateGuest(id: string, update: Record<string, unknown>) {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...update } : g)));
    const res = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...update }),
    });
    if (res.ok) {
      const data = await res.json();
      setGuests((prev) => prev.map((g) => (g.id === id ? data.guest : g)));
    }
  }

  async function assignParty(guestId: string, value: string) {
    if (value === "__new__") {
      const label = window.prompt("New party name (e.g. Matthew & Leslie Perry)");
      if (!label || !label.trim()) return;
      const res = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setParties((prev) =>
        prev.some((p) => p.id === data.party.id)
          ? prev
          : [...prev, data.party].sort((a, b) => a.label.localeCompare(b.label))
      );
      await updateGuest(guestId, { party_id: data.party.id });
      return;
    }
    await updateGuest(guestId, { party_id: value || null });
  }

  return (
    <div className="rounded border border-ochre/25 bg-white/70 p-6">
      <h2 className="font-display text-xl italic text-ink">Guest list</h2>
      <p className="mt-1 font-sans text-xs text-ink/60">
        Names added here populate the rooming picker on the public RSVP form.
        Group guests into a party (e.g. a couple) so they can be selected
        together with one click.
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

      <button
        type="button"
        onClick={() => setBulkOpen((v) => !v)}
        className="mt-3 font-sans text-xs uppercase tracking-wider text-clay hover:underline"
      >
        {bulkOpen ? "Hide bulk add" : "Bulk add a list"}
      </button>

      {bulkOpen && (
        <form onSubmit={addBulkGuests} className="mt-3 space-y-2">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={"One guest per line, e.g.\nJane Smith\nJohn Smith, Rivera family"}
            className="w-full resize-y rounded border border-ochre/35 bg-cream px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ochre"
          />
          <p className="font-sans text-xs text-ink/60">
            One name per line. Add a party label after a comma, e.g. &ldquo;Matthew Perry, Matthew &amp; Leslie Perry&rdquo; (optional) — matching labels are grouped into the same party automatically.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-ink px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-cream hover:bg-clay disabled:opacity-60"
          >
            Add all
          </button>
          {bulkStatus && <p className="font-sans text-sm text-sage">{bulkStatus}</p>}
        </form>
      )}

      {error && <p className="mt-2 font-sans text-sm text-clay">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-ochre/15 pt-4">
        <input
          type="search"
          placeholder="Search guests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[160px] flex-1 rounded border border-ochre/35 bg-cream px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ochre"
        />
        <select
          value={partyFilter}
          onChange={(e) => setPartyFilter(e.target.value)}
          className="rounded border border-ochre/35 bg-cream px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ochre"
        >
          <option value="">All parties</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={relationFilter}
          onChange={(e) => setRelationFilter(e.target.value)}
          className="rounded border border-ochre/35 bg-cream px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ochre"
        >
          <option value="">All relations</option>
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-ochre/35 bg-cream px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ochre"
        >
          <option value="">All statuses</option>
          {INVITE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 max-h-[32rem] overflow-auto rounded border border-ochre/15">
        <table className="w-full text-left font-sans text-sm">
          <thead className="sticky top-0 bg-sand">
            <tr className="text-xs uppercase tracking-wider text-ink/50">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Party</th>
              <th className="px-3 py-2">Relation</th>
              <th className="px-3 py-2">Invite status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => (
              <tr key={guest.id} className="border-t border-ochre/10">
                <td className="px-3 py-2 text-ink">{guest.name}</td>
                <td className="px-3 py-2">
                  <select
                    value={guest.party_id ?? ""}
                    onChange={(e) => assignParty(guest.id, e.target.value)}
                    className="rounded border border-ochre/35 bg-cream px-2 py-1 font-sans text-xs text-ink outline-none focus:border-ochre"
                  >
                    <option value="">— None —</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                    <option value="__new__">+ New party…</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={guest.relation ?? ""}
                    onChange={(e) =>
                      updateGuest(guest.id, { relation: e.target.value || null } as {
                        relation: Relation | null;
                      })
                    }
                    className="rounded border border-ochre/35 bg-cream px-2 py-1 font-sans text-xs text-ink outline-none focus:border-ochre"
                  >
                    <option value="">— None —</option>
                    {RELATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={guest.invite_status ?? ""}
                    onChange={(e) =>
                      updateGuest(guest.id, {
                        invite_status: (e.target.value || null) as InviteStatus | null,
                      })
                    }
                    className="rounded border border-ochre/35 bg-cream px-2 py-1 font-sans text-xs text-ink outline-none focus:border-ochre"
                  >
                    <option value="">— None —</option>
                    {INVITE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeGuest(guest.id)}
                    disabled={busy}
                    className="font-sans text-xs uppercase tracking-wider text-clay hover:underline disabled:opacity-60"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-ink/50">
                  No guests match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-sans text-xs text-ink/50">
        Showing {filteredGuests.length} of {guests.length} guests.
      </p>
    </div>
  );
}
