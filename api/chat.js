// In api/chat.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from your frontend

// This is the endpoint your frontend will call
app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    // --- CHANGE 1: Use the new environment variable name ---
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    // --- CHANGE 2: Use the OpenAI API endpoint ---
    const API_URL = "https://api.openai.com/v1/chat/completions";

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: { message: 'API key not configured.' } });
    }

    // --- CHANGE 3: Structure the request for OpenAI ---
    const requestData = {
        model: 'gpt-4.1', // Or any other model you prefer, like 'gpt-4'
        messages: messages,
    };

    const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}` // OpenAI requires a Bearer token
    };

    try {
        const response = await axios.post(API_URL, requestData, {
            headers: requestHeaders
        });

        // --- CHANGE 4: Simplify the response handling ---
        // The OpenAI API response is already in the format your frontend expects.
        // We can just send it directly.
        res.status(200).json(response.data);

    } catch (error) {
        // Provide more detailed error logging
        console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error 
            ? error.response.data.error.message 
            : 'Failed to get response from AI.';
        res.status(500).json({ error: { message: errorMessage } });
    }
});

// This is needed for Vercel to correctly handle the Express app
module.exports = app;