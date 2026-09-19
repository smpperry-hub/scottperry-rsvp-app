-- Allows a "Maybe" response on the Save the Date form. attending stays
-- true/false for a firm yes/no; null means "maybe" and is only ever
-- written by the save_the_date flow (Formal Invite still requires a
-- definite true/false, enforced in the API route, not the database).

alter table rsvps alter column attending drop not null;
