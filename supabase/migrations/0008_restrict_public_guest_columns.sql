-- Public (anon) visitors may only read a guest's id, name and party.
-- invite_status and relation are host planning data (e.g. who is on the
-- waitlist) and must not be readable with the public anon key. Signed-in
-- hosts (authenticated role) and the server (service role) are unaffected.
--
-- Note: after this, anon requests using select=* (or naming any other
-- column) are rejected, so public code must list its columns explicitly.

revoke select on guests from anon;
grant select (id, name, party_id) on guests to anon;
