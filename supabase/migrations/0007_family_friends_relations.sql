-- Adds "Mia Family Friends" and "Scott Family Friends" to the allowed
-- guest relations (they're used in the master invite spreadsheet).
-- Only widens the check constraint; no existing data is touched.

alter table guests drop constraint if exists guests_relation_check;
alter table guests add constraint guests_relation_check
  check (relation is null or relation in (
    'Scott Immediate Family',
    'Mia Immediate Family',
    'Mia Home Friends',
    'Scott Home Friends',
    'Mia Family Friends',
    'Scott Family Friends',
    'Joint Friends',
    'Scott College Friends',
    'Mia College Friends',
    'Scott Extended Family',
    'Mia Extended Family'
  ));
