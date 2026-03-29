import { getStore } from '@netlify/blobs';

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

  // Calculate Lead Strength (1-5)
  let strength = 1;
  const messageLength = payload.message ? payload.message.length : 0;
  
  // Budget logic: assume budget is a string or number
  let budgetVal = 0;
  if (payload.budget) {
    if (typeof payload.budget === 'number') {
      budgetVal = payload.budget;
    } else if (typeof payload.budget === 'string') {
      // Extract numbers from string like "$5,000+"
      const match = payload.budget.replace(/,/g, '').match(/\d+/);
      if (match) budgetVal = parseInt(match[0], 10);
    }
  }

  if (budgetVal >= 5000) strength += 2;
  else if (budgetVal >= 1000) strength += 1;

  if (messageLength >= 200) strength += 2;
  else if (messageLength >= 50) strength += 1;

  // Cap at 5
  strength = Math.min(strength, 5);

  // Category
  const category = payload.category ? payload.category.toLowerCase().replace(/[^a-z0-9]/g, '') : 'general';

  const store = getStore('leads');
  const timestamp = new Date().toISOString();
  const key = `strength-${strength}-${category}-${timestamp}`;

  await store.setJSON(key, { ...payload, receivedAt: timestamp, strength, category });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, key }),
  };
};
