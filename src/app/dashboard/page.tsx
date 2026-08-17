import { createClient } from "@/lib/supabase/server";
import GuestManager from "@/components/guest-manager";
import RsvpDashboard, { type RsvpWithRoommates } from "@/components/rsvp-dashboard";
import { getActiveRsvpType } from "@/lib/get-guests";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: guests }, { data: parties }, { data: rsvps }, { data: roomingRows }] =
    await Promise.all([
      supabase.from("guests").select("*").order("name"),
      supabase.from("parties").select("*").order("label"),
      supabase.from("rsvps").select("*").order("submitted_at", { ascending: false }),
      supabase.from("rooming_preferences").select("rsvp_id, roommate_guest_id, guests(id, name)"),
    ]);

  const roomingByRsvp = new Map<string, { id: string; name: string }[]>();
  for (const row of roomingRows ?? []) {
    const guest = Array.isArray(row.guests) ? row.guests[0] : row.guests;
    if (!guest) continue;
    const list = roomingByRsvp.get(row.rsvp_id) ?? [];
    list.push({ id: guest.id, name: guest.name });
    roomingByRsvp.set(row.rsvp_id, list);
  }

  const initialRsvps: RsvpWithRoommates[] = (rsvps ?? []).map((rsvp) => ({
    ...rsvp,
    roommates: roomingByRsvp.get(rsvp.id) ?? [],
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <RsvpDashboard initial={initialRsvps} defaultType={getActiveRsvpType()} />
      <GuestManager initialGuests={guests ?? []} initialParties={parties ?? []} />
    </main>
  );
}
