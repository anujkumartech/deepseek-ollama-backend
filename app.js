const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed!'));
    }
}).single('pdfFile');

app.post('/analyze-pdf', (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ error: 'Upload error', details: err.message });
        }
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No PDF file uploaded' });
            }

            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdfParse(dataBuffer);
            const pdfText = data.text;
            fs.unlinkSync(req.file.path);

            const response = await axios.post('http://127.0.0.1:11434/api/generate', {
                model: "deepseek-r1:8b",
                prompt: `Analyze this resume. Resume text is between two --- given ahead: ---${pdfText}---`,
                stream: false
            });
            
            res.json({ success: true, message: 'Successfully connected to Ollama', ollamaResponse: response.data });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Error processing PDF', details: error.message });
        }
    });
});

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
