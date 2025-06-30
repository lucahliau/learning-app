// In api/chat.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/chat', async (req, res) => {
    // --- CHANGE 1: Get the new 'purpose' field from the request body ---
    const { messages, purpose } = req.body;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const API_URL = "https://api.openai.com/v1/chat/completions";

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: { message: 'API key not configured.' } });
    }

    // --- CHANGE 2: Choose the model based on the 'purpose' flag ---
    let modelName;
    if (purpose === 'graph_lab') {
        // Use a more powerful model for the complex Vega-Lite generation
        modelName = 'o3'; // Or 'gpt-4-turbo'
        console.log("Routing to Graph Lab model:", modelName);
    } else {
        // Use the standard model for all other requests
        modelName = 'gpt-4.1'; // This was your previous model
        console.log("Routing to default model:", modelName);
    }

    // --- CHANGE 3: Use the selected modelName variable in the request ---
    const requestData = {
        model: modelName,
        messages: messages,
    };

    const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };

    try {
        const response = await axios.post(API_URL, requestData, {
            headers: requestHeaders
        });

        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error 
            ? error.response.data.error.message 
            : 'Failed to get response from AI.';
        res.status(500).json({ error: { message: errorMessage } });
    }
});

module.exports = app;