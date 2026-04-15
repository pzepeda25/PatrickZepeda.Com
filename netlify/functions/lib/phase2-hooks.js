/**
 * Phase 2 — n8n / automation (not wired yet)
 *
 * Called from `submit-chatbot-lead.js` only after `saveLeadToBlobs()` succeeds.
 * Add your webhook POST here, e.g.:
 *
 *   const url = process.env.N8N_WEBHOOK_URL;
 *   if (!url) return;
 *   await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, blobKey }) });
 *
 * Keep secrets in Netlify environment variables only (never in frontend).
 *
 * @param {Record<string, unknown>} lead - Stored lead payload
 * @param {{ blobKey: string; provider: string }} ctx - Storage result from saveLeadToBlobs
 */
export async function afterLeadSavedToBlobs(lead, ctx) {
  void lead;
  void ctx;
  // Intentionally empty for phase 1
}
