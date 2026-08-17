-- Parties (households/couples) that guests belong to, so the rooming
-- picker can offer "select this whole party" instead of hunting for each
-- person individually. Also adds host-only planning metadata to guests:
-- invite_status (are they a firm invite or on the waitlist) and relation
-- (which side/circle of the wedding they belong to).

create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_at timestamptz default now()
);

alter table parties enable row level security;

create policy "parties_public_select" on parties
  for select to anon
  using (true);

create policy "parties_host_all" on parties
  for all to authenticated
  using (true)
  with check (true);

alter table guests add column if not exists party_id uuid references parties(id) on delete set null;
alter table guests add column if not exists invite_status text;
alter table guests add column if not exists relation text;

alter table guests drop constraint if exists guests_invite_status_check;
alter table guests add constraint guests_invite_status_check
  check (invite_status is null or invite_status in ('for_sure', 'waitlist'));

alter table guests drop constraint if exists guests_relation_check;
alter table guests add constraint guests_relation_check
  check (relation is null or relation in (
    'Scott Immediate Family',
    'Mia Immediate Family',
    'Mia Home Friends',
    'Scott Home Friends',
    'Joint Friends',
    'Scott College Friends',
    'Mia College Friends',
    'Scott Extended Family',
    'Mia Extended Family'
  ));

-- Migrate the old free-text party_label into real parties rows, then
-- drop the column. Skipped harmlessly if party_label no longer exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'guests' and column_name = 'party_label'
  ) then
    insert into parties (label)
    select distinct party_label from guests
    where party_label is not null and trim(party_label) <> '';

    update guests g
    set party_id = p.id
    from parties p
    where g.party_label = p.label;

    alter table guests drop column party_label;
  end if;
end $$;
