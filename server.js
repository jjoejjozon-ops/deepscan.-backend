// --- 1. IMPORT NECESSARY MODULES ---
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import fetch from "node-fetch";

// Load .env file (locally) — on Render, env vars are loaded automatically
dotenv.config();

// Set the correct PORT (Render uses process.env.PORT)
const PORT = process.env.PORT || 3000;

const app = express();

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// --- 4. ROUTES ---

// Health check route (important for Render)
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
            return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
        }

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








