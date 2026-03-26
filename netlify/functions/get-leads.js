const axios = require('axios');
const crypto = require('crypto');

/**
 * Compare two strings in constant time (avoid timing leaks on the secret).
 */
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Netlify may pass headers with varied casing; normalize lookup.
 */
function getHeader(headers, name) {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === lower);
  return key ? headers[key] : undefined;
}

exports.handler = async (event) => {
  // 1. Browser Health Check (GET)
  if (event.httpMethod === "GET") {
    return { statusCode: 200, body: "🚀 LEAD HUNTER ENGINE IS ONLINE!" };
  }

  // 2. Security Check (Only allow POST)
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const expectedSecret = process.env.VIBE_SECRET;
  if (!expectedSecret || !String(expectedSecret).trim()) {
    console.error("VIBE_SECRET is not set");
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server misconfigured: missing VIBE_SECRET." }),
    };
  }

  const providedSecret = getHeader(event.headers, "x-vibe-secret");
  const trimmedProvided = (providedSecret || "").trim();
  const trimmedExpected = expectedSecret.trim();
  if (!trimmedProvided || !constantTimeEqual(trimmedProvided, trimmedExpected)) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    const { category, city } = JSON.parse(event.body);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!category || !city) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Category and City are required." })
      };
    }

    // 3. The Google Search
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const response = await axios.post(url, 
      {
        textQuery: `${category} in ${city}`,
        maxResultCount: 40 // Increased for a better pool of data
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri'
        }
      }
    );

    const allPlaces = response.data.places || [];

    // 4. THE DATA STRATEGY: Rule 5 - Data Dominates
    // We transform raw Google data into "Opportunity Data"
    const processedLeads = allPlaces.map(place => {
      const flags = [];
      if (!place.websiteUri) flags.push("NO_WEBSITE");
      if (place.userRatingCount < 15) flags.push("LOW_REVIEWS");
      if (place.rating && place.rating < 4.2) flags.push("FIXABLE_RATING");

      return {
        name: place.displayName?.text,
        rating: place.rating || 0,
        reviews: place.userRatingCount || 0,
        website: place.websiteUri || null,
        address: place.formattedAddress,
        mapUrl: place.googleMapsUri,
        flags: flags,
        isGold: flags.length > 0 // If they have even one issue, they are a lead
      };
    });

    // Sort so the "Goldest" leads (most flags) are at the top
    const sortedLeads = processedLeads.sort((a, b) => b.flags.length - a.flags.length);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalFound: allPlaces.length,
        goldCount: sortedLeads.filter(l => l.isGold).length,
        leads: sortedLeads
      })
    };

  } catch (error) {
    console.error("Engine Error:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch leads", details: error.message })
    };
  }
};