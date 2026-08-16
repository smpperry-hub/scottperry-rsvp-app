-- Wedding RSVP schema + RLS policies
-- Run in the Supabase SQL editor, or via `supabase db push` once the CLI is linked.

create extension if not exists pgcrypto;

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  party_label text,
  created_at timestamptz default now()
);

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests(id),
  full_name text not null,
  email text,
  phone text,
  attending boolean not null,
  notes text,
  submitted_at timestamptz default now()
);

create table if not exists rooming_preferences (
  rsvp_id uuid references rsvps(id) on delete cascade,
  roommate_guest_id uuid references guests(id),
  primary key (rsvp_id, roommate_guest_id)
);

alter table guests enable row level security;
alter table rsvps enable row level security;
alter table rooming_preferences enable row level security;

-- guests: public can read (needed for the rooming picker), hosts get full CRUD
create policy "guests_public_select" on guests
  for select to anon
  using (true);

create policy "guests_host_all" on guests
  for all to authenticated
  using (true)
  with check (true);

-- rsvps: public can submit, hosts can read/update/delete
create policy "rsvps_public_insert" on rsvps
  for insert to anon
  with check (true);

create policy "rsvps_host_select" on rsvps
  for select to authenticated
  using (true);

create policy "rsvps_host_update" on rsvps
  for update to authenticated
  using (true)
  with check (true);

create policy "rsvps_host_delete" on rsvps
  for delete to authenticated
  using (true);

-- rooming_preferences: public can submit alongside their rsvp, hosts can read/update/delete
create policy "rooming_public_insert" on rooming_preferences
  for insert to anon
  with check (true);

create policy "rooming_host_select" on rooming_preferences
  for select to authenticated
  using (true);

create policy "rooming_host_update" on rooming_preferences
  for update to authenticated
  using (true)
  with check (true);

create policy "rooming_host_delete" on rooming_preferences
  for delete to authenticated
  using (true);

-- Realtime: make sure changes stream to subscribed dashboard clients
alter publication supabase_realtime add table rsvps;
alter publication supabase_realtime add table rooming_preferences;
