# Step-by-Step Guide — Spur AI Chat (Backend First)

Follow this in order. Do one step, check it works, then move to the next.

---

## PART 1: BACKEND

---

### STEP 1 — Create backend folder and init npm

**What you do:** Create the backend folder and turn it into a Node project.

**Commands (run in your project root):**
```bash
mkdir backend
cd backend
npm init -y
```

**Why:** `npm init -y` creates `package.json` so you can install packages.

**Check:** You should see `backend/package.json` created.

---

### STEP 2 — Install dependencies

**What you do:** Install Express, TypeScript, OpenAI, SQLite, etc.

**Command (inside `backend/`):**
```bash
npm install express cors dotenv openai uuid better-sqlite3
npm install -D typescript ts-node-dev @types/node @types/express @types/better-sqlite3
```

**Why:** Express = server, openai = LLM, better-sqlite3 = database, typescript = type checking.

**Check:** `backend/node_modules/` folder should exist.

---

### STEP 3 — Add TypeScript config

**What you do:** Tell TypeScript how to compile and where to put output.

**Create file:** `backend/tsconfig.json`

**Paste this:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "modulejs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Why:** So `npm run build` works and all your code lives under `src/`.

**Check:** File exists; no syntax error when you open it.

---

### STEP 4 — Update package.json scripts

**What you do:** Add dev, build, and start scripts.

**Open:** `backend/package.json`

**Add or replace so you have:**
```json
{
  "name": "spur-ai-chat-backend",
  "version": "1.0.0",
  "type": "modulejs",
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

**Why:** `npm run dev` = run server with auto-reload; `npm run build` = compile; `npm start` = run compiled code.

**Check:** Run `npm run dev` — it will fail until we add `src/server.ts`; that is expected for now.

---

### STEP 5 — Create environment files

**What you do:** Set up env vars without committing secrets.

**Create file:** `backend/.env.example`  
**Content:**
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Create file:** `backend/.env` (do not commit this)  
**Content:** Same as above, but put your real OpenAI key in place of `your_openai_api_key_here`.

**Why:** Server and OpenAI client need `OPENAI_API_KEY`; we use `.env.example` as a template.

**Check:** Both files exist; `.env` has your real key.

---

### STEP 6 — Create backend .gitignore

**What you do:** Keep secrets and build artifacts out of Git.

**Create file:** `backend/.gitignore`  
**Content:**
```
node_modules/
.env
database.db
dist/
*.log
.DS_Store
```

**Why:** So you never commit `node_modules`, `.env`, or `database.db`.

**Check:** File exists.

---

### STEP 7 — Create types

**What you do:** Define TypeScript types for messages and conversations.

**Create folder:** `backend/src/`  
**Create file:** `backend/src/types.ts`  
**Paste:** (from PLAN.md Phase 2, Step 2.1 — the full `Message`, `Conversation`, `ChatMessage` types)

**Why:** So the rest of the code has clear types and fewer bugs.

**Check:** No red underlines in the file.

---

### STEP 8 — Create database connection

**What you do:** Connect to SQLite and enable WAL.

**Create file:** `backend/src/db.ts`  
**Paste:** (from PLAN.md Phase 2, Step 2.2 — Database import, `database.db`, pragma, export)

**Why:** One place that creates/uses the SQLite file.

**Check:** File exists; imports are valid.

---

### STEP 9 — Create database tables

**What you do:** Create `conversations` and `messages` tables on startup.

**Create file:** `backend/src/dbInit.ts`  
**Paste:** (from PLAN.md Phase 2, Step 2.3 — all `db.exec(...)` for CREATE TABLE and CREATE INDEX)

**Why:** So every time the server starts, tables exist.

**Check:** File exists; it imports `./db`.

---

### STEP 10 — Create conversation service

**What you do:** Add functions to create conversation, save message, get messages, update summary.

**Create folder:** `backend/src/services/`  
**Create file:** `backend/src/services/conversationService.ts`  
**Paste:** (from PLAN.md Phase 2, Step 2.4 — createConversation, getConversation, saveMessage, getMessages, updateSummary)

**Why:** All DB access for conversations and messages goes through this file.

**Check:** No TypeScript errors; imports from `../db` and `../types` resolve.

---

### STEP 11 — Create LLM service

**What you do:** Call OpenAI for chat reply and for summarization.

**Create file:** `backend/src/services/llmService.ts`  
**Paste:** (from PLAN.md Phase 3, Step 3.1 — full `llmService.ts` with SYSTEM_PROMPT, generateReply, summarizeConversation)

**Why:** All OpenAI usage in one place; easy to change model or prompt later.

**Check:** `OPENAI_API_KEY` is used from env; no hardcoded key.

---

### STEP 12 — Create query rewriter

**What you do:** Fix typos and clarify the user message before sending to the main LLM.

**Create file:** `backend/src/services/queryRewriter.ts`  
**Paste:** (from PLAN.md Phase 3, Step 3.2 — rewriteQuery using OpenAI)

**Why:** Improves answers when the user types things like "do u ship usa??".

**Check:** File exists; imports OpenAI.

---

### STEP 13 — Create FAQ service

**What you do:** Quick answers for common questions without calling the LLM.

**Create file:** `backend/src/services/faqService.ts`  
**Paste:** (from PLAN.md Phase 3, Step 3.3 — FAQ_DATABASE and quickFAQMatch)

**Why:** Faster and cheaper for simple questions (shipping, returns, etc.).

**Check:** File exports `quickFAQMatch`.

---

### STEP 14 — Create chat route

**What you do:** Implement `POST /chat/message`: validate input, save message, FAQ or LLM, return reply.

**Create folder:** `backend/src/routes/`  
**Create file:** `backend/src/routes/chat.ts`  
**Paste:** (from PLAN.md Phase 4, Step 4.1 — full router with validation, sessionId, FAQ, rewrite, context, generateReply, error handling)

**Why:** This is the main API the frontend will call.

**Check:** No missing imports; all services are imported.

---

### STEP 15 — Create server entry point

**What you do:** Start Express, load env, run dbInit, mount routes, CORS, 404 and error handler.

**Create file:** `backend/src/server.ts`  
**Paste:** (from PLAN.md Phase 5, Step 5.1 — express, cors, dotenv, dbInit, chat routes, get("/"), 404, error handler, listen)

**Why:** Single entry point; `npm run dev` runs this file.

**Check:** File imports `./dbInit` and `./routes/chat`.

---

### STEP 16 — Run and test backend

**What you do:** Start the server and hit the health and chat endpoints.

**Commands:**
```bash
cd backend
npm run dev
```

Leave this running. In a **new terminal**:
```bash
curl http://localhost:3001/chat/health
curl -X POST http://localhost:3001/chat/message -H "Content-Type: application/json" -d "{\"message\":\"Do you ship to USA?\"}"
```

**Why:** Confirms server runs, DB and OpenAI work, and you get a JSON reply.

**Check:** Health returns `{"status":"ok",...}`; message returns `{"reply":"...", "sessionId":"..."}`.

---

## PART 2: FRONTEND INTEGRATION

---

### STEP 17 — Add frontend env variable

**What you do:** Tell the frontend where the backend API is.

**Create file:** `frontend/.env` (or in your React app root if different)  
**Content:**
```
VITE_API_URL=http://localhost:3001
```

**Why:** Frontend will call this URL for `POST /chat/message`.

**Check:** Restart frontend dev server after adding; variable is used as `import.meta.env.VITE_API_URL`.

---

### STEP 18 — Connect ChatWidget to API

**What you do:** Replace mock send with real API call and add sessionId and error state.

**In your ChatWidget component:**

1. Add: `const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";`
2. Add state: `sessionId`, `error`.
3. On mount: read `localStorage.getItem("spurSessionId")` and set `sessionId`.
4. In `handleSend`: call `fetch(\`${API_URL}/chat/message\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: content, sessionId: sessionId || undefined }) })`, then parse JSON, save `sessionId` to state and localStorage, and add the reply to messages. On failure, set error and show a friendly message.
5. Optional: "New Chat" button that clears `sessionId` from localStorage and state and resets messages.

