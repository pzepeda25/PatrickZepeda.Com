-- =============================================================================
-- Lightweight Email CRM + Segmentation — schema setup
-- =============================================================================
-- Paste this entire file into the Supabase SQL editor and run it.
--
-- Safe to re-run: every statement is additive and idempotent.
--   * CREATE TABLE IF NOT EXISTS
--   * ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--   * CREATE OR REPLACE VIEW
--   * Seed inserts use ON CONFLICT DO NOTHING and only fire when tables are empty
--
-- It does NOT drop, rename, or truncate anything.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- for gen_random_uuid()


-- -----------------------------------------------------------------------------
-- 1. Defensive column patches on the 3 existing tables
--    Only adds columns that the segmentation views and Netlify functions need.
--    Will silently no-op if the column already exists.
-- -----------------------------------------------------------------------------

-- contacts: make sure the segmentation columns exist
alter table public.contacts add column if not exists type              text;
alter table public.contacts add column if not exists status            text;
alter table public.contacts add column if not exists source            text;
alter table public.contacts add column if not exists last_contacted_at timestamptz;
alter table public.contacts add column if not exists created_at        timestamptz not null default now();
alter table public.contacts add column if not exists updated_at        timestamptz not null default now();

-- email_threads: make sure reply_address + last_message_at exist
alter table public.email_threads add column if not exists reply_address    text;
alter table public.email_threads add column if not exists last_message_at  timestamptz;
alter table public.email_threads add column if not exists created_at       timestamptz not null default now();

-- email_messages: make sure direction + raw_payload exist
alter table public.email_messages add column if not exists direction         text;
alter table public.email_messages add column if not exists raw_payload       jsonb;
alter table public.email_messages add column if not exists resend_message_id text;
alter table public.email_messages add column if not exists sent_at           timestamptz not null default now();


-- -----------------------------------------------------------------------------
-- 2. New tables: tags, contact_tags
-- -----------------------------------------------------------------------------

create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  label      text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_tags (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id     uuid not null references public.tags(id)     on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

create index if not exists contact_tags_tag_id_idx     on public.contact_tags(tag_id);
create index if not exists contact_tags_contact_id_idx on public.contact_tags(contact_id);


-- -----------------------------------------------------------------------------
-- 3. Helpful indexes for the segment views and webhook lookups
-- -----------------------------------------------------------------------------

create index if not exists contacts_type_status_idx
  on public.contacts (type, status);

create index if not exists contacts_last_contacted_at_idx
  on public.contacts (last_contacted_at);

create unique index if not exists email_threads_reply_address_uidx
  on public.email_threads (reply_address)
  where reply_address is not null;

create index if not exists email_messages_thread_id_idx
  on public.email_messages (thread_id);


-- -----------------------------------------------------------------------------
-- 4. Segment views
-- -----------------------------------------------------------------------------

-- Views use `security_invoker = true` so they respect the caller's RLS rather
-- than running as the view owner (the SECURITY DEFINER trap that the Supabase
-- advisor warns about).

create or replace view public.segment_all_leads
  with (security_invoker = true) as
  select *
  from public.contacts
  where type = 'lead';

create or replace view public.segment_warm_leads
  with (security_invoker = true) as
  select *
  from public.contacts
  where type = 'lead'
    and status = 'warm';

create or replace view public.segment_clients
  with (security_invoker = true) as
  select *
  from public.contacts
  where type = 'client';

create or replace view public.segment_needs_followup
  with (security_invoker = true) as
  select *
  from public.contacts
  where status in ('new', 'warm')
    and (
      last_contacted_at is null
      or last_contacted_at < now() - interval '7 days'
    );


-- -----------------------------------------------------------------------------
-- 5. Tiny safe seed data — ONLY if every relevant table is empty.
--    Wrapped in a DO block so re-running is a no-op once data exists.
-- -----------------------------------------------------------------------------
do $$
declare
  v_contact_a uuid;
  v_contact_b uuid;
  v_tag_lead  uuid;
  v_tag_warm  uuid;
  v_tag_vip   uuid;
  v_thread    uuid;
begin
  if (select count(*) from public.contacts)       = 0
  and (select count(*) from public.tags)          = 0
  and (select count(*) from public.email_threads) = 0
  then
    -- 2 contacts
    insert into public.contacts (email, name, type, status, source)
      values ('sample.lead@example.test',   'Sample Lead',   'lead',   'warm', 'seed')
      returning id into v_contact_a;

    insert into public.contacts (email, name, type, status, source)
      values ('sample.client@example.test', 'Sample Client', 'client', 'active', 'seed')
      returning id into v_contact_b;

    -- 3 tags
    insert into public.tags (slug, label) values ('lead', 'Lead')   returning id into v_tag_lead;
    insert into public.tags (slug, label) values ('warm', 'Warm')   returning id into v_tag_warm;
    insert into public.tags (slug, label) values ('vip',  'VIP')    returning id into v_tag_vip;

    -- contact_tags links
    insert into public.contact_tags (contact_id, tag_id) values
      (v_contact_a, v_tag_lead),
      (v_contact_a, v_tag_warm),
      (v_contact_b, v_tag_vip)
    on conflict do nothing;

    -- 1 thread (seed/demo only; non-production placeholder reply domain)
    insert into public.email_threads (contact_id, subject, reply_address, last_message_at)
      values (
        v_contact_a,
        'Welcome — happy to chat',
        'seed-' || replace(gen_random_uuid()::text, '-', '') || '@reply.example.test',
        now()
      )
      returning id into v_thread;

    -- 2 messages (one outbound, one inbound)
    insert into public.email_messages
      (thread_id, direction, subject, text_body, from_email, to_email, sent_at)
    values
      (v_thread, 'outbound', 'Welcome — happy to chat',
        'Hi! Thanks for reaching out. Want to set up a quick call?',
        'hello@example.test', 'sample.lead@example.test', now() - interval '1 day'),
      (v_thread, 'inbound',  'Re: Welcome — happy to chat',
        'Yes please — sometime next week works.',
        'sample.lead@example.test', 'hello@example.test', now());
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 6. Row Level Security — backend-only access pattern
--
--    Strategy: enable RLS on every table with NO policies for anon/authenticated.
--    The Netlify functions use the SERVICE ROLE key, which bypasses RLS, so the
--    backend keeps full access. The browser (using anon key, if you ever add it)
--    sees nothing — which is what you want for a CRM.
--
--    To later expose a specific read endpoint to the browser, add a policy like:
--      create policy "anon can read tags" on public.tags
--        for select to anon using (true);
-- -----------------------------------------------------------------------------

alter table public.contacts        enable row level security;
alter table public.email_threads   enable row level security;
alter table public.email_messages  enable row level security;
alter table public.tags            enable row level security;
alter table public.contact_tags    enable row level security;

-- Views inherit security from their underlying tables, no RLS needed on them.

-- =============================================================================
-- Done. Verify with:
--   select count(*) from public.segment_all_leads;
--   select count(*) from public.segment_warm_leads;
--   select count(*) from public.segment_clients;
--   select count(*) from public.segment_needs_followup;
-- =============================================================================
