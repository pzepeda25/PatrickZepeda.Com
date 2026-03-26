const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

/**
 * Compare two strings in constant time (avoid timing leaks on the secret).
 */
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Netlify may pass headers with varied casing; normalize lookup.
 */
function getHeader(headers, name) {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === lower);
  return key ? headers[key] : undefined;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const expectedSecret = process.env.VIBE_SECRET;
  if (!expectedSecret || !String(expectedSecret).trim()) {
    console.error('VIBE_SECRET is not set');
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server misconfigured: missing VIBE_SECRET.' }),
    };
  }

  const providedSecret = getHeader(event.headers, 'x-vibe-secret');
  const trimmedProvided = (providedSecret || '').trim();
  const trimmedExpected = expectedSecret.trim();
  if (!trimmedProvided || !constantTimeEqual(trimmedProvided, trimmedExpected)) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  let lead;
  try {
    lead = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const businessName =
    lead && typeof lead.name === 'string' && lead.name.trim() ? lead.name : 'unknown';

  // Rule 5: simple slugified key for the business name
  const key = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const store = getStore('saved-leads');
  await store.setJSON(key, { ...lead, savedAt: new Date().toISOString() });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};

