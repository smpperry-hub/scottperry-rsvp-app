export type Guest = {
  id: string;
  name: string;
  party_label: string | null;
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
