# Email CRM — setup notes

Lightweight, Supabase-backed email CRM for the personal site. Data lives in
Supabase. Inbound + outbound email runs through Resend, glued together by two
Netlify Functions.

```
Resend inbound  →  POST /api/resend-inbound-webhook  →  Supabase
Cron / manual   →  GET  /api/send-followups          →  Resend  →  Supabase
```

---

## 1. Run the SQL

You'll have either one or two SQL files to paste, depending on the state of
your project.

**If this is a brand-new project** (no tables yet): paste
[`schema.sql`](./schema.sql) into the Supabase SQL editor and run it. It is
idempotent — safe to re-run. It already uses `security_invoker = true` on the
views and enables RLS, so the advisor will be happy.

**If your project already has the tables and segment views** (e.g. a previous
Cursor run or migration created them): only paste the patch
[`patches/001_security_hardening.sql`](./patches/001_security_hardening.sql).
It does two things:

1. Recreates the four segment views without `SECURITY DEFINER` (uses
   `security_invoker = true` instead).
2. Enables RLS on `contacts`, `email_threads`, `email_messages`, `tags`,
   `contact_tags` with **no public policies** (deny-all to anon/authenticated;
   service role bypasses).

It does not drop tables or rename anything.

Verify after running:

```sql
-- All four should report security_invoker=true in reloptions:
select c.relname, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname like 'segment_%';

-- All five tables should be rowsecurity=true:
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('contacts','email_threads','email_messages','tags','contact_tags');

-- Views still return rows when run from the SQL editor (service role):
select count(*) from public.segment_all_leads;
select count(*) from public.segment_warm_leads;
select count(*) from public.segment_clients;
select count(*) from public.segment_needs_followup;
```

---

## 2. Set environment variables

In Netlify (`Site configuration → Environment variables`) and locally in
`.env`:

