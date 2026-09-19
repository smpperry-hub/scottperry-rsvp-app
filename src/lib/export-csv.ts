// Shared by the dashboard export route and the weekly backup script.
// Keep this file free of imports so Node can run it directly.

export type GuestRow = {
  id: string;
  name: string;
  party_id: string | null;
  invite_status: string | null;
  relation: string | null;
  created_at: string;
};

export type PartyRow = { id: string; label: string; created_at: string };

export type RsvpRow = {
  id: string;
  rsvp_type: string;
  full_name: string;
  attending: boolean | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  room_type_preference: string | null;
  submitted_by_rsvp_id: string | null;
  submitted_at: string;
};

export type RoomingRow = { rsvp_id: string; roommate_guest_id: string };

const BOM = "﻿"; // lets Excel read names with accents correctly

const STATUS_LABEL: Record<string, string> = { for_sure: "For sure", waitlist: "Waitlist" };
const TYPE_LABEL: Record<string, string> = {
  save_the_date: "Save the Date",
  formal_invite: "Formal Invite",
};

// Exports contain text typed by the public, so stop spreadsheet apps from
// running a cell that starts with = + - @ as a formula. Phone numbers such
// as "+1 (555) 123-4567" are left alone.
function neutralize(value: string): string {
  if (/^[=+\-@\t\r]/.test(value) && !/^[+-]?[\d\s().-]+$/.test(value)) return `'${value}`;
  return value;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = neutralize(String(value));
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(header: string[], rows: unknown[][]): string {
  return BOM + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function buildGuestsCsv(guests: GuestRow[], parties: PartyRow[]): string {
  const partyLabel = new Map(parties.map((p) => [p.id, p.label]));
  const rows = [...guests]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => [
      g.id,
      g.name,
      g.party_id ? (partyLabel.get(g.party_id) ?? "") : "",
      g.relation ?? "",
      g.invite_status ? (STATUS_LABEL[g.invite_status] ?? g.invite_status) : "",
      g.created_at,
    ]);
  return toCsv(["id", "name", "party", "relation", "invite_status", "created_at"], rows);
}

export function buildResponsesCsv(
  rsvps: RsvpRow[],
  rooming: RoomingRow[],
  guests: GuestRow[]
): string {
  const guestName = new Map(guests.map((g) => [g.id, g.name]));
  const rsvpName = new Map(rsvps.map((r) => [r.id, r.full_name]));
  const roommates = new Map<string, string[]>();
  for (const r of rooming) {
    const list = roommates.get(r.rsvp_id) ?? [];
    list.push(guestName.get(r.roommate_guest_id) ?? r.roommate_guest_id);
    roommates.set(r.rsvp_id, list);
  }

  const rows = [...rsvps]
    .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
    .map((r) => [
      r.id,
      TYPE_LABEL[r.rsvp_type] ?? r.rsvp_type,
      r.full_name,
      r.attending === true ? "Yes" : r.attending === false ? "No" : "Maybe",
      r.email ?? "",
      r.phone ?? "",
      r.notes ?? "",
      r.room_type_preference ?? "",
      (roommates.get(r.id) ?? []).join("; "),
      r.submitted_by_rsvp_id ? (rsvpName.get(r.submitted_by_rsvp_id) ?? "") : "",
      r.submitted_at,
    ]);

  return toCsv(
    [
      "id",
      "type",
      "name",
      "response",
      "email",
      "phone",
      "notes",
      "room_type",
      "roommates",
      "submitted_by",
      "submitted_at",
    ],
    rows
  );
}

// Raw tables, used only by the weekly backup so nothing is lost.
export function buildPartiesCsv(parties: PartyRow[]): string {
  return toCsv(
    ["id", "label", "created_at"],
    parties.map((p) => [p.id, p.label, p.created_at])
  );
}

export function buildRoomingCsv(rooming: RoomingRow[]): string {
  return toCsv(
    ["rsvp_id", "roommate_guest_id"],
    rooming.map((r) => [r.rsvp_id, r.roommate_guest_id])
  );
}
