import Groq from "groq-sdk";
import express from "express";
import "dotenv/config";
import cors from "cors";
const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = {
    role: "system",
    content: `You are a helpful coding assistant. 
    - Keep answers concise and practical
    - Use code examples when relevant
    - If you don't know something, say so
    - Format code blocks with proper syntax highlighting`
};

const AVAILABLE_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
];
const rateLimit = new Map();
const RATE_LIMIT = {
    windowMs: 60 * 1000, 
    maxRequests: 20        
};

function checkRateLimit(clientId) {
    const now = Date.now();
    const clientData = rateLimit.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT.windowMs };
    
    if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + RATE_LIMIT.windowMs;
    }

    clientData.count++;
    rateLimit.set(clientId, clientData);

    return {
        allowed: clientData.count <= RATE_LIMIT.maxRequests,
        remaining: Math.max(0, RATE_LIMIT.maxRequests - clientData.count),
        resetIn: Math.ceil((clientData.resetTime - now) / 1000)
    };
}

app.get("/api/models", (req, res) => {
    res.json({ models: AVAILABLE_MODELS });
});

app.post("/api/chat/stream", async (req, res) => {
    const { message, model, history = [] } = req.body;
    const clientId = req.ip || "unknown";

    if (!message) {
        return res.status(400).json({ error: "message is required" });
    }

    const rateCheck = checkRateLimit(clientId);
    if (!rateCheck.allowed) {
        return res.status(429).json({
            error: "Rate limit exceeded",
            retryAfter: rateCheck.resetIn
        });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const stream = await groq.chat.completions.create({
            model: model || "llama-3.3-70b-versatile",
            messages: [SYSTEM_PROMPT, ...history, { role: "user", content: message }],
            stream: true,
            max_tokens: 1024,
            temperature: 0.7,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (error) {
        console.error("Error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});