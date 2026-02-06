# Spur – AI Customer Support Chat Agent

AI-powered customer support chatbot for **Spur** (Spur Commerce Pvt Ltd) — built with Node.js, TypeScript, React, and OpenAI.

---

## How This Project Was Built

**I did not start coding first.** I spent time in **in-depth discussion with an LLM** (and in Chatgpt) on everything related to the assignment — requirements, edge cases, token/cost/memory, prompting, safeguards, and UX — so I could complete as many aspects as possible in one go. I then gave that full discussion to **Cursor**, which produced **PLAN.md** with my suggestions, brainstorm, step-by-step phases, and problem–solution notes. Where something was wrong, I took the LLM’s advice and refined the plan. The result is a **step-by-step markdown** that reflects my thinking and balance.

**For full context, build order, and my POV, please read [PLAN.md](./PLAN.md).**  
If anything in this README is unclear, reading **README + PLAN.md** together should make the picture complete.

Execution (backend + frontend) was done with **Cursor**, after checking and understanding the plan. I accept that this end-to-end flow — discussion (e.g. with ChatGPT), planning, and execution (with Cursor) — was done in roughly **6 hours**.

---

## Local setup & run

### Prerequisites
- **Node.js 18+**
- **OpenAI API key** (from platform.openai.com)

### Step 1: Clone & open project
```bash
git clone <repo-url>
cd Spur-Software-Engineer-Hiring-Assignment   # or your folder name
```

### Step 2: Backend setup & run
```bash
cd backend
npm install
cp .env.example .env
```
- Open **backend/.env** and set:
  - `OPENAI_API_KEY=sk-your-key`
  - `PORT=3001` (optional, default 3001)
  - `FRONTEND_URL=http://localhost:5173` (optional, for CORS)

```bash
npm run dev
```
- Backend runs at **http://localhost:3001**
- DB (SQLite) is created automatically on first run (`database.db` in `backend/`).

### Step 3: Frontend setup & run
Open a **new terminal**:
```bash
cd frontend
npm install
cp .env.example .env
```
- Open **frontend/.env** and set:
  - `VITE_API_URL=http://localhost:3001`

```bash
npm run dev
```
- Frontend runs at **http://localhost:5173**
- Open this URL in browser to use the chat.

### Summary (local)
| App      | Port | URL |
|----------|------|-----|
| Backend  | 3001 | http://localhost:3001 |
| Frontend | 5173 | http://localhost:5173 |

### Deployed (live)
| App      | URL |
|----------|-----|
| **Frontend** | **https://spur-frontend-livid.vercel.app/** |
| **Backend**  | **https://spur-software-engineer-hiring-assignment.onrender.com** |

For the deployed frontend, the backend API is set as:
- `VITE_API_URL=https://spur-software-engineer-hiring-assignment.onrender.com`

### Environment variables (reference)
| Where     | Variable        | Purpose |
|----------|------------------|--------|
| Backend  | `OPENAI_API_KEY` | OpenAI API key (required) |
| Backend  | `PORT`           | Server port (default 3001) |
| Backend  | `FRONTEND_URL`   | Frontend origin (for CORS in production) |
| Frontend | `VITE_API_URL`   | Backend API base URL. Local: `http://localhost:3001`. Production: `https://spur-software-engineer-hiring-assignment.onrender.com` |

---

## What I Focused On

### 1. Prompting (system prompt + few-shot)
- I considered **chain-of-thought (CoT)** but decided it wasn’t needed for this scope.
- I invested in a **strong system prompt** and **few-shot prompting** with many examples and concrete “stories” so the model stays context-rich and on-policy (shipping, returns, refunds, support hours, company info, etc.).
- The system prompt includes a **strict boundary**: the assistant only helps with Spur (orders, shipping, returns, payments, etc.). For anything else (math, general knowledge, other companies, etc.) it **politely declines** — e.g. “I’m the assistant for Spur; if you need something related to us I can help, else I can’t.” So **safeguards** are in place to avoid bypass and off-topic answers.

### 2. Token, cost, and memory
- To control **tokens, cost, and context length**, when the conversation has **too many messages**, an **agent summarizes** older messages and we keep only **recent turns** + summary in context.
- The **summarization prompt** explicitly asks **not to miss important details** (order ID, issue type, dates, decisions, what was promised or pending). So the summary is built with “nothing important lost” in mind.

### 3. Query handling (clarify vs direct answer)
- In the backend, if the **query is unclear**, we **enhance** it (e.g. spelling, clarity) and can ask a **short follow-up** so the agent can confirm it understood before answering.
- If the **query is clear**, we answer directly; no extra enhance step needed.

