-- Tracks who submitted an RSVP on behalf of someone else (e.g. a +1 or
-- family member added via the "Additional Full Name(s)" field). Null means
-- the person submitted their own response.

alter table rsvps
  add column if not exists submitted_by_rsvp_id uuid references rsvps(id);
