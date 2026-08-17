"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Rsvp } from "@/lib/supabase/types";

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

export default function RsvpDashboard({ initial }: { initial: RsvpWithRoommates[] }) {
  const [rsvps, setRsvps] = useState<RsvpWithRoommates[]>(initial);

  useEffect(() => {
    const supabase = createClient();

    const refresh = () => {
      fetchDashboardData(supabase).then(setRsvps);
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

  const total = rsvps.length;
  const attending = rsvps.filter((r) => r.attending).length;
  const declined = rsvps.filter((r) => !r.attending).length;

  const nameById = new Map(rsvps.map((r) => [r.id, r.full_name]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Responded" value={total} accent="text-ink" />
        <StatCard label="Attending" value={attending} accent="text-sage" />
        <StatCard label="Declined" value={declined} accent="text-clay" />
      </div>

      <div className="overflow-x-auto rounded border border-ochre/25 bg-white/70">
        <table className="w-full text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-ochre/20 text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Rooming with</th>
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
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      rsvp.attending
                        ? "bg-sage/15 text-sage"
                        : "bg-clay/15 text-clay"
                    }`}
                  >
                    {rsvp.attending ? "Attending" : "Declined"}
                  </span>
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
                <td className="px-4 py-3 max-w-xs text-ink/70">{rsvp.notes || "—"}</td>
                <td className="px-4 py-3 text-ink/70">
                  {rsvp.submitted_by_rsvp_id
                    ? nameById.get(rsvp.submitted_by_rsvp_id) ?? "—"
                    : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink/50">
                  {new Date(rsvp.submitted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {rsvps.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink/50">
                  No responses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
