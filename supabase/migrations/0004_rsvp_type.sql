-- Distinguishes Save the Date responses from Formal Invite responses so
-- the same guest can reply to each independently. Existing rows backfill
-- as 'formal_invite' since that's what the single form collected so far.

alter table rsvps
  add column if not exists rsvp_type text not null default 'formal_invite';

alter table rsvps
  drop constraint if exists rsvps_rsvp_type_check;

alter table rsvps
  add constraint rsvps_rsvp_type_check
  check (rsvp_type in ('save_the_date', 'formal_invite'));
