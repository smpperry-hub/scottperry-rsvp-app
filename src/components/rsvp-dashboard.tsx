"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Rsvp, RsvpType } from "@/lib/supabase/types";

export type RsvpWithRoommates = Rsvp & { roommates: { id: string; name: string }[] };

async function fetchDashboardData(
  supabase: ReturnType<typeof createClient>
): Promise<RsvpWithRoommates[]> {
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("*")
    .order("submitted_at", { ascending: false });

  const { data: roomingRows } = await supabase
    .from("rooming_preferences")
    .select("rsvp_id, roommate_guest_id, guests(id, name)");

  const roomingByRsvp = new Map<string, { id: string; name: string }[]>();
  for (const row of roomingRows ?? []) {
    const guest = Array.isArray(row.guests) ? row.guests[0] : row.guests;
    if (!guest) continue;
    const list = roomingByRsvp.get(row.rsvp_id) ?? [];
    list.push({ id: guest.id, name: guest.name });
    roomingByRsvp.set(row.rsvp_id, list);
  }

  return (rsvps ?? []).map((rsvp) => ({
    ...rsvp,
    roommates: roomingByRsvp.get(rsvp.id) ?? [],
  }));
}

export default function RsvpDashboard({
  initial,
  defaultType,
}: {
  initial: RsvpWithRoommates[];
  defaultType: RsvpType;
}) {
  const [allRsvps, setAllRsvps] = useState<RsvpWithRoommates[]>(initial);
  const [activeType, setActiveType] = useState<RsvpType>(defaultType);

  useEffect(() => {
    const supabase = createClient();

    const refresh = () => {
      fetchDashboardData(supabase).then(setAllRsvps);
    };

    const channel = supabase
      .channel("dashboard-rsvps")
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, refresh)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooming_preferences" },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const rsvps = allRsvps.filter((r) => r.rsvp_type === activeType);
  const stdCount = allRsvps.filter((r) => r.rsvp_type === "save_the_date").length;
  const fiCount = allRsvps.filter((r) => r.rsvp_type === "formal_invite").length;

  const total = rsvps.length;
  const attending = rsvps.filter((r) => r.attending).length;
  const declined = rsvps.filter((r) => !r.attending).length;

  const nameById = new Map(rsvps.map((r) => [r.id, r.full_name]));
  const submittedByName = (rsvp: RsvpWithRoommates) =>
    rsvp.submitted_by_rsvp_id ? nameById.get(rsvp.submitted_by_rsvp_id) ?? "—" : "—";

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveType("save_the_date")}
          className={`rounded-full px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider transition-colors ${
            activeType === "save_the_date"
              ? "bg-ink text-cream"
              : "bg-white/70 text-ink/60 hover:bg-sand"
          }`}
        >
          Save the Date ({stdCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveType("formal_invite")}
          className={`rounded-full px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider transition-colors ${
            activeType === "formal_invite"
              ? "bg-ink text-cream"
              : "bg-white/70 text-ink/60 hover:bg-sand"
          }`}
        >
          Formal Invite ({fiCount})
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Responded" value={total} accent="text-ink" />
        <StatCard label="Attending" value={attending} accent="text-sage" />
        <StatCard label="Declined" value={declined} accent="text-clay" />
      </div>

      {/* Table view - md and up */}
      <div className="hidden overflow-x-auto rounded border border-ochre/25 bg-white/70 md:block">
        <table className="w-full text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-ochre/20 text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Rooming with</th>
              <th className="px-4 py-3">Room type</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Submitted by</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((rsvp) => (
              <tr key={rsvp.id} className="border-b border-ochre/10 align-top">
                <td className="px-4 py-3 font-medium text-ink">{rsvp.full_name}</td>
                <td className="px-4 py-3">
                  <StatusPill attending={rsvp.attending} />
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {rsvp.email && <div>{rsvp.email}</div>}
                  {rsvp.phone && <div>{rsvp.phone}</div>}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {rsvp.roommates.length > 0
                    ? rsvp.roommates.map((r) => r.name).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-ink/70">{rsvp.room_type_preference || "—"}</td>
                <td className="px-4 py-3 max-w-xs text-ink/70">{rsvp.notes || "—"}</td>
                <td className="px-4 py-3 text-ink/70">{submittedByName(rsvp)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink/50">
                  {new Date(rsvp.submitted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {rsvps.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink/50">
                  No responses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card view - below md */}
      <div className="space-y-3 md:hidden">
        {rsvps.length === 0 && (
          <div className="rounded border border-ochre/25 bg-white/70 px-4 py-8 text-center text-ink/50">
            No responses yet.
          </div>
        )}
        {rsvps.map((rsvp) => (
          <div key={rsvp.id} className="rounded border border-ochre/25 bg-white/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-ink">{rsvp.full_name}</p>
              <StatusPill attending={rsvp.attending} />
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              {(rsvp.email || rsvp.phone) && (
                <CardField label="Contact">
                  {rsvp.email && <div>{rsvp.email}</div>}
                  {rsvp.phone && <div>{rsvp.phone}</div>}
                </CardField>
              )}
              {rsvp.roommates.length > 0 && (
                <CardField label="Rooming with">
                  {rsvp.roommates.map((r) => r.name).join(", ")}
                </CardField>
              )}
              {rsvp.room_type_preference && (
                <CardField label="Room type">{rsvp.room_type_preference}</CardField>
              )}
              {rsvp.notes && <CardField label="Notes">{rsvp.notes}</CardField>}
              {rsvp.submitted_by_rsvp_id && (
                <CardField label="Submitted by">{submittedByName(rsvp)}</CardField>
              )}
              <CardField label="Submitted">
                {new Date(rsvp.submitted_at).toLocaleDateString()}
              </CardField>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ attending }: { attending: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
        attending ? "bg-sage/15 text-sage" : "bg-clay/15 text-clay"
      }`}
    >
      {attending ? "Attending" : "Declined"}
    </span>
  );
}

function CardField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 font-sans text-xs uppercase tracking-wider text-ink/50">
        {label}
      </dt>
      <dd className="text-ink/80">{children}</dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded border border-ochre/25 bg-white/70 p-6 text-center">
      <p className="font-sans text-xs uppercase tracking-wider text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-4xl ${accent}`}>{value}</p>
    </div>
  );
}
