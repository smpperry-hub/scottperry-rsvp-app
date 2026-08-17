export type InviteStatus = "for_sure" | "waitlist";

export const RELATIONS = [
  "Scott Immediate Family",
  "Mia Immediate Family",
  "Mia Home Friends",
  "Scott Home Friends",
  "Joint Friends",
  "Scott College Friends",
  "Mia College Friends",
  "Scott Extended Family",
  "Mia Extended Family",
] as const;

export type Relation = (typeof RELATIONS)[number];

export type Party = {
  id: string;
  label: string;
  created_at: string;
};

export type Guest = {
  id: string;
  name: string;
  party_id: string | null;
  invite_status: InviteStatus | null;
  relation: Relation | null;
  created_at: string;
};

export type RsvpType = "save_the_date" | "formal_invite";

export type Rsvp = {
  id: string;
  guest_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  attending: boolean;
  notes: string | null;
  submitted_at: string;
  submitted_by_rsvp_id: string | null;
  room_type_preference: string | null;
  rsvp_type: RsvpType;
};

export type RoomingPreference = {
  rsvp_id: string;
  roommate_guest_id: string;
};
