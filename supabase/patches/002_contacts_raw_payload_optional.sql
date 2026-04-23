-- Optional patch: allows storing non-core lead fields on contacts.
-- Primary implementation works without this column.
alter table public.contacts
  add column if not exists raw_payload jsonb;
