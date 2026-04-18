-- =============================================================================
-- Security hardening patch — addresses the two Supabase advisor warnings
-- =============================================================================
--
-- Why this exists:
--   1. The `create_segmentation_views` migration created the segment views with
--      SECURITY DEFINER. That makes them run with the creator's permissions,
--      bypassing RLS on the underlying tables. Supabase advisor flags this.
--   2. RLS is currently disabled on the public CRM tables. Even though our
--      Netlify functions use the service-role key (which bypasses RLS), the
--      anon key would otherwise have full access. We turn RLS on with NO
--      policies — anon/authenticated see nothing, service role still works.
--
-- This patch:
--   * Is idempotent — safe to re-run.
--   * Does NOT drop, rename, or truncate any table.
--   * Does NOT add any policy. Backend-only access pattern preserved.
--   * Recreates the four segment views with `security_invoker = true` so they
--     respect the caller's RLS, the way Postgres views should normally behave.
--
-- Paste this whole file into the Supabase SQL editor and run it.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Belt-and-suspenders: ensure contacts.last_contacted_at exists.
--
-- segment_needs_followup depends on this column. The intended schema includes
-- it, but if an earlier migration skipped it the view recreation would fail
-- and the whole patch would roll back. Adding it `if not exists` is additive
-- and idempotent — no-op if the column is already there.
-- -----------------------------------------------------------------------------

alter table public.contacts
  add column if not exists last_contacted_at timestamptz;


-- -----------------------------------------------------------------------------
-- 1. Recreate segment views without SECURITY DEFINER.
--
-- We DROP + CREATE so we shed the SECURITY DEFINER attribute cleanly. This is
-- safe: views hold no data. The names, columns, and semantics are identical
-- to before.
-- -----------------------------------------------------------------------------

drop view if exists public.segment_all_leads;
drop view if exists public.segment_warm_leads;
drop view if exists public.segment_clients;
drop view if exists public.segment_needs_followup;

create view public.segment_all_leads
  with (security_invoker = true) as
  select *
  from public.contacts
  where type = 'lead';

create view public.segment_warm_leads
  with (security_invoker = true) as
  select *
  from public.contacts
  where type = 'lead'
    and status = 'warm';

create view public.segment_clients
  with (security_invoker = true) as
  select *
  from public.contacts
  where type = 'client';

create view public.segment_needs_followup
  with (security_invoker = true) as
  select *
  from public.contacts
  where status in ('new', 'warm')
    and (
      last_contacted_at is null
      or last_contacted_at < now() - interval '7 days'
    );


-- -----------------------------------------------------------------------------
-- 2. Enable RLS on every CRM table.
--
-- `enable row level security` is idempotent — repeated calls are a no-op.
-- We deliberately add NO policies. Result:
--   * anon role          → 0 rows visible (even though authenticated)
--   * authenticated role → 0 rows visible
--   * service_role       → full access (bypasses RLS)
--
-- The two Netlify functions use the service-role key, so they're unaffected.
-- -----------------------------------------------------------------------------

alter table public.contacts        enable row level security;
alter table public.email_threads   enable row level security;
alter table public.email_messages  enable row level security;
alter table public.tags            enable row level security;
alter table public.contact_tags    enable row level security;


-- -----------------------------------------------------------------------------
-- 3. Verification queries — run these after the patch to confirm.
--
-- All four should return `security_invoker=true`:
--   select c.relname, c.reloptions
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public'
--     and c.relname like 'segment_%';
--
-- All five should return rowsecurity=true:
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in ('contacts','email_threads','email_messages','tags','contact_tags');
--
-- Segment views should still return rows when run as service role / SQL editor:
--   select count(*) from public.segment_all_leads;
--   select count(*) from public.segment_warm_leads;
--   select count(*) from public.segment_clients;
--   select count(*) from public.segment_needs_followup;
-- =============================================================================
