-- Enforce one contact row per normalized email.
-- Run duplicate cleanup first if this index fails.

create unique index if not exists contacts_email_normalized_uidx
  on public.contacts ((lower(btrim(email))))
  where email is not null and btrim(email) <> '';
