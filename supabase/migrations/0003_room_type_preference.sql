-- Lets guests tell the hosts whether they'd prefer a Studio or a
-- 1 Bedroom Suite. Free text (not an enum) so the option set can change
-- without a migration; the app only ever writes 'Studio', '1 Bedroom Suite',
-- or null.

alter table rsvps
  add column if not exists room_type_preference text;
