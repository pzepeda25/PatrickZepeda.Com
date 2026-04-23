import { handler as createContactHandler } from './create-contact.js';

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

  const mappedPayload = {
    name: `${firstName} ${lastName}`.trim(),
    email,
    message: description,
    phone: sanitizeString(payload.phone, 80),
    serviceInterest: contactMethod,
    sourceDetail: 'legacy-submit-to-blobs',
    buttonContext: 'legacy-submit-to-blobs',
    pagePath: sanitizeString(payload.pagePath, 500),
    formStartedAt: sanitizeString(payload.formStartedAt, 80),
    faxNumber: sanitizeString(payload.faxNumber, 100),
  };

  const proxiedEvent = {
    ...event,
    httpMethod: 'POST',
    body: JSON.stringify(mappedPayload),
  };
  return createContactHandler(proxiedEvent);
};
