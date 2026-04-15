import { randomUUID } from 'node:crypto';
import { saveLeadToBlobs } from './lib/saveLeadToBlobs.js';
import { afterLeadSavedToBlobs } from './lib/phase2-hooks.js';

const ALLOWED = {
  projectType: new Set([
    'New website',
    'Website redesign',
    'AI chatbot',
    'Automation/workflows',
    'SEO/AEO',
    'Content/video system',
    'Not sure yet',
  ]),
  businessType: new Set([
    'Local service business',
    'Creator/personal brand',
    'Startup',
    'Agency',
    'Established business',
    'Other',
  ]),
  goal: new Set([
    'Get more leads',
    'Look more professional',
    'Save time with automation',
    'Improve conversions',
    'Launch something new',
    'Replace an outdated system',
  ]),
  websiteStatus: new Set([
    'Yes, but it needs work',
    'No, I need one from scratch',
    'Yes, but I need new features',
    'Not sure',
  ]),
  timeline: new Set(['ASAP', '2–4 weeks', '1–2 months', 'Flexible']),
  budget: new Set([
    'Under $1k',
    '$1k–$3k',
    '$3k–$7k',
    '$7k+',
    'Not sure yet',
  ]),
};

const MAX = {
  name: 120,
  email: 254,
  message: 8000,
  pageUrl: 2048,
};

function sanitizeString(s, max) {
  if (typeof s !== 'string') return '';
  const t = s.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return t.length > max ? t.slice(0, max) : t;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildMessageSummary(lead) {
  return [
    lead.projectType,
    lead.businessType,
    `Goal: ${lead.goal}`,
    lead.websiteStatus,
    `${lead.timeline} · ${lead.budget}`,
  ].join(' | ');
}

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
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  let raw;
  try {
    raw = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  const errors = [];

  const pageUrl = sanitizeString(raw.pageUrl, MAX.pageUrl);
  if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) {
    errors.push('pageUrl must be a valid http(s) URL');
  }

  const name = sanitizeString(raw.name, MAX.name);
  if (!name || name.length < 2) errors.push('name is required');

  const email = sanitizeString(raw.email, MAX.email).toLowerCase();
  if (!email || !isValidEmail(email)) errors.push('valid email is required');

  const message = sanitizeString(raw.message, MAX.message);

  for (const key of [
    'projectType',
    'businessType',
    'goal',
    'websiteStatus',
    'timeline',
    'budget',
  ]) {
    const v = raw[key];
    if (typeof v !== 'string' || !ALLOWED[key].has(v)) {
      errors.push(`invalid or missing ${key}`);
    }
  }

  if (errors.length > 0) {
    return json(400, { ok: false, error: 'Validation failed', details: errors });
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const lead = {
    id,
    createdAt,
    source: 'website-chatbot',
    pageUrl,
    name,
    email,
    businessType: raw.businessType,
    projectType: raw.projectType,
    goal: raw.goal,
    websiteStatus: raw.websiteStatus,
    timeline: raw.timeline,
    budget: raw.budget,
    message,
    messageSummary: buildMessageSummary({
      projectType: raw.projectType,
      businessType: raw.businessType,
      goal: raw.goal,
      websiteStatus: raw.websiteStatus,
      timeline: raw.timeline,
      budget: raw.budget,
    }),
    status: 'new',
    metadata: {
      ip:
        event.headers['client-ip'] ||
        event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        event.headers['x-nf-client-connection-ip'] ||
        'unknown',
      ua: event.headers['user-agent'] || 'unknown',
    },
  };

  try {
    const { blobKey, provider } = await saveLeadToBlobs(lead);
    await afterLeadSavedToBlobs(lead, { blobKey, provider });
    return json(200, {
      ok: true,
      id,
      blobKey,
      provider,
    });
  } catch (err) {
    console.error('submit-chatbot-lead error:', err);
    return json(500, {
      ok: false,
      error: 'Could not save submission',
      details: process.env.NETLIFY ? undefined : String(err?.message || err),
    });
  }
};
