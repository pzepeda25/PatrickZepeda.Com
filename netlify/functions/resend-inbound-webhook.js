import { getSupabaseAdmin } from './lib/supabase.js';

/**
 * Resend inbound email webhook.
 *
 * Resend posts inbound email events here. We:
 *   1. Verify a shared secret in the Authorization header.
 *   2. Try to match a thread by reply_address (recipient on a *@reply.<your-domain>).
 *   3. If no match, look up or create the contact by sender email and create a thread.
 *   4. Insert the inbound message and bump email_threads.last_message_at.
 *
 * Env vars required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - RESEND_WEBHOOK_SECRET   (any opaque string; you also paste this in Resend)
 */

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function pickFirstEmail(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const v = value[0];
    if (typeof v === 'string') return v.toLowerCase();
    if (v && typeof v.email === 'string') return v.email.toLowerCase();
  }
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'object' && typeof value.email === 'string') {
    return value.email.toLowerCase();
  }
  return null;
}

function pickFirstAddress(value) {
  // Returns the recipient that looks like a reply-routing address, if any.
  // Resend inbound payloads vary; handle a few common shapes.
  if (!value) return null;
  const list = Array.isArray(value) ? value : [value];
  for (const item of list) {
    const email =
      typeof item === 'string'
        ? item
        : typeof item?.email === 'string'
          ? item.email
          : null;
    if (email) return email.toLowerCase();
  }
  return null;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  // 1. Auth — shared secret in Authorization: Bearer <secret>
  const expected = process.env.RESEND_WEBHOOK_SECRET;
  if (!expected) {
    return json(500, { ok: false, error: 'Webhook secret not configured' });
  }
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const provided = auth.replace(/^Bearer\s+/i, '').trim();
  if (provided !== expected) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }

  // 2. Parse payload
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  // Resend wraps inbound data under `data` for webhook events.
  const data = payload?.data ?? payload ?? {};

  const fromEmail = pickFirstEmail(data.from);
  const toEmail = pickFirstAddress(data.to);
  const subject = (data.subject || '(no subject)').toString().slice(0, 1000);
  const textBody = (data.text || data.text_body || '').toString();
  const htmlBody = (data.html || data.html_body || '').toString();
  const resendMessageId =
    data.message_id || data.messageId || data.id || null;

  if (!fromEmail) {
    return json(400, { ok: false, error: 'Missing sender email' });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // 3. Find thread by reply_address
  let threadId = null;
  let contactId = null;

  if (toEmail) {
    const { data: thread, error: threadErr } = await supabase
      .from('email_threads')
      .select('id, contact_id')
      .eq('reply_address', toEmail)
      .maybeSingle();

    if (threadErr) {
      console.error('thread lookup error', threadErr);
      return json(500, { ok: false, error: 'thread lookup failed' });
    }
    if (thread) {
      threadId = thread.id;
      contactId = thread.contact_id;
    }
  }

  // 4. If no thread, find or create contact by sender email, then thread.
  if (!threadId) {
    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', fromEmail)
      .maybeSingle();

    if (contactErr) {
      console.error('contact lookup error', contactErr);
      return json(500, { ok: false, error: 'contact lookup failed' });
    }

    if (contact) {
      contactId = contact.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('contacts')
        .insert({
          email: fromEmail,
          type: 'lead',
          status: 'new',
          source: 'inbound-email',
        })
        .select('id')
        .single();
      if (createErr) {
        console.error('contact create error', createErr);
        return json(500, { ok: false, error: 'contact create failed' });
      }
      contactId = created.id;
    }

    const { data: newThread, error: newThreadErr } = await supabase
      .from('email_threads')
      .insert({
        contact_id: contactId,
        subject,
        reply_address: toEmail,
        last_message_at: nowIso,
      })
      .select('id')
      .single();
    if (newThreadErr) {
      console.error('thread create error', newThreadErr);
      return json(500, { ok: false, error: 'thread create failed' });
    }
    threadId = newThread.id;
  }

  // 5. Insert the inbound message.
  const { error: msgErr } = await supabase.from('email_messages').insert({
    thread_id: threadId,
    direction: 'inbound',
    subject,
    text_body: textBody || null,
    html_body: htmlBody || null,
    from_email: fromEmail,
    to_email: toEmail,
    resend_message_id: resendMessageId,
    sent_at: nowIso,
    raw_payload: payload,
  });
  if (msgErr) {
    console.error('message insert error', msgErr);
    return json(500, { ok: false, error: 'message insert failed' });
  }

  // 6. Bump thread + contact timestamps.
  await supabase
    .from('email_threads')
    .update({ last_message_at: nowIso })
    .eq('id', threadId);

  if (contactId) {
    await supabase
      .from('contacts')
      .update({ updated_at: nowIso })
      .eq('id', contactId);
  }

  return json(200, { ok: true, thread_id: threadId, contact_id: contactId });
};
