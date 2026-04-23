# Lead Capture Implementation Note

## Why `lead_submissions` was added

`public.contacts` is the CRM identity/pipeline table (who the lead is, lifecycle state).  
Free-text inquiry content belongs in a separate record model so pipeline fields stay clean and stable.

`public.lead_submissions` now stores per-submission form content (`message`, `form_name`, `entry_path`, `raw_payload`) linked back to `contacts` by `contact_id`.

## Why normalized-email uniqueness was added

Lead forms can be submitted multiple times and can race under retry/network edge cases.  
A DB-level unique index on normalized email (`lower(trim(email))`) prevents duplicate contact identities even when concurrent requests happen.

## Updated `create-contact` flow

1. Parse + validate payload (email required/valid).
2. Normalize email (`lower(trim(email))`).
3. Lookup contact by normalized email.
4. If existing:
   - keep existing identity
   - optionally backfill safe metadata (`name`, `form_name`, `entry_path`, `source` when null)
5. If missing:
   - create contact with CRM defaults (`type='lead'`, `status='new'`, `source='site-form'`)
   - recover safely from unique-race by reloading existing contact
6. If message exists:
   - store in `lead_submissions` (separate from contacts)
7. If tags/service-interest tags exist:
   - attempt `contact_tags` linking as non-fatal
8. Return clean response:
   - `{ ok, created, duplicate, contactId, leadSubmissionId }`
