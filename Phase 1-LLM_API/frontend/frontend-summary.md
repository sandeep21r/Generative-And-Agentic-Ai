
## `frontend-summary.md`

```md
# Frontend Summary — Phase 1

In this phase, the frontend was built using **React**.

The frontend is responsible for:
- showing the chat UI
- taking user input
- sending messages to the backend
- receiving streamed responses
- updating the UI live
- formatting assistant output

---

## Main Frontend Concepts Learned

### 1. Component-Based Structure
The frontend was divided into reusable components:

- `Header`
- `ModelSelect`
- `ChatArea`
- `Message`
- `ChatInput`

Purpose:
- keep code organized
- separate responsibilities
- make UI easier to maintain

---

### 2. State Management with `useState`
Used React state to manage:

- dark mode
- selected model
- chat messages
- loading state
- input text

Purpose:
- keep UI reactive
- rerender when data changes

---

### 3. `useEffect`
Used `useEffect` for:
- fetching available models on page load
- auto-scrolling to the latest message

Purpose:
- run side effects at the correct time
- keep UI behavior automatic

---

### 4. Model Fetching
On first load, the frontend requests available models from the backend.

Purpose:
- populate the model selector
- keep model options dynamic

---

### 5. Sending Messages
When the user sends a message:
- user message is added to state
- empty assistant placeholder is added
- request is sent to backend

Purpose:
- show user message immediately
- prepare UI for streaming reply

---

### 6. Assistant Placeholder
Before the real response arrives, an empty assistant message is inserted.

Purpose:
- create a target message bubble
- update this bubble live while streaming

---

### 7. Streaming Response Handling
The frontend reads streamed response chunks from the backend using:

- `response.body.getReader()`
- `TextDecoder`

Purpose:
- process chunks as they arrive
- append text gradually
- create the typing effect

---

### 8. Updating Assistant Message Live
Each streamed chunk is appended to accumulated text, and the last assistant message is updated repeatedly.

Purpose:
- show the AI response progressively
- simulate real-time response generation

---

### 9. Markdown Rendering
Used `react-markdown` to render assistant responses.

Purpose:
- format headings, lists, bold text, and code blocks properly
- avoid showing raw markdown characters

---

### 10. Message Styling
Used separate message alignment and bubble styles for:

- user messages
- assistant messages

Purpose:
- make the chat easier to read
- visually separate sender and receiver

---

### 11. Long Text Handling
Used CSS properties such as:
- `white-space: pre-wrap`
- `overflow-wrap: anywhere`
- `word-break: break-word`

Purpose:
- keep long text inside the message bubble
- handle tokens, URLs, and code safely

---

### 12. Theme Toggle
Implemented dark/light mode using state and conditional class names.

Purpose:
- improve UI experience
- learn theme-based styling

---

### 13. Clear Chat
Added a clear chat feature to reset conversation state.

Purpose:
- let user start a fresh chat easily

---

### 14. Auto-Scroll
Used a bottom reference element and `scrollIntoView()`.

Purpose:
- keep latest message visible
- follow streaming output automatically

---

### 15. Auto-Growing Input Box
The textarea was adjusted to grow with content instead of showing an internal scrollbar.

Purpose:
- improve typing experience
- make longer prompts easier to write

---

## Frontend UI Flow

```mermaid
flowchart TD
    A[User types in ChatInput] --> B[Click Send]
    B --> C[App handleSendMessage runs]
    C --> D[User message added to state]
    C --> E[Empty assistant placeholder added]
    C --> F[Send request to backend]
    F --> G[Read stream from response]
    G --> H[Append incoming chunk]
    H --> I[Update last assistant message]
    I --> J[React rerenders ChatArea]
    J --> K[User sees message streaming]