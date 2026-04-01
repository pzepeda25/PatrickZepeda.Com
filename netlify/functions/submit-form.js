import { getStore } from '@netlify/blobs';
import fs from 'node:fs/promises';
import path from 'node:path';

const LOCAL_DATA_PATH = path.join(process.cwd(), '.netlify/local-data/form-submissions.json');

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Parse Payload
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    console.error('❌ Invalid JSON:', err.message);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const timestamp = new Date().toISOString();
  const submission = { ...payload, receivedAt: timestamp };
  const isProduction = !!process.env.NETLIFY;

  // 2. Try Netlify Blobs (Primary)
  try {
    const store = getStore('form-submissions');
    await store.setJSON(timestamp, submission);
    console.log('✅ Form submission stored in Netlify Blobs');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Stored in Blobs' }),
    };
  } catch (blobError) {
    console.warn('⚠️ Netlify Blobs failed:', blobError.message);
    
    // 3. Fallback: Only if NOT in production
    if (!isProduction) {
      try {
        let submissions = [];
        try {
          const data = await fs.readFile(LOCAL_DATA_PATH, 'utf8');
          submissions = JSON.parse(data);
        } catch (readErr) { /* ignore missing file */ }
        
        submissions.push(submission);
        await fs.mkdir(path.dirname(LOCAL_DATA_PATH), { recursive: true });
        await fs.writeFile(LOCAL_DATA_PATH, JSON.stringify(submissions, null, 2));
        console.log('✅ Form submission stored in local JSON file');
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, message: 'Stored in local file' }),
        };
      } catch (fallbackError) {
        console.error('❌ Local fallback failed:', fallbackError.message);
      }
    }

    // If we get here, it failed in production or both failed locally
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Storage failure', 
        details: isProduction ? 'Blobs unavailable' : 'Both Blobs and local storage failed' 
      }),
    };
  }
};
