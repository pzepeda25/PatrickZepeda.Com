import { getStore } from '@netlify/blobs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const STORE_NAME = 'form-submissions';
const LOCAL_DATA_PATH = path.join(process.cwd(), '.netlify/local-data/form-submissions.json');

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function sanitizeString(s, max = 4000) {
  if (typeof s !== 'string') return '';
  const t = s.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return t.length > max ? t.slice(0, max) : t;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method Not Allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  const receivedAt = new Date().toISOString();
  const ts = Date.now();
  const rand = randomBytes(5).toString('hex');
  const key = `submissions/${ts}-${rand}.json`;
  const isProduction = !!process.env.NETLIFY;

  // Minimal validation (matches current ContactModal payload shape).
  const firstName = sanitizeString(payload.firstName, 120);
  const lastName = sanitizeString(payload.lastName, 120);
  const email = sanitizeString(payload.email, 254).toLowerCase();
  const description = sanitizeString(payload.description, 8000);
  const contactMethod = sanitizeString(payload.contactMethod, 60);

  const errors = [];
  if (!firstName) errors.push('firstName is required');
  if (!lastName) errors.push('lastName is required');
  if (!email || !isValidEmail(email)) errors.push('valid email is required');
  if (!description) errors.push('description is required');
  if (!contactMethod) errors.push('contactMethod is required');

  if (errors.length > 0) {
    return json(400, { ok: false, error: 'Validation failed', details: errors });
  }

  try {
    let store;
    try {
      // On Netlify this uses the function context (no tokens required).
      store = getStore(STORE_NAME);
    } catch {
      // Local dev fallback if you have env vars set (netlify dev can provide these).
      store = getStore({
        name: STORE_NAME,
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN,
      });
    }

    await store.setJSON(key, {
      ...payload,
      receivedAt,
      metadata: {
        ip:
          event.headers['client-ip'] ||
          event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          event.headers['x-nf-client-connection-ip'] ||
          'unknown',
        ua: event.headers['user-agent'] || 'unknown',
      },
    });

    return json(200, { ok: true, id: key, provider: 'blobs' });
  } catch (error) {
    // Fallback: Only if NOT in production (for local testing as requested)
    if (!isProduction) {
      try {
        let submissions = [];
        try {
          const data = await fs.readFile(LOCAL_DATA_PATH, 'utf8');
          submissions = JSON.parse(data);
          if (!Array.isArray(submissions)) submissions = [];
        } catch {
          // ignore missing file
        }
        
        const localEntry = { ...payload, key, receivedAt };
        submissions.push(localEntry);
        
        await fs.mkdir(path.dirname(LOCAL_DATA_PATH), { recursive: true });
        await fs.writeFile(LOCAL_DATA_PATH, JSON.stringify(submissions, null, 2));

        return json(200, { ok: true, id: key, provider: 'local-file' });
      } catch (fallbackError) {
        console.error('Local fallback failed:', fallbackError);
      }
    }

    // In production, we MUST use Blobs. Return failure info.
    console.error('Blobs write failed:', error);
    return json(500, {
      ok: false,
      error: 'Vault storage failed',
      details: process.env.NETLIFY ? undefined : String(error?.message || error),
    });
  }
};