**Why:** So the UI talks to your backend and keeps the same conversation across reloads.

**Check:** Backend running; send a message in the UI; reply appears; refresh and send again; same session (same conversation).

---

### STEP 19 — Test full flow

**What you do:** Manually test main cases.

- Send: "Do you ship to USA?" → get shipping answer.
- Send: "do u ship usa??" → still get a good answer.
- Send: "What is Python?" → get a polite refusal.
- Refresh page and send another message → same conversation (same sessionId).
- Click "New Chat" (if added) → new conversation.

**Why:** Ensures backend + frontend work together before deployment.

**Check:** All of the above behave as expected.

---

## PART 3: README AND DEPLOYMENT

---

### STEP 20 — Update README

**What you do:** Document how to run backend and frontend, env vars, and deployment.

**Sections to include:**  
Quick Start (clone, install backend, install frontend, env vars, run backend, run frontend), Environment Variables (backend and frontend), Project structure, Architecture (optional), Deployment (Render + Vercel), Trade-offs / If I had more time (optional).

**Why:** Assignment and reviewers need clear run instructions.

**Check:** Someone else could clone and run using only the README.

---

### STEP 21 — Deploy backend (e.g. Render)

**What you do:** Push code to GitHub; create a Web Service on Render; connect repo; set root to `backend` if needed; build = `npm install && npm run build`; start = `npm start`; add env vars (e.g. `OPENAI_API_KEY`, `FRONTEND_URL`); deploy.

**Why:** So the API is available at a public URL for the frontend.

**Check:** `https://your-app.onrender.com/chat/health` returns OK.

---

### STEP 22 — Deploy frontend (e.g. Vercel)

**What you do:** Connect repo to Vercel; set env `VITE_API_URL` to your Render backend URL; deploy.

**Why:** So the chat UI is live and uses the deployed API.

**Check:** Open the Vercel URL; chat works; no CORS errors.

---

### STEP 23 — Put URLs in README and submit

**What you do:** Add "Live app: …" and "API: …" (or similar) to the README; submit the repo and form as per assignment.

**Why:** Reviewers need to open the live app and optionally run it locally.

---

## Order summary

1. Steps 1–6: Backend setup (folder, deps, tsconfig, scripts, env, .gitignore).  
2. Steps 7–10: Database (types, db, dbInit, conversationService).  
3. Steps 11–13: LLM and helpers (llmService, queryRewriter, faqService).  
4. Steps 14–15: API and server (chat route, server.ts).  
5. Step 16: Run and test backend.  
6. Steps 17–19: Frontend env, connect ChatWidget, test full flow.  
7. Steps 20–23: README, deploy backend, deploy frontend, submit.

Do one step at a time; if something fails, fix it before moving on. Use PLAN.md for full code snippets where it says "Paste from PLAN.md".
