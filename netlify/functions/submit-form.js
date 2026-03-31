import { getStore } from '@netlify/blobs';
import fs from 'node:fs/promises';
import path from 'node:path';

const LOCAL_DATA_PATH = path.join(process.cwd(), '.netlify/local-data/form-submissions.json');

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const timestamp = new Date().toISOString();
  const submission = { ...payload, receivedAt: timestamp };

  try {
    // Try using Netlify Blobs first
    const store = getStore('form-submissions');
    await store.setJSON(timestamp, submission);
    console.log('✅ Form submission stored in Netlify Blobs');
  } catch (error) {
    console.warn('⚠️ Netlify Blobs not available locally, falling back to local file storage:', error.message);
    
    // Fallback: Local file-based storage
    try {
      let submissions = [];
      try {
        const data = await fs.readFile(LOCAL_DATA_PATH, 'utf8');
        submissions = JSON.parse(data);
      } catch (err) {
        // File doesn't exist yet, ignore
      }
      
      submissions.push(submission);
      await fs.mkdir(path.dirname(LOCAL_DATA_PATH), { recursive: true });
      await fs.writeFile(LOCAL_DATA_PATH, JSON.stringify(submissions, null, 2));
      console.log('✅ Form submission stored in local JSON file');
    } catch (fallbackError) {
      console.error('❌ Failed to store form submission locally:', fallbackError.message);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to store submission' }),
      };
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