| Var | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | both functions | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | both functions | **Service role**. Server-only. Bypasses RLS. |
| `RESEND_API_KEY` | `send-followups` | From [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_WEBHOOK_SECRET` | `resend-inbound-webhook` | Any opaque random string. Paste the same value into Resend. |
| `FROM_EMAIL` | `send-followups` | e.g. `Patrick <hello@your-sending-domain.com>` |
| `REPLY_DOMAIN` | `send-followups` | Use `patrickleezepeda.com` for current production setup. |
| `DRY_RUN` | `send-followups` | Defaults to `true`. Set to `false` to actually send. |
| `FOLLOWUPS_CRON_SECRET` | `send-followups` | Optional. If set, must be passed as `Authorization: Bearer <secret>`. |

Generate good secrets with:

```bash
openssl rand -hex 32
```

---

## 3. Deploy

The functions ship with the rest of the site:

```bash
git add .
git commit -m "Add Supabase email CRM"
git push
```

Netlify auto-deploys. To deploy from CLI without a push:

```bash
netlify deploy --prod
```

To run locally:

```bash
netlify dev
# functions reachable at:
#   http://localhost:8888/.netlify/functions/resend-inbound-webhook
#   http://localhost:8888/.netlify/functions/send-followups
# or, via the /api/* redirect already in netlify.toml:
#   http://localhost:8888/api/resend-inbound-webhook
#   http://localhost:8888/api/send-followups
```

---

## 4. URL patterns to use in Resend

After deploy, your endpoints are:

```
Inbound webhook:   https://<your-site>.netlify.app/api/resend-inbound-webhook
Send follow-ups:   https://<your-site>.netlify.app/api/send-followups
```

(or your custom domain instead of `*.netlify.app`).

---

## 5. The next 3 manual steps in Resend

1. **Verify your sending domain.** In Resend → Domains, add `patrickleezepeda.com`
   and add the DNS records (DKIM, SPF, optionally DMARC). Wait for "verified".
2. **Set up inbound on the current reply domain.** Add `patrickleezepeda.com` as an
   inbound domain in Resend, then add the MX record they give you. This is the
   address users will reply to (`r-<token>@patrickleezepeda.com`), and Resend
   will forward those replies to the webhook.
3. **Configure the inbound webhook.** In Resend → Webhooks, create a webhook
   pointing at `https://<your-site>/api/resend-inbound-webhook`, subscribe to
   inbound email events, and add a custom `Authorization: Bearer <secret>`
   header where `<secret>` matches `RESEND_WEBHOOK_SECRET`.

---

## 6. Triggering follow-ups

By default `DRY_RUN=true`, so calling the endpoint just records what *would*
have been sent and updates `last_contacted_at`. To actually send:

```bash
curl -i \
  -H "Authorization: Bearer $FOLLOWUPS_CRON_SECRET" \
  https://<your-site>/api/send-followups
```

Set `DRY_RUN=false` in Netlify env when you're ready to flip it on.

You can wire this to a Netlify scheduled function later, or run it manually
from your terminal. Batch size is capped at 10 per call to keep things sane.

### How to test dry-run safely (do this first)

1. Make sure `DRY_RUN=true` (or unset) in Netlify env. Confirm in the Netlify
   dashboard before triggering.
2. Insert one obvious test contact in the SQL editor:
   ```sql
   insert into public.contacts (email, name, type, status, source)
   values ('your-real-inbox+dryrun@gmail.com', 'Dry Run Tester', 'lead', 'new', 'manual-test');
   ```
   They'll appear in `segment_needs_followup` immediately because
   `last_contacted_at` is null.
3. Hit the endpoint:
   ```bash
   curl -s https://<your-site>/api/send-followups | jq
   ```
   (Or `localhost:8888` if running `netlify dev`.)
4. The JSON should report `dry_run: true`, one entry per processed contact,
   and `sent: false` on each. **No real email is sent.**
5. Confirm in Supabase:
   ```sql
   select direction, subject, raw_payload, sent_at
   from public.email_messages
   order by sent_at desc limit 5;
   ```
   You should see an outbound row with `raw_payload = {"dry_run": true}`.
6. Confirm `last_contacted_at` updated:
   ```sql
   select email, last_contacted_at from public.contacts
   where email = 'your-real-inbox+dryrun@gmail.com';
   ```

Only after all of that looks right, set `DRY_RUN=false` and repeat — this time
the test inbox should actually receive the email.

### How to test inbound email capture

1. Confirm Resend domain + inbound MX are verified (Section 5 above).
2. Confirm the webhook in Resend points to your deployed URL and includes the
   `Authorization: Bearer <RESEND_WEBHOOK_SECRET>` header.
3. Get a real `reply_address` from Supabase to send to:
   ```sql
   select id, reply_address from public.email_threads
   where reply_address is not null
   order by created_at desc limit 1;
   ```
4. From any inbox, send a plain email TO that address. Subject and body don't
   matter.
5. Within ~30s, confirm capture:
   ```sql
   select direction, from_email, to_email, subject, sent_at
   from public.email_messages
   order by sent_at desc limit 3;
   ```
   You should see a row with `direction = 'inbound'` and `from_email` = your
   sending inbox.
6. Confirm thread bumped:
   ```sql
   select id, last_message_at from public.email_threads
   order by last_message_at desc limit 3;
   ```

If nothing shows up, check Netlify function logs (`Netlify dashboard → Logs →
Functions → resend-inbound-webhook`) and Resend's webhook delivery log. The
two most common causes are (a) the `Authorization` header missing/mismatched
and (b) the MX record not propagated yet.

### Smoke-testing the webhook without Resend

You can prove the function path works end-to-end with a fake POST:

```bash
curl -i -X POST https://<your-site>/api/resend-inbound-webhook \
  -H "Authorization: Bearer $RESEND_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "from": "smoketest@example.com",
      "to":   "r-smoketest@patrickleezepeda.com",
      "subject": "smoke",
      "text": "hello",
      "message_id": "smoke-1"
    }
  }'
```

It should return `200 {"ok":true,...}` and create a contact + thread + message.

---

## 7. Security model

- **RLS is on for every table** with no policies for `anon` / `authenticated`.
  That means the public anon key can read nothing from these tables. Good.
- The two Netlify functions use the **service role key**, which bypasses RLS.
  Never expose that key to the browser.
- Both functions require a shared secret in the `Authorization` header before
  doing anything (webhook secret + cron secret).
- If you ever want to read CRM data from the browser, add a narrow `select`
  policy for the specific table+column you want exposed.
