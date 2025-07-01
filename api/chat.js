// In api/chat.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');

// Initialize the Express application
const app = express();

// Add middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors());

// Define the API route for chat requests
app.post('/api/chat', async (req, res) => {
    const { messages, purpose } = req.body;

    // Route the request based on the 'purpose'
    if (purpose === 'graph_lab') {
        // --- This section handles the Graph Lab request using OpenAI's gpt-4o-mini ---
        console.log("Routing to OpenAI (gpt-4o-mini) for Graph Lab...");
        
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const API_URL = "https://api.openai.com/v1/chat/completions";

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: { message: 'OpenAI API key not configured.' } });
        }

        const requestData = {
            model: 'gpt-4.1',
            messages: messages,
        };

        const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        };

        try {
            const response = await axios.post(API_URL, requestData, { headers: requestHeaders });
            res.status(200).json(response.data);
        } catch (error) {
            console.error('Error calling OpenAI API for Graph Lab:', error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.error?.message || 'Failed to get response from OpenAI.';
            res.status(500).json({ error: { message: errorMessage } });
        }

    } else {
        // --- This is the default path for all other chat requests, using gpt-4-turbo ---
        console.log("Routing to OpenAI (default) for general chat...");
        
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const API_URL = "https://api.openai.com/v1/chat/completions";

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: { message: 'OpenAI API key not configured.' } });
        }

        const requestData = {
            model: 'gpt-4.1',
            messages: messages,
        };

        const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        };

        try {
            const response = await axios.post(API_URL, requestData, { headers: requestHeaders });
            res.status(200).json(response.data);
        } catch (error) {
            console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.error?.message || 'Failed to get response from OpenAI.';
            res.status(500).json({ error: { message: errorMessage } });
        }
    }
});

// Export the app to be used by the Vercel serverless environment
module.exports = app;