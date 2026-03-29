import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const vibeSecret = event.headers['x-vibe-secret'];
  if (!vibeSecret || vibeSecret !== process.env.X_VIBE_SECRET) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  try {
    const store = getStore({ 
      name: 'leads', 
      siteID: process.env.NETLIFY_SITE_ID, 
      token: process.env.NETLIFY_AUTH_TOKEN 
    });

    const { blobs } = await store.list();
    
    // Fetch all blob contents
    const leads = await Promise.all(
      blobs.map(async (blob) => {
        const data = await store.get(blob.key, { type: 'json' });
        return {
          key: blob.key,
          ...data
        };
      })
    );

    // Sort by strength descending, then by receivedAt descending
    leads.sort((a, b) => {
      if (b.strength !== a.strength) {
        return (b.strength || 0) - (a.strength || 0);
      }
      const dateA = new Date(a.receivedAt || 0).getTime();
      const dateB = new Date(b.receivedAt || 0).getTime();
      return dateB - dateA;
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    };
  } catch (error) {
    console.error('BLOB_LIST_ERROR:', error);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch leads from database' }),
    };
  }
};
