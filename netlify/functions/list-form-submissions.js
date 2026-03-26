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
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
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

  try {
    const store = getStore('form-submissions');
    const listResponse = await store.list();

    // Netlify blobs list returns an object with a `blobs` array.
    // We use `blobs` directly to keep the data flow predictable.
    const blobs = Array.isArray(listResponse?.blobs) ? listResponse.blobs : [];
    const items = [];

    for (const blob of blobs) {
      const value = await store.get(blob.key, { type: 'json' });
      if (value) items.push(value);
    }

    items.sort((a, b) => {
      const aTime = typeof a?.receivedAt === 'string' ? a.receivedAt : '';
      const bTime = typeof b?.receivedAt === 'string' ? b.receivedAt : '';
      return bTime.localeCompare(aTime);
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error?.message || 'Failed to list submissions' }),
    };
  }
};

