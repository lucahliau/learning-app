// In api/chat.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
// --- CHANGE 1: Import the new Google AI SDK ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/chat', async (req, res) => {
    const { messages, purpose } = req.body;

    // --- The logic now splits based on the 'purpose' ---
    if (purpose === 'graph_lab') {
        // --- SECTION A: HANDLE GEMINI REQUEST ---
        console.log("Routing to Gemini for Graph Lab...");
        
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: { message: 'Gemini API key not configured.' } });
        }

        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            
            // You requested Gemini 2.5 Pro. The current top-tier public model is `gemini-1.5-pro-latest`.
            // I'll use that, but you can update this string if '2.5-pro' becomes available.
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); 

            // Extract the user's prompt from the message history
            const userPrompt = messages.find(m => m.role === 'user')?.content || '';
            if (!userPrompt) {
                return res.status(400).json({ error: { message: 'No user prompt found for Gemini.' } });
            }

            const result = await model.generateContent(userPrompt);
            const response = await result.response;
            const text = response.text();

            // Manually format the Gemini response to match what the frontend expects
            const formattedResponse = {
                choices: [{
                    message: {
                        content: text
                    }
                }]
            };
            
            res.status(200).json(formattedResponse);

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            res.status(500).json({ error: { message: 'Failed to get response from Gemini.' } });
        }

    } else {
        // --- SECTION B: HANDLE OPENAI REQUEST (DEFAULT) ---
        console.log("Routing to OpenAI for default chat...");
        
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const API_URL = "https://api.openai.com/v1/chat/completions";

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: { message: 'OpenAI API key not configured.' } });
        }

        const requestData = {
            model: 'gpt-4.1', // Your existing default model
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
            const errorMessage = error.response?.data?.error?.message || 'Failed to get response from OpenAI.';
            res.status(500).json({ error: { message: errorMessage } });
        }
    }
});

module.exports = app;