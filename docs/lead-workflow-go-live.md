# Lead Workflow Go-Live Checklist

Production target: `patrickleezepeda.com`  
Stack: Netlify Functions + Supabase + Resend  
Reply domain truth: `REPLY_DOMAIN=patrickleezepeda.com`

---

## 1) Netlify Environment Variables

Set these in Netlify (`Site configuration -> Environment variables`):

### Required

- `SUPABASE_URL=https://<your-project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `RESEND_API_KEY=<resend-api-key>`
- `RESEND_WEBHOOK_SECRET=<long-random-secret>`
- `FROM_EMAIL=Patrick <hello@your-sending-domain.com>`
- `REPLY_DOMAIN=patrickleezepeda.com`
- `DRY_RUN=true` (start safe; flip to `false` when ready)

### Recommended

- `FOLLOWUPS_CRON_SECRET=<long-random-secret>`

### Optional

- `APP_URL=https://patrickleezepeda.com`

### Do not use mismatched names

- Use `REPLY_DOMAIN` (not `REPLYDOMAIN`)
- Use `DRY_RUN` (not `DRYRUN`)
- Use `SUPABASE_SERVICE_ROLE_KEY` exactly
- Use `FOLLOWUPS_CRON_SECRET` exactly

---

## 2) Supabase SQL Checklist

Run the schema and patches needed for the CRM flow.

### A. Base schema / security

Run:

- `supabase/schema.sql`
- `supabase/patches/001_security_hardening.sql` (if applicable to your environment)

### B. Optional payload patch

Run:

- `supabase/patches/002_contacts_raw_payload_optional.sql` (optional field support)

### C. Enforce one contact per normalized email

Run:

- `supabase/patches/003_contacts_normalized_email_unique.sql`

If patch `003` fails due to existing duplicates, clean duplicates first.

Duplicate finder:

```sql
select
  lower(btrim(email)) as normalized_email,
  count(*) as row_count
from public.contacts
where email is not null and btrim(email) <> ''
group by lower(btrim(email))
having count(*) > 1
order by row_count desc, normalized_email asc;
```

After cleanup, rerun patch `003`.

---

## 3) Resend Setup

1. Verify `patrickleezepeda.com` as sending domain.
2. Configure inbound email on `patrickleezepeda.com` (root domain setup).
3. Add webhook endpoint:
   - `https://patrickleezepeda.com/api/resend-inbound-webhook`
4. Include header in webhook config:
   - `Authorization: Bearer <RESEND_WEBHOOK_SECRET>`

---

## 4) Deploy / Runtime Endpoints

Expected production endpoints:

- `https://patrickleezepeda.com/api/create-contact`
- `https://patrickleezepeda.com/api/resend-inbound-webhook`
- `https://patrickleezepeda.com/api/send-followups`

---

## 5) One Clean Live Submission Test

Use one new real email address that has never been submitted before.

### Step 1: Submit once from site UI

Submit either:

- Contact modal flow, or
- Chatbot lead flow

Both should hit `POST /api/create-contact`.

### Step 2: Verify API response contract

Expect JSON:

```json
{
  "ok": true,
  "created": true,
  "updated": false,
  "contactId": "...",
  "threadId": "...",
  "welcomeEmailSent": true,
  "message": "Contact created and submission logged."
}
```

`welcomeEmailSent` may be `false` if welcome send fails or is skipped.

### Step 3: Verify Supabase rows

Check contact uniqueness:

```sql
select id, email, name, created_at, updated_at
from public.contacts
where lower(btrim(email)) = lower(btrim('<test-email>'));
```

Expected: exactly 1 row.

Check inquiry thread:

```sql
select id, contact_id, subject, reply_address, last_message_at
from public.email_threads
where contact_id = '<contact-id>'
order by created_at desc;
```

Expected: inquiry thread present; no duplicate contact linkage.

Check logged messages:

```sql
select direction, subject, from_email, to_email, sent_at, raw_payload
from public.email_messages
where thread_id = '<thread-id>'
order by sent_at asc;
```

Expected:

- at least one `inbound` message for the form submission
- one `outbound` welcome message at most for first-time contact

---

## 6) Repeat Submission Test (Same Email)

Submit again with the same email.

Expected response pattern:

- `ok: true`
- `created: false`
- `updated: true`
- same logical contact reused (no second contact row)
- `welcomeEmailSent: false`

Verify in SQL:

```sql
select count(*) as contact_count
from public.contacts
where lower(btrim(email)) = lower(btrim('<test-email>'));
```

Expected: `contact_count = 1`

---

## 7) Follow-up Sender Safety Test

With `DRY_RUN=true`, trigger:

```bash
curl -i -H "Authorization: Bearer $FOLLOWUPS_CRON_SECRET" \
  https://patrickleezepeda.com/api/send-followups
```

Expected:

- response includes `dry_run: true`
- outbound message logs created with dry-run metadata
- no live sends

When ready, set `DRY_RUN=false`.

---

## 8) Final Production Assertions

- No contact duplicates by normalized email.
- Welcome email originates only from `create-contact` first-contact path.
- Repeat submissions update + log only; they do not create new contacts.
- Reply routing remains root-domain based:
  - `REPLY_DOMAIN=patrickleezepeda.com`
  - reply addresses: `r-<token>@patrickleezepeda.com`
