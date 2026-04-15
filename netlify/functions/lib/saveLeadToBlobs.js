import { getStore } from '@netlify/blobs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export const CHATBOT_LEADS_STORE = 'chatbot-leads';

const LOCAL_FALLBACK_PATH = path.join(
  process.cwd(),
  '.netlify/local-data/chatbot-leads.json',
);

/**
 * Persists a lead object to Netlify Blobs (store `chatbot-leads`).
 * Key format: `leads/{timestamp}-{randomId}.json`
 *
 * Local dev: if Blobs are unavailable, appends to `.netlify/local-data/chatbot-leads.json`.
 *
 * @param {Record<string, unknown>} lead - Full lead record (already validated)
 * @returns {Promise<{ blobKey: string; provider: 'blobs' | 'local-file' }>}
 */
export async function saveLeadToBlobs(lead) {
  const ts = Date.now();
  const rand = randomBytes(5).toString('hex');
  const blobKey = `leads/${ts}-${rand}.json`;
  const isProduction = !!process.env.NETLIFY;

  try {
    let store;
    try {
      store = getStore(CHATBOT_LEADS_STORE);
    } catch {
      store = getStore({
        name: CHATBOT_LEADS_STORE,
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN,
      });
    }

    await store.setJSON(blobKey, lead);
    return { blobKey, provider: 'blobs' };
  } catch (error) {
    if (!isProduction) {
      try {
        let rows = [];
        try {
          const raw = await fs.readFile(LOCAL_FALLBACK_PATH, 'utf8');
          rows = JSON.parse(raw);
          if (!Array.isArray(rows)) rows = [];
        } catch {
          rows = [];
        }
        rows.push({ blobKey, lead, savedAt: new Date().toISOString() });
        await fs.mkdir(path.dirname(LOCAL_FALLBACK_PATH), { recursive: true });
        await fs.writeFile(LOCAL_FALLBACK_PATH, JSON.stringify(rows, null, 2));
        return { blobKey, provider: 'local-file' };
      } catch (fallbackErr) {
        console.error('Local chatbot lead fallback failed:', fallbackErr);
      }
    }
    throw error;
  }
}
