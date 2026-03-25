const axios = require('axios');

exports.handler = async (event, context) => {
  // 1. Only allow POST requests for security
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
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

    // 2. Configure the Google Places API (New) Search
    // We use a textQuery to combine category and city
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const response = await axios.post(url, 
      {
        textQuery: `${category} in ${city}`,
        maxResultCount: 20 // Keeping it low to stay in free/low cost tiers
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // FieldMask ensures we ONLY get the data we need (saves money!)
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.userRatingCount,places.websiteUri'
        }
      }
    );

    const allPlaces = response.data.places || [];

    // 3. The "Gold Mine" Filter Logic
    // We filter for 500-1000 reviews AND no website listed
    const filteredLeads = allPlaces.filter(place => {
      const reviewCount = place.userRatingCount || 0;
      const hasNoWebsite = !place.websiteUri;
      
      return reviewCount >= 500 && reviewCount <= 1000 && hasNoWebsite;
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        totalFound: allPlaces.length,
        goldLeads: filteredLeads
      }),
    };

  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch leads from Google Maps." }),
    };
  }
};