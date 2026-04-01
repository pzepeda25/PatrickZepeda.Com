import { getStore } from '@netlify/blobs';

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
  
  try {
    console.log('Attempting to access Blobs store...');
    
    // Explicitly check for context or provide site ID if available
    const store = getStore({
      name: 'form-submissions',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });
    
    console.log('Attempting to setJSON in Blob:', key);
    await store.setJSON(key, {
      ...payload,
      receivedAt: timestamp,
      metadata: {
        ip: event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'] || 'hidden',
        ua: event.headers['user-agent'] || 'hidden'
      }
    });

    console.log('✅ Success: Submission stored.');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: key }),
    };
  } catch (error) {
    console.error('❌ Blobs Error:', error);
    
    // Check if we're missing environment variables
    const missingVars = [];
    if (!process.env.NETLIFY_SITE_ID) missingVars.push('NETLIFY_SITE_ID');
    if (!process.env.NETLIFY_AUTH_TOKEN) missingVars.push('NETLIFY_AUTH_TOKEN');
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Vault storage failed', 
        details: error.message,
        debug: missingVars.length > 0 ? `Missing env vars: ${missingVars.join(', ')}` : `Error type: ${error.name}. Make sure Blobs are enabled in Netlify UI.`
      }),
    };
  }
};
