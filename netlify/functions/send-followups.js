import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from './lib/supabase.js';
import { sendEmail } from './lib/resend.js';
import { buildEmail } from './lib/email/buildEmail.js';
import { WELCOME_SEQUENCES } from './lib/email/templates/welcome-sequences.js';

const BATCH_SIZE = 10;
const DEFAULT_SERVICE_SLUG = 'other';
const STEP_ONE = 1;
const STEP_TWO = 2;
const STEP_TWO_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

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
  return String(slug || DEFAULT_SERVICE_SLUG)
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
    .select('id, name, email, type, status, welcome_sequence_step')
    .eq('type', 'lead')
    .eq('status', 'new')
    .eq('welcome_sequence_step', 0)
    .order('created_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (query.error) throw query.error;
  return query.data || [];
}

async function getEligibleStepTwoContacts(supabase, cutoffIso) {
  const query = await supabase
    .from('contacts')
    .select(
      'id, name, email, type, status, welcome_sequence_step, welcome_first_sent_at',
    )
    .eq('type', 'lead')
    .eq('status', 'new')
    .eq('welcome_sequence_step', 1)
    .lte('welcome_first_sent_at', cutoffIso)
    .order('welcome_first_sent_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (query.error) throw query.error;
  return query.data || [];
}

async function getPrimaryServiceSlug(supabase, contactId) {
  const tagLink = await supabase
    .from('contact_tags')
    .select('created_at, tags(slug)')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  if (tagLink.error) throw tagLink.error;
  const nested = tagLink.data?.tags;
  const slug =
    Array.isArray(nested) ? nested[0]?.slug : nested?.slug;

  return slug && WELCOME_SEQUENCES[slug] ? slug : DEFAULT_SERVICE_SLUG;
}

async function hasInboundReply(supabase, contactId) {
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
  serviceSlug,
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
      welcome_sequence_step: STEP_ONE,
      welcome_first_sent_at: nowIso,
      last_contacted_at: nowIso,
    })
    .eq('id', contactId);
  if (updateContact.error) throw updateContact.error;
}

async function markStepTwoSent({ supabase, contactId, nowIso }) {
  const updateContact = await supabase
    .from('contacts')
    .update({
      welcome_sequence_step: STEP_TWO,
      welcome_second_sent_at: nowIso,
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
}) {
  const nowIso = new Date().toISOString();
  const serviceSlug = await getPrimaryServiceSlug(supabase, contact.id);
  const template = WELCOME_SEQUENCES[serviceSlug]?.[`step${step}`];
  if (!template) {
    throw new Error(`Missing step${step} template for service slug "${serviceSlug}"`);
  }

  const emailPayload = buildEmail({
    ...template,
    heroImageUrl: '',
    contact: {
      ...contact,
      serviceInterest: humanizeServiceSlug(serviceSlug),
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
    serviceSlug,
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
    serviceSlug,
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
        });
        results.push(processed);
      } catch (error) {
        console.error('[send-followups] contact processing failed', {
          contactId: contact.id,
          error,
        });
        results.push({
          contactId: contact.id,
          email: contact.email,
          flow: 'welcome-step-1',
          serviceSlug: DEFAULT_SERVICE_SLUG,
          stepSent: null,
          skippedReason: 'step1-error',
          dryrun,
        });
      }
    }

    for (const contact of stepTwoContacts) {
      try {
        const replied = await hasInboundReply(supabase, contact.id);
        if (replied) {
          const serviceSlug = await getPrimaryServiceSlug(supabase, contact.id);
          results.push({
            contactId: contact.id,
            email: contact.email,
            flow: 'welcome-step-2',
            serviceSlug,
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
          serviceSlug: DEFAULT_SERVICE_SLUG,
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
