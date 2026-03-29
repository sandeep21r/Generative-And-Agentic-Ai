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