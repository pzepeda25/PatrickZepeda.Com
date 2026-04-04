import { getStore } from '@netlify/blobs';
import fs from 'node:fs/promises';
import path from 'node:path';

const LOCAL_DATA_PATH = path.join(process.cwd(), '.netlify/local-data/form-submissions.json');

export const handler = async (event) => {
  console.log('--- Submission Function Triggered ---');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON', details: err.message }),
    };
  }

  const timestamp = new Date().toISOString();
  const key = `${timestamp.replace(/[:.]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
  const isProduction = !!process.env.NETLIFY;
  
  try {
    console.log('Attempting to access Blobs store...');
    
    // Try primary method: Automatic context
    let store;
    try {
      store = getStore('form-submissions');
    } catch (e) {
      console.log('Automatic getStore failed, trying explicit config...');
      store = getStore({
        name: 'form-submissions',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN,
      });
    }
    
    console.log('Attempting to setJSON in Blob:', key);
    await store.setJSON(key, {
      ...payload,
      receivedAt: timestamp,
      metadata: {
        ip: event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'] || 'hidden',
        ua: event.headers['user-agent'] || 'hidden'
      }
    });

    console.log('✅ Success: Submission stored in Blobs.');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: key, provider: 'blobs' }),
    };
  } catch (error) {
    console.error('❌ Blobs Error:', error.message);
    
    // Fallback: Only if NOT in production (for local testing as requested)
    if (!isProduction) {
      console.log('⚠️ Falling back to local file storage for testing...');
      try {
        let submissions = [];
        try {
          const data = await fs.readFile(LOCAL_DATA_PATH, 'utf8');
          submissions = JSON.parse(data);
        } catch (readErr) { /* ignore missing file */ }
        
        const localEntry = { ...payload, key, receivedAt: timestamp };
        submissions.push(localEntry);
        
        await fs.mkdir(path.dirname(LOCAL_DATA_PATH), { recursive: true });
        await fs.writeFile(LOCAL_DATA_PATH, JSON.stringify(submissions, null, 2));
        
        console.log('✅ Success: Submission stored in local file.');
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, id: key, provider: 'local-file' }),
        };
      } catch (fallbackError) {
        console.error('❌ Local fallback failed:', fallbackError.message);
      }
    }

    // In production, we MUST use Blobs. Return failure info.
    const debug = [];
    if (!process.env.NETLIFY_SITE_ID) debug.push('Missing SITE_ID');
    if (!process.env.NETLIFY_AUTH_TOKEN) debug.push('Missing AUTH_TOKEN');
    if (!isProduction) debug.push('Not in production environment');

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Vault storage failed', 
        details: error.message,
        debug: debug.length > 0 ? debug.join(' | ') : 'Check Netlify Blobs permissions in Dashboard'
      }),
    };
  }
};
