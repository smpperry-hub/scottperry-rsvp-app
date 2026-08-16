export type Guest = {
  id: string;
  name: string;
  party_label: string | null;
  created_at: string;
};

export type Rsvp = {
  id: string;
  guest_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  attending: boolean;
  notes: string | null;
  submitted_at: string;
};

export type RoomingPreference = {
  rsvp_id: string;
  roommate_guest_id: string;
};
