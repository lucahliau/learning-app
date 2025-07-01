// In api/chat.js

app.post('/api/chat', async (req, res) => {
    // The user's messages and the purpose of the request are extracted from the request body.
    const { messages, purpose } = req.body;

    // The logic now splits based on whether the purpose is for the 'graph_lab'.
    if (purpose === 'graph_lab') {
        // --- This section now handles the Graph Lab request using OpenAI ---
        console.log("Routing to OpenAI (gpt-4o-mini) for Graph Lab...");
        
        // Retrieve the OpenAI API key from environment variables.
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const API_URL = "https://api.openai.com/v1/chat/completions";

        // If the API key is not configured, return an error.
        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: { message: 'OpenAI API key not configured.' } });
        }

        // Prepare the data for the OpenAI API request, specifying the 'gpt-4o-mini' model.
        const requestData = {
            model: 'gpt-4o-mini',
            messages: messages,
        };

        const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        };

        try {
            // Make the API call to OpenAI using axios.
            const response = await axios.post(API_URL, requestData, {
                headers: requestHeaders
            });
            // Send the response from OpenAI back to the frontend.
            res.status(200).json(response.data);

        } catch (error) {
            // Handle any errors that occur during the API call.
            console.error('Error calling OpenAI API for Graph Lab:', error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.error?.message || 'Failed to get response from OpenAI.';
            res.status(500).json({ error: { message: errorMessage } });
        }

    } else {
        // --- This is the default path for all other chat requests ---
        console.log("Routing to OpenAI (default) for general chat...");
        
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const API_URL = "https://api.openai.com/v1/chat/completions";

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: { message: 'OpenAI API key not configured.' } });
        }

        // Use the standard model for general chat.
        const requestData = {
            model: 'gpt-4-turbo', 
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