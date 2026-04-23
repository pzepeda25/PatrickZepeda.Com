function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|h1|h2|h3|li|tr|table|br)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function replacePlaceholders(template, replacements) {
  let out = String(template || '');
  for (const [key, value] of Object.entries(replacements)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(
      new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, 'g'),
      String(value ?? ''),
    );
  }
  return out;
}

function firstNameFromContact(contact) {
  const full = String(contact?.name || '').trim();
  if (!full) return 'there';
  return full.split(/\s+/)[0] || 'there';
}

export function buildEmail({
  subject,
  preheader,
  title,
  bodyHtml,
  ctaLabel,
  heroImageUrl,
  contact,
  primaryCtaUrl,
}) {
  const replacements = {
    firstName: firstNameFromContact(contact),
    serviceInterest: String(contact?.serviceInterest || 'your project'),
    primaryCtaUrl: String(primaryCtaUrl || ''),
  };

  const resolvedSubject = replacePlaceholders(subject, replacements);
  const resolvedPreheader = replacePlaceholders(preheader, replacements);
  const resolvedTitle = replacePlaceholders(title, replacements);
  const resolvedBodyHtml = replacePlaceholders(bodyHtml, replacements);
  const resolvedCtaLabel = replacePlaceholders(ctaLabel, replacements);

  const preheaderRow = resolvedPreheader
    ? `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;">${resolvedPreheader}</div>`
    : '';
  const heroRow = heroImageUrl
    ? `<p style="margin:0 0 18px 0;"><img src="${heroImageUrl}" alt="" style="display:block;width:100%;max-width:592px;height:auto;border:0;" /></p>`
    : '';
  const ctaRow =
    resolvedCtaLabel && primaryCtaUrl
      ? `<p style="margin:18px 0 0 0;"><a href="${primaryCtaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:6px;font-weight:600;">${resolvedCtaLabel}</a></p>`
      : '';

  const html = [
    '<!doctype html>',
    '<html>',
    '<body style="margin:0;padding:24px;background:#f5f6f8;color:#111827;">',
    preheaderRow,
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
    '<tr><td align="center">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">',
    '<tr><td style="padding:24px;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.6;">',
    heroRow,
    `<h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;">${resolvedTitle}</h1>`,
    resolvedBodyHtml,
    ctaRow,
    '<p style="margin:22px 0 0 0;">- Patrick</p>',
    '</td></tr></table>',
    '</td></tr></table>',
    '</body>',
    '</html>',
  ].join('');

  const text = [
    stripHtml(resolvedTitle),
    stripHtml(resolvedBodyHtml),
    resolvedCtaLabel && primaryCtaUrl
      ? `${resolvedCtaLabel}: ${primaryCtaUrl}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    subject: resolvedSubject,
    html,
    text,
  };
}
