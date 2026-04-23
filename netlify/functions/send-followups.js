import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from './lib/supabase.js';
import { sendEmail } from './lib/resend.js';
import { buildEmail } from './lib/email/buildEmail.js';

const BATCH_SIZE = 10;
const STEP_ONE = 1;
const STEP_TWO = 2;
const STEP_TWO_DELAY_MS = 4 * 24 * 60 * 60 * 1000;
const CONTACT_SOURCE = 'site-form';
const EARLY_PIPELINE_STATUSES = ['new', 'warming-up'];

const WELCOME_TEMPLATE = {
  subject: 'Got your message - here is what happens next',
  preheader: 'Thanks for reaching out. Here is the next step.',
  title: 'Thanks for reaching out',
  bodyHtml: `
    <p style="margin:0 0 14px 0;">Hey {{firstName}},</p>
    <p style="margin:0 0 14px 0;">Thanks for reaching out through my site. I help people with modern, fast web design and development - clean builds that support the rest of your business, not just sit there.</p>
    <p style="margin:0 0 10px 0;">Here is what happens next:</p>
    <ol style="margin:0 0 14px 22px;padding:0;">
      <li style="margin:0 0 8px 0;">I review what you shared about your project.</li>
      <li style="margin:0 0 8px 0;">If it looks like a fit, I reply with a couple of options and a simple timeline.</li>
    </ol>
    <p style="margin:0 0 10px 0;">If you want to speed things up, hit reply and tell me:</p>
    <ul style="margin:0 0 14px 22px;padding:0;">
      <li style="margin:0 0 8px 0;">What your business does</li>
      <li style="margin:0 0 8px 0;">The one thing your current site is not doing for you</li>
      <li style="margin:0 0 8px 0;">Your rough timing (this month, next few months, etc.)</li>
    </ul>
    <p style="margin:0;">Talk soon,</p>
  `,
  ctaLabel: 'Book a quick call',
};

