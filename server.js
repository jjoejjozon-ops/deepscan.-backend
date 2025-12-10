// --- 1. REQUIRE NECESSARY MODULES (Fixed for CommonJS) ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch'); // Make sure 'node-fetch' is in your package.json

// Load .env file (locally) — on Render, env vars are loaded automatically
// This is okay to keep, as it won't crash when running on Render
dotenv.config();

// Set the correct PORT (Render uses process.env.PORT)
const PORT = process.env.PORT || 3000;

const app = express();

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// multer.memoryStorage is good for deployments like Render
const upload = multer({ storage: multer.memoryStorage() });

// --- 4. ROUTES ---

// Health check route (important for Render to mark the service as healthy)
app.get('/', (req, res) => {
    res.status(200).send('DeepScan AI Backend is Running!');
});

// Deepfake Analysis Route
app.post("/api/analyze", upload.single("video"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No video uploaded" });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            // This is a great check for ensuring the API key is set
            return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
        }

        // The logic for video buffer and API call is correct
        const b64 = req.file.buffer.toString("base64");

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: "video/mp4",
                                data: b64
                            }
                        },
                        { text: "Analyze this video and detect if it's real or deepfake. Respond with JSON only." }
                    ]
                }
            ]
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
});

// --- 5. START SERVER ---
app.listen(PORT, () => {
    console.log(`DeepScan Server is listening on PORT ${PORT}`);
});
