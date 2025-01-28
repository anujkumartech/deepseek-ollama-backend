// app.js
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

// Configure multer for PDF files only
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        // Accept only PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
}).single('pdfFile'); // This name must match the form field name

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to handle PDF upload and analysis
app.post('/analyze-pdf', (req, res) => {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            return res.status(400).json({
                error: 'Upload error',
                details: err.message
            });
        } else if (err) {
            // An unknown error occurred
            return res.status(400).json({
                error: 'Unknown error',
                details: err.message
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No PDF file uploaded' });
            }

            // Read the uploaded PDF file
            const dataBuffer = fs.readFileSync(req.file.path);

            // Extract text from PDF
            const data = await pdfParse(dataBuffer);
            const pdfText = data.text;

            // Clean up the uploaded file
            fs.unlinkSync(req.file.path);

            // Prepare the request to Ollama
            console.log('pdfText', pdfText);

            const response = await axios.post('http://127.0.0.1:11434/api/generate', {
                model: "deepseek-r1:8b",
               // "prompt": "What is the intention of the user with this prompt between two \\ ? Give me yes or no answer, do they want picture or text information? //\\Explain me what is Horse.\\",
                 prompt: `Analyze this resume. Resume text is between two --- given ahead: ---${pdfText}---`,
                stream: false
            });
            
            res.json({
                success: true,
                message: 'Successfully connected to Ollama',
                ollamaResponse: response.data
            });
            // const ollamaPayload = {
            //     model: "deepseek-r1:8b", // You can change this to your preferred model
            //     role: "system",
            //     "prompt": "What is the intentation of the user with this promot between two \\ ? Give me yes or no answer, do they want picture or text information? //\\Explain me what is Horse.\\",
            //     // prompt: `Analyze this resume. Resume text is between two --- given ahead: ---${pdfText}---`,
            //     stream: false
            // };

            // // Send the text to Ollama for analysis
            // const ollamaResponse = await axios.post('http://localhost:11434/api/generate', ollamaPayload);

            // // Return the analysis results
            // res.json({
            //     success: true,
            //     analysis: ollamaResponse.data.response,
            //     originalText: pdfText
            // });

        } catch (error) {
            console.error('Error processing PDF:', error);
            // Clean up file if it exists
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                error: 'Error processing PDF',
                details: error.message
            });
        }
    });
});

// Make sure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});