const REMINDER_TEMPLATE = {
  subject: 'Quick check-in about your site project',
  preheader: 'Quick follow-up in case your inbox got busy.',
  title: 'Quick check-in',
  bodyHtml: `
    <p style="margin:0 0 14px 0;">Hey {{firstName}},</p>
    <p style="margin:0 0 14px 0;">Just wanted to quickly check in on your website project. I know inboxes get busy.</p>
    <p style="margin:0 0 10px 0;">If you are still interested, I can:</p>
    <ul style="margin:0 0 14px 22px;padding:0;">
      <li style="margin:0 0 8px 0;">Take a look at your current site and send back 2-3 sharp suggestions, or</li>
      <li style="margin:0 0 8px 0;">Map out what a redesign/rebuild would look like in plain language.</li>
    </ul>
    <p style="margin:0 0 14px 0;">If now is not the right time, no worries at all - a simple "not now" reply helps me keep follow-ups respectful.</p>
    <p style="margin:0;">Either way, my goal is to give you clear options without fluff.</p>
  `,
  ctaLabel: 'Reply with project details',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function dryRunEnabled() {
  return (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
}

function buildReplyAddress(replyDomain) {
  const token = randomUUID().replace(/-/g, '');
  return `r-${token}@${replyDomain}`;
}

function humanizeServiceSlug(slug) {
  return String(slug || CONTACT_SOURCE)
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function resolvePrimaryCtaUrl() {
  return 'https://patrickleezepeda.com/contact';
}

async function getEligibleContacts(supabase) {
  const query = await supabase
    .from('contacts')
    .select('id, name, email, type, source, status, last_contacted_at, created_at')
    .eq('type', 'lead')
    .eq('source', CONTACT_SOURCE)
    .eq('status', 'new')
    .is('last_contacted_at', null)
    .order('created_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (query.error) throw query.error;
  return query.data || [];
}

async function getEligibleStepTwoContacts(supabase, cutoffIso) {
  const query = await supabase
    .from('contacts')
    .select('id, name, email, type, source, status, last_contacted_at')
    .eq('type', 'lead')
    .eq('source', CONTACT_SOURCE)
    .in('status', EARLY_PIPELINE_STATUSES)
    .lte('last_contacted_at', cutoffIso)
    .order('last_contacted_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (query.error) throw query.error;
  return query.data || [];
}

async function hasInboundReplySince(supabase, contactId, sinceIso) {
  if (!sinceIso) return false;

  const threadIdsQuery = await supabase
    .from('email_threads')
    .select('id')
    .eq('contact_id', contactId);
  if (threadIdsQuery.error) throw threadIdsQuery.error;

  const threadIds = (threadIdsQuery.data || []).map((row) => row.id).filter(Boolean);
  if (threadIds.length === 0) return false;

  const inboundQuery = await supabase
    .from('email_messages')
    .select('id')
    .in('thread_id', threadIds)
    .eq('direction', 'inbound')
    .gt('sent_at', sinceIso)
    .limit(1);
  if (inboundQuery.error) throw inboundQuery.error;
  return (inboundQuery.data || []).length > 0;
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
  serviceSlug = CONTACT_SOURCE,
  step,
  flow,
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
      flow,
      step,
      service_slug: serviceSlug,
      dryrun,
    },
  });
  if (insertMessage.error) throw insertMessage.error;
}

async function markStepOneSent({ supabase, contactId, nowIso }) {
  const updateContact = await supabase
    .from('contacts')
    .update({
      status: 'warming-up',
      last_contacted_at: nowIso,
    })
    .eq('id', contactId);
  if (updateContact.error) throw updateContact.error;
}

async function markStepTwoSent({ supabase, contactId, nowIso }) {
  const updateContact = await supabase
    .from('contacts')
    .update({
      status: 'warming-up',
      last_contacted_at: nowIso,
    })
    .eq('id', contactId);
  if (updateContact.error) throw updateContact.error;
}

async function sendSequenceStep({
  supabase,
  contact,
  fromEmail,
  replyDomain,
  dryrun,
  step,
  flow,
  template,
}) {
  const nowIso = new Date().toISOString();
  const emailPayload = buildEmail({
    ...template,
    heroImageUrl: '',
    contact: {
      ...contact,
      serviceInterest: humanizeServiceSlug(CONTACT_SOURCE),
    },
    primaryCtaUrl: resolvePrimaryCtaUrl(),
  });

  const { threadId, replyAddress } = await findOrCreateThread({
    supabase,
    contactId: contact.id,
    subject: emailPayload.subject,
    nowIso,
    replyDomain,
  });

  let resendMessageId = null;
  if (!dryrun) {
    const sent = await sendEmail({
      from: fromEmail,
      to: contact.email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
      replyTo: replyAddress,
      headers: { 'X-Thread-Id': threadId },
    });
    resendMessageId = sent?.id ?? null;
  }

  await logOutboundMessage({
    supabase,
    threadId,
    subject: emailPayload.subject,
    text: emailPayload.text,
    html: emailPayload.html,
    fromEmail,
    toEmail: contact.email,
    resendMessageId,
    nowIso,
    dryrun,
    serviceSlug: CONTACT_SOURCE,
    step,
    flow,
  });

  const updateThread = await supabase
    .from('email_threads')
    .update({ last_message_at: nowIso })
    .eq('id', threadId);
  if (updateThread.error) throw updateThread.error;

  if (step === STEP_ONE) {
    await markStepOneSent({ supabase, contactId: contact.id, nowIso });
  } else if (step === STEP_TWO) {
    await markStepTwoSent({ supabase, contactId: contact.id, nowIso });
  }

  return {
    contactId: contact.id,
    email: contact.email,
    flow,
    serviceSlug: CONTACT_SOURCE,
    stepSent: step,
    skippedReason: null,
    dryrun,
  };
}

export const handler = async (event) => {
  const expected = process.env.FOLLOWUPS_CRON_SECRET;
  if (expected) {
    const auth =
      event.headers?.authorization || event.headers?.Authorization || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (provided !== expected) {
      return json(401, { ok: false, error: 'Unauthorized' });
    }
  }

  const dryrun = dryRunEnabled();
  const fromEmail = process.env.FROM_EMAIL;
  const replyDomain = process.env.REPLY_DOMAIN;

  if (!dryrun && !fromEmail) {
    return json(500, {
      ok: false,
      error: 'FROM_EMAIL is required when DRY_RUN=false',
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const stepOneContacts = await getEligibleContacts(supabase);
    const stepTwoCutoffIso = new Date(Date.now() - STEP_TWO_DELAY_MS).toISOString();
    const stepTwoContacts = await getEligibleStepTwoContacts(supabase, stepTwoCutoffIso);
    const results = [];
    const welcomedContactIds = new Set();

    for (const contact of stepOneContacts) {
      try {
        const processed = await sendSequenceStep({
          supabase,
          contact,
          fromEmail,
          replyDomain,
          dryrun,
          step: STEP_ONE,
          flow: 'welcome-step-1',
          template: WELCOME_TEMPLATE,
        });
        results.push(processed);
        welcomedContactIds.add(contact.id);
      } catch (error) {
        console.error('[send-followups] contact processing failed', {
          contactId: contact.id,
          error,
        });
        results.push({
          contactId: contact.id,
          email: contact.email,
          flow: 'welcome-step-1',
          serviceSlug: CONTACT_SOURCE,
          stepSent: null,
          skippedReason: 'step1-error',
          dryrun,
        });
      }
    }

    for (const contact of stepTwoContacts) {
      try {
        if (welcomedContactIds.has(contact.id)) {
          results.push({
            contactId: contact.id,
            email: contact.email,
            flow: 'welcome-step-2',
            serviceSlug: CONTACT_SOURCE,
            stepSent: null,
            skippedReason: 'already-sent-step1-this-run',
            dryrun,
          });
          continue;
        }

        const replied = await hasInboundReplySince(
          supabase,
          contact.id,
          contact.last_contacted_at,
        );
        if (replied) {
          results.push({
            contactId: contact.id,
            email: contact.email,
            flow: 'welcome-step-2',
            serviceSlug: CONTACT_SOURCE,
            stepSent: null,
            skippedReason: 'has-inbound-reply',
            dryrun,
          });
          continue;
        }

        const processed = await sendSequenceStep({
          supabase,
          contact,
          fromEmail,
          replyDomain,
          dryrun,
          step: STEP_TWO,
          flow: 'welcome-step-2',
          template: REMINDER_TEMPLATE,
        });
        results.push(processed);
      } catch (error) {
        console.error('[send-followups] step2 processing failed', {
          contactId: contact.id,
          error,
        });
        results.push({
          contactId: contact.id,
          email: contact.email,
          flow: 'welcome-step-2',
          serviceSlug: CONTACT_SOURCE,
          stepSent: null,
          skippedReason: 'step2-error',
          dryrun,
        });
      }
    }

    return json(200, {
      ok: true,
      dryrun,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('[send-followups] failed', error);
    return json(500, { ok: false, error: 'send-followups failed' });
  }
};
