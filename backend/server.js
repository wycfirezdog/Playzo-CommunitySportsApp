require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Allow requests from your frontend development server
app.use(cors({
  origin: 'http://localhost:3000' 
}));

app.get('/api/places', async (req, res) => {
    const { lat, lng, keyword } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!lat || !lng || !keyword) {
        return res.status(400).json({ error: 'Latitude, longitude, and keyword are required' });
    }

    if (!apiKey || apiKey === 'your_google_places_api_key_here') {
        console.error('API key not configured on the server.');
        return res.status(500).json({ error: 'API key not configured on the server' });
    }

    try {
        let response;
        
        // --- Nearby Search ---
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
        const nearbyParams = {
            location: `${lat},${lng}`,
            radius: 20000,
            keyword,
            type: 'establishment',
            key: apiKey,
        };

        response = await axios.get(nearbyUrl, { params: nearbyParams });

        // --- Text Search Fallback ---
        if (response.data.status === 'ZERO_RESULTS') {
            console.log(`No nearby results for "${keyword}", trying Text Search...`);
            const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
            const textParams = {
                query: `${keyword}`,
                location: `${lat},${lng}`,
                radius: 20000,
                key: apiKey,
            };
            response = await axios.get(textUrl, { params: textParams });
        }
        
        res.json(response.data);

    } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        console.error('Error fetching from Google Places API:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch data from Google Places API', details: errorMessage });
    }
});


app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
}); 