import Groq from "groq-sdk";
import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

app.use(express.json());

// ============================================
// CONCEPT 1: CONVERSATION HISTORY
// ============================================
// LLMs are stateless - they don't remember previous messages
// We need to store and send the full conversation each time
const conversationHistory = [];

// ============================================
// CONCEPT 2: SYSTEM PROMPT
// ============================================
// System prompt is a hidden instruction that defines:
// - Who the AI is (role)
// - How it should behave (rules)
// - What it should/shouldn't do (constraints)
// User never sees this, but it shapes every response
const SYSTEM_PROMPT = {
    role: "system",
    content: `You are a helpful coding assistant. 
    - Keep answers concise and practical
    - Use code examples when relevant
    - If you don't know something, say so
    - Format code blocks with proper syntax highlighting`
};

// ============================================
// CONCEPT 7: RETRY LOGIC (Handling Failures)
// ============================================
// APIs can fail due to:
// - Network issues
// - Rate limits (too many requests)
// - Server overload
// Solution: Retry the request with increasing delays
async function callWithRetry(apiCall, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            // Check if error is retryable
            const isRetryable = 
                error.status === 429 ||  // Rate limit
                error.status === 500 ||  // Server error
                error.status === 503;    // Service unavailable
            
            if (!isRetryable || attempt === maxRetries) {
                throw error;  // Don't retry, throw the error
            }
            
            // Exponential backoff: wait longer each retry
            // Attempt 1: wait 1 second
            // Attempt 2: wait 2 seconds
            // Attempt 3: wait 4 seconds
            const waitTime = Math.pow(2, attempt - 1) * 1000;
            console.log(`Attempt ${attempt} failed. Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

// ============================================
// CONCEPT 8: RATE LIMITING (Preventing Overuse)
// ============================================
// Problem: Users can spam your API, causing high costs
// Solution: Limit requests per user/IP
// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT = {
    windowMs: 60 * 1000,  // 1 minute window
    maxRequests: 20        // Max 20 requests per minute
};

function checkRateLimit(clientId) {
    const now = Date.now();
    const clientData = rateLimitStore.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT.windowMs };
    
    // Reset if window has passed
    if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + RATE_LIMIT.windowMs;
    }
    
    clientData.count++;
    rateLimitStore.set(clientId, clientData);
    
    return {
        allowed: clientData.count <= RATE_LIMIT.maxRequests,
        remaining: Math.max(0, RATE_LIMIT.maxRequests - clientData.count),
        resetIn: Math.ceil((clientData.resetTime - now) / 1000)
    };
}

// ============================================
// CONCEPT 9: TOKEN BUDGETING (Cost Control)
// ============================================
// Track token usage to prevent unexpected bills
let totalTokensUsed = {
    input: 0,
    output: 0,
    total: 0
};

const TOKEN_BUDGET = {
    maxPerRequest: 2000,   // Max tokens per single request
    maxPerDay: 100000      // Max tokens per day (reset manually)
};

function trackTokenUsage(usage) {
    totalTokensUsed.input += usage.prompt_tokens || 0;
    totalTokensUsed.output += usage.completion_tokens || 0;
    totalTokensUsed.total += usage.total_tokens || 0;
    
    console.log(`Tokens used this session: ${totalTokensUsed.total}`);
    
    return totalTokensUsed;
}

// ============================================
// MAIN CHAT ENDPOINT
// ============================================
app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    const clientId = req.ip || "unknown";  // Use IP as client identifier
    
    console.log("User:", message);

    // Validate input
    if (!message) {
        return res.status(400).json({ error: "message is required" });
    }

    // Check rate limit
    const rateCheck = checkRateLimit(clientId);
    if (!rateCheck.allowed) {
        return res.status(429).json({ 
            error: "Rate limit exceeded",
            retryAfter: rateCheck.resetIn,
            message: `Too many requests. Please wait ${rateCheck.resetIn} seconds.`
        });
    }

    // Add user message to history
    conversationHistory.push({ role: "user", content: message });

    try {
        // Use retry wrapper for resilience
        const response = await callWithRetry(async () => {
            return await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                
                // CONCEPT 3: TEMPERATURE
                // Controls randomness/creativity
                // 0 = deterministic (same input = same output)
                // 0.7 = balanced
                // 2 = very creative/random
                temperature: 0.7,
                
                // CONCEPT 4: MAX TOKENS
                // Limits response length to control cost
                // 1 token ≈ 4 characters
                max_tokens: Math.min(TOKEN_BUDGET.maxPerRequest, 1024),
                
                // CONCEPT 5: MESSAGES ARRAY
                // System prompt + full conversation history
                // Order matters: system first, then history
                messages: [SYSTEM_PROMPT, ...conversationHistory],
            });
        });

        const assistantMessage = response.choices[0].message.content;
        
        // Store assistant response in history for context
        conversationHistory.push({ role: "assistant", content: assistantMessage });

        // Track token usage
        const usage = trackTokenUsage(response.usage);

        res.json({ 
            response: assistantMessage,
            usage: response.usage,
            sessionUsage: usage,
            historyLength: conversationHistory.length,
            rateLimit: {
                remaining: rateCheck.remaining,
                resetIn: rateCheck.resetIn
            }
        });
    } catch (error) {
        console.error("Error:", error);
        
        // CONCEPT 10: BETTER ERROR HANDLING
        // Return meaningful error messages to help debugging
        if (error.status === 401) {
            res.status(401).json({ error: "Invalid API key. Check your GROQ_API_KEY." });
        } else if (error.status === 429) {
            res.status(429).json({ error: "Rate limit exceeded. Please wait and try again." });
        } else if (error.status === 400) {
            res.status(400).json({ error: "Bad request. Check your message format." });
        } else {
            res.status(500).json({ error: "Internal server error", details: error.message });
        }
    }
});

// ============================================
// CONCEPT 6: STREAMING RESPONSE
// ============================================
// Instead of waiting for full response, get it word-by-word
// This is how ChatGPT shows text appearing gradually
// Uses SSE (Server-Sent Events) protocol
app.post("/api/chat/stream", async (req, res) => {
    const { message } = req.body;
    const clientId = req.ip || "unknown";

    if (!message) {
        return res.status(400).json({ error: "message is required" });
    }

    // Check rate limit
    const rateCheck = checkRateLimit(clientId);
    if (!rateCheck.allowed) {
        return res.status(429).json({ 
            error: "Rate limit exceeded",
            retryAfter: rateCheck.resetIn
        });
    }

    // Set headers for SSE (Server-Sent Events)
    // These headers tell the browser to expect streaming data
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const stream = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [SYSTEM_PROMPT, { role: "user", content: message }],
            stream: true,  // Enable streaming mode
            max_tokens: 1024,
            temperature: 0.7,
        });

        // Process each chunk as it arrives
        for await (const chunk of stream) {
            // Extract the content from the chunk
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                // Send in SSE format: "data: {json}\n\n"
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        
        // Signal that streaming is complete
        res.write("data: [DONE]\n\n");
        res.end();
    } catch (error) {
        console.error("Error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

// ============================================
// UTILITY ENDPOINTS
// ============================================

// Clear conversation history (start new chat)
app.post("/api/chat/clear", (req, res) => {
    conversationHistory.length = 0;
    res.json({ message: "Conversation cleared", historyLength: 0 });
});

// Get current usage statistics
app.get("/api/usage", (req, res) => {
    res.json({
        tokens: totalTokensUsed,
        history: {
            messageCount: conversationHistory.length,
            estimatedTokens: JSON.stringify(conversationHistory).length / 4
        },
        rateLimit: RATE_LIMIT
    });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        model: "llama-3.3-70b-versatile"
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`
Available endpoints:
  POST /api/chat        - Send a message (with history)
  POST /api/chat/stream - Send a message (streaming response)
  POST /api/chat/clear  - Clear conversation history
  GET  /api/usage       - Get token usage statistics
  GET  /api/health      - Health check
    `);
});
