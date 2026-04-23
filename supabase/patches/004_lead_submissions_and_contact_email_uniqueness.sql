-- Lead-capture safety patch:
-- 1) store free-text form messages outside contacts (lead_submissions)
-- 2) enforce one contact per normalized email

create extension if not exists "pgcrypto";

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  form_name text,
  entry_path text,
  message text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_submissions_contact_id_idx
  on public.lead_submissions (contact_id);

create index if not exists lead_submissions_created_at_desc_idx
  on public.lead_submissions (created_at desc);

create unique index if not exists contacts_email_normalized_uidx
  on public.contacts ((lower(trim(email))));

alter table public.lead_submissions enable row level security;
