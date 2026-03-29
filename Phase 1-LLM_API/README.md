# Phase 1 — LLM API Integration

In this phase, I learned how to build a basic AI chat application using an existing LLM API instead of training my own model.

This phase focused on:
- calling an LLM API from the backend
- sending prompts and messages
- using a system prompt
- handling streaming responses
- building a frontend chat UI
- showing streamed responses in real time
- rendering markdown responses
- handling rate limiting and errors

---

## Project

**Project Name:** LLM Chat App

This project is a simple chat application where:
- the frontend sends the user message to the backend
- the backend calls the Groq API
- the response is streamed back chunk by chunk
- the frontend shows the response live like ChatGPT

---

## Folder Structure

```text
phase-01-llm-api/
├── README.md
├── backend-summary.md
├── frontend-summary.md
└── llm-chat-app/


flowchart TD
    A[User types message in ChatInput] --> B[App.jsx handleSendMessage]
    B --> C[User message added to messages state]
    B --> D[Empty assistant placeholder added]
    B --> E[Frontend sends POST request to backend]
    E --> F[Express backend receives message]
    F --> G[Backend calls Groq API with stream true]
    G --> H[Groq returns response chunks]
    H --> I[Backend forwards chunks using SSE]
    I --> J[Frontend reads chunks using reader]
    J --> K[Chunks appended to assistant message]
    K --> L[React rerenders chat UI]
    L --> M[User sees streaming response]