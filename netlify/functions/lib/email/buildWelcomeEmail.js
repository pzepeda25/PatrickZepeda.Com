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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
  const escapedFirstName = escapeHtml(firstName);
  const serviceLabel = resolveServiceLabel({ serviceInterest, tags });

  const text = [
    `Hi ${firstName},`,
    '',
    'Thanks for the message!',
    "I go through these myself because templated responses are the worst, I'll check out what you sent and get back to you soon!",
    '',
    'Patrick',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks for Your Interest - Patrick Lee Zepeda</title>
  <style>
    @media only screen and (max-width: 640px) {
      .email-shell {
        padding: 24px 8px !important;
      }
      .email-card {
        width: 100% !important;
      }
      .email-body {
        padding: 24px !important;
      }
      .email-title {
        font-size: 22px !important;
        letter-spacing: 0.06em !important;
        margin-bottom: 24px !important;
      }
      .email-image-wrap {
        margin: 24px -8px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#0a0a1f;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#0a0a1f;">
    <tr>
      <td class="email-shell" style="padding:48px 16px;">
        <table role="presentation" class="email-card" style="max-width:600px;margin:0 auto;background-color:#0f0f2e;border:1px solid #1a1a3e;border-collapse:collapse;">
          <tr>
            <td class="email-body" style="padding:48px;">
              <div style="height:4px;width:64px;background-color:#00ffff;margin-bottom:32px;"></div>
              <h1 class="email-title" style="margin:0 0 32px 0;font-size:28px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#ffffff;line-height:1.2;">
                Hi <span style="color:#ff00ff;">${escapedFirstName}</span>,
              </h1>
              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#e0e0ff;">
                Thanks for the message!
              </p>
              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.6;color:#e0e0ff;">
                I go through these myself because templated responses are the worst, I'll check out what you sent and get back to you soon!
              </p>
              <div class="email-image-wrap" style="margin:32px 0;border:2px solid #00ffff;padding:8px;">
                <img src="${WELCOME_HERO_IMAGE_URL}" alt="System secured, access granted" style="width:100%;height:auto;display:block;" />
              </div>
              <div style="padding-top:16px;">
                <p style="margin:0;font-size:16px;line-height:1.6;color:#ff00ff;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">
                  Patrick
                </p>
                <p style="margin:4px 0 0 0;font-size:14px;line-height:1.5;color:#00ffff;">
                  Creative Technologist
                </p>
              </div>
              <table role="presentation" style="width:100%;margin-top:48px;padding-top:32px;border-top:1px solid #1a1a3e;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#8888aa;">
                      Patrick Lee Zepeda<br />
                      patrickleezepeda.com
                    </p>
                    <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;">
                      <a href="https://www.youtube.com/@Patrick_Lee_Zepeda" target="_blank" rel="noopener noreferrer" style="color:#00ffff;text-decoration:none;">YouTube</a>
                      <span style="color:#444466;"> | </span>
                      <a href="https://medium.com/@patrickzepeda" target="_blank" rel="noopener noreferrer" style="color:#ff00ff;text-decoration:none;">Medium</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: WELCOME_SUBJECT,
    text,
    html,
    firstName,
    serviceLabel,
  };
}