### 4. Company “story” for “about” questions
- I gave the **fake company** a clear story: founding year (2019), legal name (Spur Commerce Pvt Ltd), CEO (Rajesh Mehta), Co-founder (Priya Sharma), HQ address, support contact, etc.
- So when users ask “about the company”, “who founded Spur”, “support hours”, the model has consistent, context-rich answers.

### 5. Persistence and DB
- Conversations and messages are **persistent**. I used **SQLite** (via `better-sqlite3`) — lightweight and easy to run locally, without the weight of a full RDBMS. Schema: `conversations` (id, createdAt, summary), `messages` (id, conversationId, sender, text, timestamp). History is fetched by `sessionId` on reload.

### 6. UX and demo
- **Streaming** replies in the frontend so the response doesn’t appear in one big chunk.
- **Suggestion pills** (built-in questions) above the input so the **demo runs smoothly** and users can try common queries with one tap.
- Typing indicator, scroll-to-bottom, and basic error handling for a clean experience.

### 7. Why OpenAI
- **OpenAI** is used for the LLM. Reasons: **compatibility** (switching to another provider often needs only base URL + API key change), and I found the **OpenAI models accurate** for this use case. The code is structured so that swapping provider is straightforward.

---

## Project Structure

```
├── backend/          # Express API, SQLite, OpenAI
│   ├── src/
│   │   ├── server.ts
│   │   ├── db.ts, dbInit.ts, types.ts
│   │   ├── routes/chat.ts
│   │   └── services/
│   │       ├── conversationService.ts
│   │       ├── llmService.ts      # system prompt, few-shot, summarization
│   │       ├── queryRewriter.ts   # enhance unclear queries
│   │       └── faqService.ts     # quick FAQ match
│   └── .env.example, package.json, tsconfig.json
├── frontend/         # Vite + React + TypeScript
│   └── src/
│       ├── App.tsx   # chat UI, pills, streaming, history
│       ├── main.tsx, index.css
│       └── .env.example
├── PLAN.md           # Full execution plan, phases, and my reasoning (read this)
├── ASSIGNMENT.md     # Assignment checklist
├── STEP-BY-STEP-GUIDE.md
└── README.md         # This file
```

---

## Architecture (short)

- **Backend:** REST API; every user message is validated (non-empty, length cap), then either served from **FAQ** (keyword match) or sent through **query rewriter** (if needed) and **LLM** with conversation **history** (recent messages + optional summary of older ones). Replies are returned in one shot; the frontend does **client-side streaming** for display.
- **Frontend:** Single chat view; loads history by `sessionId` from localStorage and **GET /chat/history/:sessionId**; sends new messages via **POST /chat/message** and shows reply with streaming + typing indicator.

---

## Trade-offs

- **SQLite:** Simple and light for a single-server, assignment-sized app; for production at scale you’d consider Postgres and connection pooling.
- **No auth:** Sessions are identified only by `sessionId` (UUID); no login. Fine for a demo; real product would add auth.
- **Summarization:** Keeps context window and cost under control; in edge cases some nuance from very old messages might be compressed. The summarization prompt is tuned to preserve order IDs, dates, and decisions.
- **Streaming:** Implemented on the client (full response then animate); true server-side streaming would require a different API shape (e.g. SSE or WebSocket).

---

## If You Want More Detail

- **Phases, steps, and exact snippets:** [PLAN.md](./PLAN.md)  
- **Assignment requirements checklist:** [ASSIGNMENT.md](./ASSIGNMENT.md)  
- **Step-by-step guide:** [STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md)

---

## APIs (Backend)

Base URL (local): **http://localhost:3001**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root; returns `{ message, status }`. |
| GET | `/chat/health` | Health check. Returns `{ status: "ok", timestamp }`. |
| POST | `/chat/message` | Send a chat message; returns AI reply and session id. |
| GET | `/chat/history/:sessionId` | Get all messages for a session (for restoring chat on reload). |

### POST /chat/message
- **Body:** `{ "message": "user text", "sessionId": "optional-uuid" }`
- **Success (200):** `{ "reply": "AI response", "sessionId": "uuid" }`
- **Validation:** `message` required, non-empty string, max 1000 chars. Empty/long messages get 400 or a friendly reply in body.
- **Example (curl):**
  ```bash
  curl -X POST http://localhost:3001/chat/message \
    -H "Content-Type: application/json" \
    -d '{"message":"Do you ship to USA?"}'
  ```

### GET /chat/history/:sessionId
- **Params:** `sessionId` — conversation/session UUID (e.g. from previous POST response).
- **Success (200):** `{ "messages": [ { "id", "conversationId", "sender", "text", "timestamp" }, ... ] }`
- If session doesn’t exist: `{ "messages": [] }`.

### GET /chat/health
- **Success (200):** `{ "status": "ok", "timestamp": 1234567890 }`

---

## License

MIT
