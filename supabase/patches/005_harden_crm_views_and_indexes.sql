-- Make CRM segment views respect the caller's RLS permissions.
alter view if exists public.segment_warm_leads
  set (security_invoker = true);
alter view if exists public.segment_new_leads
  set (security_invoker = true);
alter view if exists public.segment_reactivation
  set (security_invoker = true);
alter view if exists public.segment_proposal_followup
  set (security_invoker = true);

-- Cover foreign keys used by CRM relationship queries and deletes.
create index if not exists contact_tags_tag_id_idx
  on public.contact_tags (tag_id);
create index if not exists email_messages_thread_id_idx
  on public.email_messages (thread_id);
create index if not exists email_threads_contact_id_idx
  on public.email_threads (contact_id);
create index if not exists lead_submissions_ip_created_at_idx
  on public.lead_submissions (ip_address, created_at desc);
