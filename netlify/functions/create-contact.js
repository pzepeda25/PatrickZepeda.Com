import { getSupabaseAdmin } from './lib/supabase.js';

const MAX = {
  name: 200,
  email: 254,
  message: 8000,
  serviceInterest: 120,
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
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

async function maybeAttachTag({ supabase, contactId, serviceInterest }) {
  if (!serviceInterest) return;

  const rawSlug = sanitizeString(serviceInterest, MAX.serviceInterest);
  if (!rawSlug) return;
  const normalizedSlug = normalizeSlug(rawSlug);
  const slugCandidates = Array.from(new Set([rawSlug, normalizedSlug].filter(Boolean)));

  const tagResult = await supabase
    .from('tags')
    .select('id')
    .in('slug', slugCandidates)
    .limit(1)
    .maybeSingle();

  if (tagResult.error) throw tagResult.error;
  if (!tagResult.data?.id) return;

  const linkResult = await supabase.from('contact_tags').upsert(
    {
      contact_id: contactId,
      tag_id: tagResult.data.id,
    },
    { onConflict: 'contact_id,tag_id', ignoreDuplicates: true },
  );

  if (linkResult.error) throw linkResult.error;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method Not Allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' });
  }

  const input = {
    name: sanitizeString(body.name, MAX.name),
    email: normalizeEmail(body.email),
    message: sanitizeString(body.message, MAX.message),
    serviceInterest: sanitizeString(body.serviceInterest, MAX.serviceInterest),
  };

  const validationErrors = [];
  if (!input.name) validationErrors.push('name is required');
  if (!input.email || !isValidEmail(input.email)) {
    validationErrors.push('valid email is required');
  }
  if (!input.message) validationErrors.push('message is required');

  if (validationErrors.length > 0) {
    return json(400, {
      ok: false,
      error: 'Validation failed',
      details: validationErrors,
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    const insertResult = await supabase
      .from('contacts')
      .insert({
        name: input.name,
        email: input.email,
        message: input.message,
        type: 'lead',
        status: 'new',
        source: 'site-form',
        last_contacted_at: null,
      })
      .select('id')
      .single();

    if (insertResult.error) throw insertResult.error;

    const contactId = insertResult.data.id;
    await maybeAttachTag({
      supabase,
      contactId,
      serviceInterest: input.serviceInterest,
    });

    return json(200, { ok: true, contactId });
  } catch (error) {
    console.error('[create-contact] failed', error);
    return json(500, { ok: false, error: 'Could not create contact' });
  }
};
