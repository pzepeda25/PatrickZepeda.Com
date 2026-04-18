import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from './lib/supabase.js';
import { sendEmail } from './lib/resend.js';

/**
 * send-followups
 *
 * Pulls up to 10 contacts from public.segment_needs_followup and sends each a
 * follow-up email through Resend. For each contact:
 *   - find or create an email_thread
 *   - send the email (or simulate, in dry-run mode)
 *   - insert an outbound row in email_messages
 *   - bump contacts.last_contacted_at
 *
 * SAFETY: defaults to DRY-RUN. To actually send, set DRY_RUN=false in env.
 *
 * Env vars:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - RESEND_API_KEY
 *   - FROM_EMAIL                  e.g. "Patrick <hello@yourdomain.com>"
 *   - REPLY_DOMAIN                e.g. "reply.yourdomain.com"
 *   - DRY_RUN                     "false" to enable live sending. Anything else = dry run.
 *   - FOLLOWUPS_CRON_SECRET       (optional) shared secret required in Authorization header
 */

const BATCH_SIZE = 10;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function buildReplyAddress(replyDomain) {
  // Token is opaque; uniqueness is enforced by a partial unique index on the column.
  const token = randomUUID().replace(/-/g, '');
  return `r-${token}@${replyDomain}`;
}

function buildEmail(contact) {
  const name = contact.name || 'there';
  const subject = `Quick follow-up, ${name}`;
  const text = [
    `Hi ${name},`,
    '',
    `Just circling back — wanted to make sure you didn't miss my last note. Happy to answer any questions or hop on a quick call if useful.`,
    '',
    'Cheers,',
    'Patrick',
  ].join('\n');
  return { subject, text };
}

export const handler = async (event) => {
  // Optional shared-secret guard (use this if you trigger via cron URL)
  const expected = process.env.FOLLOWUPS_CRON_SECRET;
  if (expected) {
    const auth =
      event.headers?.authorization || event.headers?.Authorization || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (provided !== expected) {
      return json(401, { ok: false, error: 'Unauthorized' });
    }
  }

  const dryRun = (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
  const fromEmail = process.env.FROM_EMAIL;
  const replyDomain = process.env.REPLY_DOMAIN;

  if (!dryRun && (!fromEmail || !replyDomain)) {
    return json(500, {
      ok: false,
      error: 'FROM_EMAIL and REPLY_DOMAIN are required when DRY_RUN=false',
    });
  }

  const supabase = getSupabaseAdmin();

  const { data: contacts, error: segErr } = await supabase
    .from('segment_needs_followup')
    .select('id, email, name, status, type, last_contacted_at')
    .limit(BATCH_SIZE);

  if (segErr) {
    console.error('segment query error', segErr);
    return json(500, { ok: false, error: 'segment query failed' });
  }

  const results = [];
  const nowIso = new Date().toISOString();

  for (const contact of contacts ?? []) {
    try {
      const { subject, text } = buildEmail(contact);

      // Find or create a thread for this contact.
      let threadId;
      let replyAddress;

      const { data: existing, error: threadErr } = await supabase
        .from('email_threads')
        .select('id, reply_address')
        .eq('contact_id', contact.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (threadErr) throw threadErr;

      if (existing) {
        threadId = existing.id;
        replyAddress = existing.reply_address || buildReplyAddress(replyDomain || 'reply.example.test');
        if (!existing.reply_address && replyDomain) {
          await supabase
            .from('email_threads')
            .update({ reply_address: replyAddress })
            .eq('id', threadId);
        }
      } else {
        replyAddress = buildReplyAddress(replyDomain || 'reply.example.test');
        const { data: created, error: createErr } = await supabase
          .from('email_threads')
          .insert({
            contact_id: contact.id,
            subject,
            reply_address: replyAddress,
            last_message_at: nowIso,
          })
          .select('id')
          .single();
        if (createErr) throw createErr;
        threadId = created.id;
      }

      // Send (or simulate)
      let resendMessageId = null;
      if (!dryRun) {
        const sent = await sendEmail({
          from: fromEmail,
          to: contact.email,
          subject,
          text,
          replyTo: replyAddress,
          headers: { 'X-Thread-Id': threadId },
        });
        resendMessageId = sent?.id ?? null;
      }

      // Record outbound message
      const { error: msgErr } = await supabase.from('email_messages').insert({
        thread_id: threadId,
        direction: 'outbound',
        subject,
        text_body: text,
        from_email: fromEmail || 'dry-run@example.test',
        to_email: contact.email,
        resend_message_id: resendMessageId,
        sent_at: nowIso,
        raw_payload: { dry_run: dryRun },
      });
      if (msgErr) throw msgErr;

      // Update timestamps
      await supabase
        .from('email_threads')
        .update({ last_message_at: nowIso })
        .eq('id', threadId);

      await supabase
        .from('contacts')
        .update({ last_contacted_at: nowIso, updated_at: nowIso })
        .eq('id', contact.id);

      results.push({
        contact_id: contact.id,
        email: contact.email,
        thread_id: threadId,
        sent: !dryRun,
        resend_message_id: resendMessageId,
      });
    } catch (err) {
      console.error('followup error for contact', contact.id, err);
      results.push({
        contact_id: contact.id,
        email: contact.email,
        ok: false,
        error: String(err?.message || err),
      });
    }
  }

  return json(200, {
    ok: true,
    dry_run: dryRun,
    processed: results.length,
    results,
  });
};
