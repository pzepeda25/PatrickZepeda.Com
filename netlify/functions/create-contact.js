import { getSupabaseAdmin } from './lib/supabase.js';
import { sendEmail } from './lib/resend.js';
import { buildWelcomeEmail } from './lib/email/buildWelcomeEmail.js';

const MAX = {
  name: 200,
  email: 254,
  serviceInterest: 120,
  source: 80,
  formName: 120,
  entryPath: 500,
  message: 8000,
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const WELCOME_FLOW = 'welcome-step-1';
const WELCOME_STEP = 1;

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function sanitizeString(value, max) {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned;
}

function normalizeEmail(value) {
  return sanitizeString(value, MAX.email).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isBlank(value) {
  return !String(value || '').trim();
}

function isUniqueViolation(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return code === '23505' || /duplicate key value/i.test(message);
}

function isMissingLeadSubmissionColumnError(error) {
  if (!error) return false;
  const message = String(error.message || error);
  return /column .* of relation "lead_submissions" does not exist/i.test(message);
}

function dryRunEnabled() {
  return (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
}

function buildReplyAddress(replyDomain) {
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `r-${token}@${replyDomain}`;
}

async function findExistingContactByEmail({ supabase, normalizedEmail }) {
  const existing = await supabase
    .from('contacts')
    .select('id, name, source, form_name, entry_path, created_at')
    .ilike('email', normalizedEmail)
    .order('created_at', { ascending: true, nullsFirst: true })
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;
  return existing.data || null;
}

function extractTagCandidates(input) {
  const values = [];
  if (Array.isArray(input.tags)) {
    for (const tag of input.tags) values.push(tag);
  } else if (typeof input.tags === 'string') {
    values.push(...input.tags.split(','));
  }
  if (input.serviceInterest) {
    values.push(...String(input.serviceInterest).split(','));
  }
  const cleaned = values
    .map((v) => sanitizeString(v, MAX.serviceInterest))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

async function maybeAttachTags({ supabase, contactId, tagCandidates }) {
  if (!Array.isArray(tagCandidates) || tagCandidates.length === 0) return;

  for (const tag of tagCandidates) {
    const normalizedSlug = normalizeSlug(tag);
    const slugCandidates = Array.from(
      new Set([tag, normalizedSlug].filter(Boolean)),
    );
    const tagResult = await supabase
      .from('tags')
      .select('id')
      .in('slug', slugCandidates)
      .limit(1)
      .maybeSingle();

    if (tagResult.error) throw tagResult.error;
    if (!tagResult.data?.id) continue;

    const linkResult = await supabase.from('contact_tags').upsert(
      {
        contact_id: contactId,
        tag_id: tagResult.data.id,
      },
      { onConflict: 'contact_id,tag_id', ignoreDuplicates: true },
    );
    if (linkResult.error) throw linkResult.error;
  }
}

async function updateExistingContactIfNeeded({ supabase, existing, input }) {
  const updatePayload = {};

  if (input.name && isBlank(existing.name)) {
    updatePayload.name = input.name;
  }
  if (input.formName && isBlank(existing.form_name)) {
    updatePayload.form_name = input.formName;
  }
  if (input.entryPath && isBlank(existing.entry_path)) {
    updatePayload.entry_path = input.entryPath;
  }
  if (existing.source == null) {
    updatePayload.source = 'site-form';
  }
  if (Object.keys(updatePayload).length === 0) return;

  const updated = await supabase
    .from('contacts')
    .update(updatePayload)
    .eq('id', existing.id)
    .select('id')
    .single();

  if (updated.error) throw updated.error;
}

async function insertNewContact({ supabase, input }) {
  const insertPayload = {
    name: input.name,
    email: input.email,
    type: 'lead',
    status: 'new',
    source: input.source || 'site-form',
    last_contacted_at: null,
  };
  if (input.formName) insertPayload.form_name = input.formName;
  if (input.entryPath) insertPayload.entry_path = input.entryPath;

  const insertResult = await supabase
    .from('contacts')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertResult.error) throw insertResult.error;
  return insertResult.data.id;
}

async function insertLeadSubmission({ supabase, contactId, input, rawPayload }) {
  if (!input.message) return null;

  let insertResult = await supabase
    .from('lead_submissions')
    .insert({
      contact_id: contactId,
      email: input.email,
      name: input.name || null,
      message: input.message,
      source: input.source || 'site-form',
      form_name: input.formName || null,
      entry_path: input.entryPath || null,
      user_agent: input.userAgent || null,
      ip_address: input.ipAddress || null,
      raw_payload: rawPayload,
    })
    .select('id')
    .single();

  // Backward-compatible fallback when lead_submissions uses a leaner schema.
  if (insertResult.error && isMissingLeadSubmissionColumnError(insertResult.error)) {
    insertResult = await supabase
      .from('lead_submissions')
      .insert({
        contact_id: contactId,
        form_name: input.formName || null,
        entry_path: input.entryPath || null,
        message: input.message,
        raw_payload: rawPayload,
      })
      .select('id')
      .single();
  }

  if (insertResult.error) throw insertResult.error;
  return insertResult.data?.id || null;
}

async function findOrCreateThread({
  supabase,
  contactId,
  subject,
  nowIso,
  replyDomain,
}) {
  const existing = await supabase
    .from('email_threads')
    .select('id, reply_address')
    .eq('contact_id', contactId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const replyAddress =
      existing.data.reply_address ||
      (replyDomain ? buildReplyAddress(replyDomain) : null);

    if (!existing.data.reply_address && replyAddress) {
      const updateReply = await supabase
        .from('email_threads')
        .update({ reply_address: replyAddress })
        .eq('id', existing.data.id);
      if (updateReply.error) throw updateReply.error;
    }

    return { threadId: existing.data.id, replyAddress };
  }

  const replyAddress = replyDomain ? buildReplyAddress(replyDomain) : null;
  const created = await supabase
    .from('email_threads')
    .insert({
      contact_id: contactId,
      subject,
      reply_address: replyAddress,
      last_message_at: nowIso,
    })
    .select('id')
    .single();

  if (created.error) throw created.error;
  return { threadId: created.data.id, replyAddress };
}

async function logOutboundMessage({
  supabase,
  threadId,
  subject,
  text,
  html,
  fromEmail,
  toEmail,
  resendMessageId,
  nowIso,
  dryrun,
  serviceLabel,
}) {
  const insertMessage = await supabase.from('email_messages').insert({
    thread_id: threadId,
    direction: 'outbound',
    subject,
    text_body: text,
    html_body: html,
    from_email: fromEmail || 'dry-run@example.test',
    to_email: toEmail,
    resend_message_id: resendMessageId,
    sent_at: nowIso,
    raw_payload: {
      flow: WELCOME_FLOW,
      step: WELCOME_STEP,
      service_label: serviceLabel,
      dryrun,
    },
  });

  if (insertMessage.error) throw insertMessage.error;
}

async function markWelcomeSent({ supabase, contactId, nowIso }) {
  const updateContact = await supabase
    .from('contacts')
    .update({
      status: 'warming-up',
      last_contacted_at: nowIso,
    })
    .eq('id', contactId);

  if (updateContact.error) throw updateContact.error;
}

async function maybeSendImmediateWelcome({
  supabase,
  created,
  contactId,
  input,
  tagCandidates,
}) {
  if (!created || !contactId) return null;

  const source = input.source || 'site-form';
  if (source !== 'site-form') return null;

  const dryrun = dryRunEnabled();
  const fromEmail = process.env.FROM_EMAIL;
  const replyDomain = process.env.REPLY_DOMAIN;
  if (!dryrun && !fromEmail) {
    throw new Error('FROM_EMAIL is required when DRY_RUN=false');
  }

  const welcomeEmail = buildWelcomeEmail({
    name: input.name,
    email: input.email,
    serviceInterest: input.serviceInterest || input.service_interest,
    tags: tagCandidates,
  });

  const nowIso = new Date().toISOString();
  const { threadId, replyAddress } = await findOrCreateThread({
    supabase,
    contactId,
    subject: welcomeEmail.subject,
    nowIso,
    replyDomain,
  });

  let resendMessageId = null;
  if (!dryrun) {
    const sent = await sendEmail({
      from: fromEmail,
      to: input.email,
      subject: welcomeEmail.subject,
      text: welcomeEmail.text,
      html: welcomeEmail.html,
      replyTo: replyAddress,
      headers: { 'X-Thread-Id': threadId },
    });
    resendMessageId = sent?.id ?? null;
  }

  await logOutboundMessage({
    supabase,
    threadId,
    subject: welcomeEmail.subject,
    text: welcomeEmail.text,
    html: welcomeEmail.html,
    fromEmail,
    toEmail: input.email,
    resendMessageId,
    nowIso,
    dryrun,
    serviceLabel: welcomeEmail.serviceLabel,
  });

  const updateThread = await supabase
    .from('email_threads')
    .update({ last_message_at: nowIso })
    .eq('id', threadId);
  if (updateThread.error) throw updateThread.error;

  await markWelcomeSent({ supabase, contactId, nowIso });

  return {
    dryrun,
    firstName: welcomeEmail.firstName,
    serviceLabel: welcomeEmail.serviceLabel,
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    console.warn('[create-contact] invalid method', { method: event.httpMethod });
    return json(405, { ok: false, error: 'Method Not Allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    console.warn('[create-contact] invalid payload: json parse failed');
    return json(400, { ok: false, error: 'Invalid JSON body' });
  }

  const userAgent = sanitizeString(
    event.headers?.['user-agent'] || event.headers?.['User-Agent'] || '',
    500,
  );
  const ipAddress = sanitizeString(
    event.headers?.['client-ip'] ||
      event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      event.headers?.['x-nf-client-connection-ip'] ||
      '',
    120,
  );

  const input = {
    name: sanitizeString(body.name, MAX.name),
    email: normalizeEmail(body.email),
    source: sanitizeString(body.source, MAX.source),
    serviceInterest: sanitizeString(
      body.serviceInterest || body.serviceinterest,
      MAX.serviceInterest,
    ),
    formName: sanitizeString(
      body.formName || body.form_name || body.sourceDetail || 'work-with-me',
      MAX.formName,
    ),
    entryPath: sanitizeString(
      body.entryPath || body.entry_path || body.pagePath,
      MAX.entryPath,
    ),
    message: sanitizeString(body.message, MAX.message),
    tags: body.tags,
    service_interest: sanitizeString(body.service_interest, MAX.serviceInterest),
    userAgent,
    ipAddress,
  };

  const validationErrors = [];
  if (!input.email || !isValidEmail(input.email)) {
    validationErrors.push('valid email is required');
  }

  if (validationErrors.length > 0) {
    return json(400, {
      ok: false,
      error: 'Validation failed',
      details: validationErrors,
      duplicate: false,
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const existing = await findExistingContactByEmail({ supabase, normalizedEmail: input.email });
    const tagCandidates = extractTagCandidates(input);
    let contactId;
    let created = false;

    if (existing) {
      await updateExistingContactIfNeeded({
        supabase,
        existing,
        input,
      });
      contactId = existing.id;
      console.info('[create-contact] contact exists', { contactId });
    } else {
      try {
        contactId = await insertNewContact({ supabase, input });
        created = true;
        console.info('[create-contact] contact created', { contactId });
      } catch (insertError) {
        if (!isUniqueViolation(insertError)) throw insertError;

        const racedExisting = await findExistingContactByEmail({
          supabase,
          normalizedEmail: input.email,
        });
        if (!racedExisting?.id) throw insertError;
        contactId = racedExisting.id;
        console.info('[create-contact] recovered from duplicate race', { contactId });
      }
    }

    let leadSubmissionId = null;
    try {
      leadSubmissionId = await insertLeadSubmission({
        supabase,
        contactId,
        input,
        rawPayload: body,
      });
      if (leadSubmissionId) {
        console.info('[create-contact] lead submission stored', {
          contactId,
          leadSubmissionId,
        });
      }
    } catch (submissionError) {
      // Non-fatal by design: lead identity creation already succeeded.
      console.error('[create-contact] lead_submissions insert failed', {
        contactId,
        error: submissionError,
      });
      leadSubmissionId = null;
    }

    try {
      await maybeAttachTags({
        supabase,
        contactId,
        tagCandidates,
      });
    } catch (tagError) {
      console.warn('[create-contact] tag insert warning', { contactId, error: tagError });
    }

    let welcomeEmailSent = false;
    let welcomeDryRun = null;
    try {
      const welcomeResult = await maybeSendImmediateWelcome({
        supabase,
        created,
        contactId,
        input,
        tagCandidates,
      });
      welcomeEmailSent = Boolean(welcomeResult);
      welcomeDryRun = welcomeResult?.dryrun ?? null;

      if (welcomeResult) {
        console.info('[create-contact] welcome email processed', {
          contactId,
          dryrun: welcomeResult.dryrun,
          serviceLabel: welcomeResult.serviceLabel,
        });
      }
    } catch (welcomeError) {
      // Non-fatal by design: lead identity creation already succeeded.
      console.error('[create-contact] welcome email failed', {
        contactId,
        error: welcomeError,
      });
    }

    return json(200, {
      ok: true,
      created,
      duplicate: !created,
      message: created
        ? 'Contact created successfully.'
        : 'You’re already in my system — I’ll follow up using your existing details.',
      contactId,
      leadSubmissionId,
      welcomeEmailSent,
      welcomeDryRun,
    });
  } catch (error) {
    console.error('[create-contact] failed', error);
    return json(500, {
      ok: false,
      duplicate: false,
      error: 'Could not create contact',
      message: 'Unexpected failure while creating contact.',
    });
  }
};
