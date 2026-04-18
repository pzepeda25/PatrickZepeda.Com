/**
 * Minimal Resend send wrapper. Uses the REST API directly so we don't have
 * to add another dependency.
 *
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */
export async function sendEmail({
  from,
  to,
  subject,
  text,
  html,
  replyTo,
  headers,
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');

  const body = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
  };
  if (text) body.text = text;
  if (html) body.html = html;
  if (replyTo) body.reply_to = replyTo;
  if (headers) body.headers = headers;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Resend send failed (${res.status}): ${JSON.stringify(json)}`,
    );
  }
  return json; // { id: '...' }
}
