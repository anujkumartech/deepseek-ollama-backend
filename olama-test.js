// test-ollama.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Simple test endpoint
app.get('/test-ollama', async (req, res) => {
    try {
        const response = await axios.post('http://127.0.0.1:11434/api/generate', {
            model: "deepseek-r1:8b",
            prompt: "Hello, this is a test message.",
            stream: false
        });
        
        res.json({
            success: true,
            message: 'Successfully connected to Ollama',
            ollamaResponse: response.data
        });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: {
                code: error.code,
                response: error.response?.data || null
            }
        });
    }
});

// Check Ollama status
app.get('/ollama-status', async (req, res) => {
    try {
        const response = await axios.get('http://127.0.0.1:11434/api/tags');
        res.json({
            success: true,
            models: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});