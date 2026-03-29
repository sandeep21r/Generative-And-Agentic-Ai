# Backend Summary — Phase 1

In this phase, the backend was built using **Node.js** and **Express** and connected to the **Groq API**.

The backend is responsible for:
- receiving the user message
- selecting the model
- sending the request to the LLM
- streaming the response back to the frontend
- handling validation, rate limits, and errors

---

## Main Backend Concepts Learned

### 1. Express Server
Used Express to create API endpoints for the chat application.

Example responsibilities:
- expose `/api/models`
- expose `/api/chat/stream`
- return JSON responses
- manage request/response flow

---

### 2. Environment Variables
Used `.env` to store the API key securely.

Why:
- do not expose API keys in frontend
- keep secrets outside source code

---

### 3. Groq API Integration
Used the Groq SDK to call an LLM model.

Purpose:
- send prompt/messages to the model
- receive AI-generated output

---

### 4. System Prompt
A system prompt was added to define how the AI should behave.

Purpose:
- make the assistant act like a coding assistant
- keep replies concise and practical
- control response style

---

### 5. Messages Array
The model expects data in message format:

- `system`
- `user`
- `assistant`

Purpose:
- structure the conversation properly
- provide role-based context to the model

---

### 6. Conversation History Concept
LLMs are stateless, so they do not automatically remember past conversation.

Purpose:
- previous messages must be sent again if we want continuity
- this is how chat memory is simulated

---

### 7. Streaming Response
Used `stream: true` so the backend receives the response chunk by chunk instead of waiting for the full answer.

Purpose:
- create a live typing effect
- improve user experience
- make the app feel more interactive

---

### 8. Server-Sent Events (SSE)
The backend sends each chunk to the frontend using SSE.

Important headers:
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

Purpose:
- keep the connection open
- send multiple response chunks over one request

---

### 9. Model Selection
The backend exposes available models through `/api/models`.

Purpose:
- let frontend fetch valid model options
- centralize allowed models in backend

---

### 10. Rate Limiting
A simple in-memory rate limiter was implemented using `Map`.

Purpose:
- prevent abuse
- reduce excessive API usage
- protect cost and server resources

---

### 11. Retry Logic
Retry logic was learned to handle temporary API failures.

Purpose:
- retry on rate limits or temporary server errors
- improve reliability

---

### 12. Token Budgeting
Tracked token usage to understand cost and request size.

Purpose:
- monitor usage
- avoid excessive cost
- understand how token-based billing works

---

### 13. Error Handling
Handled common backend/API errors such as:
- missing message
- invalid API key
- rate limit exceeded
- internal server error

Purpose:
- make debugging easier
- return meaningful error messages to frontend

---

## Backend Request Flow

```mermaid
flowchart TD
    A[Frontend sends message] --> B[Express receives request]
    B --> C[Validate request body]
    C --> D[Check rate limit]
    D --> E[Build messages array]
    E --> F[Call Groq API]
    F --> G[Receive streamed chunks]
    G --> H[Send chunks to frontend via SSE]
    H --> I[Send DONE signal]