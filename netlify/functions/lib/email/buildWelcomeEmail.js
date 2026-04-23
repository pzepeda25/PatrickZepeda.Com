const WELCOME_SUBJECT = 'Thanks for reaching out';
const WELCOME_HERO_IMAGE_URL =
  'https://patrickleezepeda.com/email/welcome-hero-80s.png';

const SERVICE_LABEL_BY_SLUG = {
  'web-design': 'web design',
  'web-development': 'web design and development',
  branding: 'branding',
  photography: 'photography',
  video: 'video',
  'photo-video': 'photography and video',
  'web-branding': 'web design and branding',
  'web-dev-branding': 'web design, development, and branding',
};

const SERVICE_SLUG_ALIASES = {
  'website-design': 'web-design',
  'website-development': 'web-development',
  'web-dev': 'web-development',
  'web-development-and-branding': 'web-dev-branding',
  'web-design-and-branding': 'web-branding',
  'photo-and-video': 'photo-video',
};

function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeServiceSlug(value) {
  const slug = normalizeSlug(value);
  return SERVICE_SLUG_ALIASES[slug] || slug;
}

function toDisplayName(value) {
  const cleaned = String(value || '').trim();
  if (!cleaned) return '';
  const [first] = cleaned.split(/\s+/);
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function firstNameFromEmail(email) {
  const localPart = String(email || '').split('@')[0] || '';
  const cleaned = localPart
    .replace(/[._+-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();
  return toDisplayName(cleaned);
}

function getFirstName({ name, email }) {
  const fromName = toDisplayName(name);
  if (fromName) return fromName;
  const fromEmail = firstNameFromEmail(email);
  if (fromEmail) return fromEmail;
  return 'there';
}

function resolveServiceLabel({ serviceInterest, tags }) {
  const candidates = [];

  if (typeof serviceInterest === 'string' && serviceInterest.trim()) {
    candidates.push(...serviceInterest.split(','));
  }

  if (Array.isArray(tags)) {
    candidates.push(...tags);
  } else if (typeof tags === 'string' && tags.trim()) {
    candidates.push(...tags.split(','));
  }

  for (const value of candidates) {
    const slug = normalizeServiceSlug(value);
    if (SERVICE_LABEL_BY_SLUG[slug]) {
      return SERVICE_LABEL_BY_SLUG[slug];
    }
  }

  return 'creative';
}

export function buildWelcomeEmail({ name, email, serviceInterest, tags }) {
  const firstName = getFirstName({ name, email });
  const serviceLabel = resolveServiceLabel({ serviceInterest, tags });

  const text = [
    `Hi ${firstName},`,
    '',
    `Thanks for your interest in my ${serviceLabel} services. I review each submission personally so I can tailor the right solution to what you actually need.`,
    '',
    `I'm excited to schedule a video call and learn more about your project and how I can help. If there's anything else you'd like me to know before we talk, just reply to this email with a few extra details.`,
    '',
    'Thanks again for reaching out,',
    'Patrick',
  ].join('\n');

  const html = [
    `<div style="margin:0 0 18px 0;text-align:center;"><img src="${WELCOME_HERO_IMAGE_URL}" alt="Retro-futurist welcome illustration" width="640" style="display:block;width:100%;max-width:640px;height:auto;margin:0 auto;border-radius:8px;" /></div>`,
    `<p>Hi ${firstName},</p>`,
    `<p>Thanks for your interest in my ${serviceLabel} services. I review each submission personally so I can tailor the right solution to what you actually need.</p>`,
    `<p>I'm excited to schedule a video call and learn more about your project and how I can help. If there's anything else you'd like me to know before we talk, just reply to this email with a few extra details.</p>`,
    '<p>Thanks again for reaching out,<br />Patrick</p>',
  ].join('');

  return {
    subject: WELCOME_SUBJECT,
    text,
    html,
    firstName,
    serviceLabel,
  };
}

