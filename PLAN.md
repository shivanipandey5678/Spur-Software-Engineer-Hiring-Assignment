# 🚀 Spur AI Chat Agent — Complete Execution Plan

**Goal:** Build a top-tier AI support chatbot (backend first, then connect frontend).

**Order:** Backend → API → Frontend Integration

---

## 📋 Phase Overview

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Backend Foundation | 2-3h | Critical |
| 2 | Database Setup | 1h | Critical |
| 3 | LLM Integration | 2h | Critical |
| 4 | API Route | 1.5h | Critical |
| 5 | Server Setup | 30 min | Critical |
| 6 | Frontend Integration | 1h | Critical |
| 7 | Testing & Polish | 1h | High |
| 8 | README | 1h | Critical |
| 9 | Deployment | 1h | Critical |

**Total:** 10-12 hours

---

## 🏗 Project Structure

```
spur-ai-chat/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── db.ts
│   │   ├── dbInit.ts
│   │   ├── types.ts
│   │   ├── routes/
│   │   │   └── chat.ts
│   │   └── services/
│   │       ├── conversationService.ts
│   │       ├── llmService.ts
│   │       ├── queryRewriter.ts
│   │       └── faqService.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
├── frontend/          (your existing UI)
│   └── src/components/chat/
│       └── ChatWidget.tsx   ← connect here
└── README.md
```

---

# PART 1: BACKEND

---

## Phase 1: Backend Foundation (2-3 hours)

### Step 1.1: Initialize Backend

```bash
mkdir backend && cd backend
npm init -y
```

### Step 1.2: Install Dependencies

```bash
npm install express cors dotenv openai uuid better-sqlite3
npm install -D typescript ts-node-dev @types/node @types/express @types/better-sqlite3
```

### Step 1.3: TypeScript Config

Create `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
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

### Step 1.4: Package Scripts

In `backend/package.json` add:

```json
{
  "name": "spur-ai-chat-backend",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### Step 1.5: Environment Files

**backend/.env.example:**
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**backend/.env** (create locally, do not commit):
```
OPENAI_API_KEY=sk-proj-...
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 1.6: Backend .gitignore

**backend/.gitignore:**
```
node_modules/
.env
database.db
dist/
*.log
.DS_Store
```

---

## Phase 2: Database Setup (1 hour)

### Step 2.1: Types — `backend/src/types.ts`

```typescript
export type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
};

export type Conversation = {
  id: string;
  createdAt: number;
  summary?: string | null;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
```

### Step 2.2: DB Connection — `backend/src/db.ts`

```typescript
import Database from "better-sqlite3";

const db = new Database("database.db");
db.pragma("journal_mode = WAL");

export default db;
```

### Step 2.3: Init Tables — `backend/src/dbInit.ts`

```typescript
import db from "./db";

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    summary TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (conversationId) REFERENCES conversations(id)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversationId, timestamp)
`);

console.log("✅ Database initialized");
```

### Step 2.4: Conversation Service — `backend/src/services/conversationService.ts`

```typescript
import db from "../db";
import { v4 as uuid } from "uuid";
import type { Message, Conversation } from "../types";

export function createConversation(): string {
  const id = uuid();
  db.prepare("INSERT INTO conversations (id, createdAt, summary) VALUES (?, ?, NULL)").run(id, Date.now());
  return id;
}

export function getConversation(id: string): Conversation | undefined {
  return db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as Conversation | undefined;
}

export function saveMessage(conversationId: string, sender: "user" | "ai", text: string): void {
  db.prepare(
    "INSERT INTO messages (id, conversationId, sender, text, timestamp) VALUES (?, ?, ?, ?, ?)"
  ).run(uuid(), conversationId, sender, text, Date.now());
}

export function getMessages(conversationId: string): Message[] {
  return db.prepare(
    "SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC"
  ).all(conversationId) as Message[];
}

export function updateSummary(conversationId: string, summary: string): void {
  db.prepare("UPDATE conversations SET summary = ? WHERE id = ?").run(summary, conversationId);
}
```

---

## Phase 3: LLM Integration (2 hours)

### Step 3.1: LLM Service — `backend/src/services/llmService.ts`

```typescript
import OpenAI from "openai";
import type { ChatMessage } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

const SYSTEM_PROMPT = `You are Spur AI, a customer support agent for a small ecommerce store.

Personality: Very polite, friendly, concise, professional.

Rules:
- Determine user intent before answering.
- If question is clear, answer directly.
- If ambiguous, ask a short clarifying question.
- If unrelated to store, politely say you only help with store questions.
- End helpful answers with: "Is there anything else I can help you with?"

Store Info:
- Shipping: 5–7 days India, 7–14 days internationally
- Returns: 7-day return, items unused and in original packaging
- Refunds: Processed within 3 business days after inspection
- Support: Mon–Fri, 10am–6pm IST
- Payment: Cards, UPI, Net Banking, Wallets

Examples:

User: Do you ship to the USA?
Assistant: Yes, we ship to the USA. International delivery typically takes 7–14 days. Is there anything else I can help you with?

User: do u ship usa??
Assistant: Yes, we ship to the USA. International delivery typically takes 7–14 days. Is there anything else I can help you with?

User: I want to return
Assistant: Just to confirm, are you looking to return a recently purchased item? Please reply yes or no.

User: Who is the prime minister?
Assistant: I'm here to help with questions about our store and orders. Let me know if you need assistance with that.`;

export async function generateReply(history: ChatMessage[], userMessage: string): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;
    if (!reply) throw new Error("Empty response from LLM");
    return reply;
  } catch (error: any) {
    console.error("LLM Error:", error);
    if (error.code === "invalid_api_key") throw new Error("INVALID_API_KEY");
    if (error.code === "rate_limit_exceeded") throw new Error("RATE_LIMIT");
    if (error.code === "context_length_exceeded") throw new Error("CONTEXT_TOO_LONG");
    throw new Error("LLM_ERROR");
  }
}

export async function summarizeConversation(messages: string[]): Promise<string> {
  try {
    const text = messages.join("\n");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize this support conversation briefly (2-3 sentences)." },
        { role: "user", content: text },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });
    return response.choices[0].message.content || "Previous conversation about store inquiries.";
  } catch (error) {
    console.error("Summarization error:", error);
    return "Previous conversation about store inquiries.";
  }
}
```

### Step 3.2: Query Rewriter — `backend/src/services/queryRewriter.ts`

```typescript
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string });

export async function rewriteQuery(userMessage: string): Promise<string> {
  if (userMessage.length < 10) return userMessage;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Fix spelling and make the question clearer. Return ONLY the rewritten question. Do NOT change meaning.",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });
    return response.choices[0].message.content?.trim() || userMessage;
  } catch {
    return userMessage;
  }
}
```

### Step 3.3: FAQ Service — `backend/src/services/faqService.ts`

```typescript
type FAQEntry = { keywords: string[]; answer: string };

const FAQ_DATABASE: FAQEntry[] = [
  { keywords: ["ship", "shipping", "delivery", "deliver"], answer: "We ship within India in 5–7 business days and internationally in 7–14 business days. You will receive a tracking link once dispatched. Is there anything else I can help you with?" },
  { keywords: ["return", "returns"], answer: "We offer a 7-day return window from delivery. Items must be unused and in original packaging. Is there anything else I can help you with?" },
  { keywords: ["refund", "refunds", "money back"], answer: "Refunds are processed within 3 business days after inspection, credited to original payment method. Is there anything else I can help you with?" },
  { keywords: ["payment", "pay", "card", "upi"], answer: "We accept Credit/Debit cards, UPI, Net Banking, and digital wallets. Is there anything else I can help you with?" },
  { keywords: ["support hours", "contact", "working hours"], answer: "Our support hours are Monday–Friday, 10am–6pm IST. Is there anything else I can help you with?" },
  { keywords: ["about", "company", "who are you", "what is spur"], answer: "I am Spur Store's virtual support assistant. You can call +91-98765-43210 (Mon–Fri, 10 AM–6 PM IST) or email support@spurstore.com. Is there anything else I can help you with?" },
];

export function quickFAQMatch(message: string): string | null {
  const lower = message.toLowerCase();
  if (message.length > 100) return null;

  for (const faq of FAQ_DATABASE) {
    const hasMatch = faq.keywords.some(k => lower.includes(k));
    if (hasMatch && (lower.includes("?") || lower.split(" ").length < 10)) return faq.answer;
  }
  return null;
}
```

---

## Phase 4: API Route (1.5 hours)

### Step 4.1: Chat Route — `backend/src/routes/chat.ts`

```typescript
import { Router, Request, Response } from "express";
import {
  createConversation,
  getConversation,
  saveMessage,
  getMessages,
  updateSummary,
} from "../services/conversationService";
import { generateReply, summarizeConversation } from "../services/llmService";
import { rewriteQuery } from "../services/queryRewriter";
import { quickFAQMatch } from "../services/faqService";
import type { ChatMessage } from "../types";

const router = Router();

router.post("/message", async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body as { message: string; sessionId?: string };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({
        reply: "Your message is too long. Please keep it under 1000 characters.",
        sessionId: sessionId || "",
      });
    }

    let convId = sessionId;
    if (!convId || !getConversation(convId)) convId = createConversation();

    saveMessage(convId, "user", trimmed);

    const faqAnswer = quickFAQMatch(trimmed);
    if (faqAnswer) {
      saveMessage(convId, "ai", faqAnswer);
      return res.json({ reply: faqAnswer, sessionId: convId });
    }

    const cleanedMessage = await rewriteQuery(trimmed);
    const allMessages = getMessages(convId);
    const conversation = getConversation(convId);
    const context: ChatMessage[] = [];

    if (conversation?.summary) {
      context.push({ role: "system", content: `Previous conversation summary: ${conversation.summary}` });
    }

    const SUMMARIZE_THRESHOLD = 10;
    const KEEP_RECENT = 8;

    if (allMessages.length > SUMMARIZE_THRESHOLD && !conversation?.summary) {
      const toSummarize = allMessages.slice(0, allMessages.length - KEEP_RECENT).map(m => `${m.sender}: ${m.text}`);
      const summary = await summarizeConversation(toSummarize);
      updateSummary(convId, summary);
      context.push({ role: "system", content: `Previous conversation summary: ${summary}` });
    }

    const recent = allMessages.slice(-KEEP_RECENT);
    recent.forEach(m => {
      context.push({ role: m.sender === "user" ? "user" : "assistant", content: m.text });
    });

    const reply = await generateReply(context, cleanedMessage);
    saveMessage(convId, "ai", reply);

    return res.json({ reply, sessionId: convId });
  } catch (error: any) {
    console.error("Chat error:", error);
    const messages: Record<string, string> = {
      INVALID_API_KEY: "Configuration error. Please contact support.",
      RATE_LIMIT: "High demand. Please try again in a moment.",
      CONTEXT_TOO_LONG: "Conversation too long. Please start a new chat.",
      LLM_ERROR: "Sorry, I'm having trouble. Please try again.",
    };
    const friendly = messages[error.message] || "Something went wrong. Please try again.";
    return res.status(500).json({ reply: friendly, sessionId: req.body.sessionId || "" });
  }
});

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

export default router;
```

---

## Phase 5: Server Setup (30 min)

### Step 5.1: Main Server — `backend/src/server.ts`

```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./dbInit";
import chatRoutes from "./routes/chat";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
}));
app.use(express.json({ limit: "10kb" }));

app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Spur AI Chat API", status: "running" });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err: any, req: express.Request, res: express.Response) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### Test Backend

```bash
cd backend
npm run dev
```

```bash
curl http://localhost:3001/chat/health
curl -X POST http://localhost:3001/chat/message -H "Content-Type: application/json" -d '{"message":"Do you ship to USA?"}'
```

---

# PART 2: FRONTEND INTEGRATION

---

## Phase 6: Connect Frontend to Backend (1 hour)

### Step 6.1: Environment Variable

Create **frontend/.env**:

```
VITE_API_URL=http://localhost:3001
```

Restart frontend dev server after adding.

### Step 6.2: Update ChatWidget — Replace `handleSend` and add state

In your `ChatWidget.tsx`, make these changes:

**1. Add at top (after imports):**
```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
```

**2. Add state:**
```typescript
const [sessionId, setSessionId] = useState<string>("");
const [error, setError] = useState<string | null>(null);
```

**3. Load session on mount:**
```typescript
useEffect(() => {
  const stored = localStorage.getItem("spurSessionId");
  if (stored) setSessionId(stored);
}, []);
```

**4. Replace entire `handleSend` function with:**
```typescript
const handleSend = async (content: string) => {
  setError(null);

  const userMessage: Message = {
    id: Date.now().toString(),
    content,
    isUser: true,
    timestamp: formatTime(new Date()),
  };
  setMessages((prev) => [...prev, userMessage]);
  setIsSending(true);
  setIsTyping(true);

  try {
    const response = await fetch(`${API_URL}/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, sessionId: sessionId || undefined }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.sessionId && data.sessionId !== sessionId) {
      setSessionId(data.sessionId);
      localStorage.setItem("spurSessionId", data.sessionId);
    }

    setIsTyping(false);
    await streamResponse(data.reply);

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      content: data.reply,
      isUser: false,
      timestamp: formatTime(new Date()),
    };
    setStreamingContent(null);
    setMessages((prev) => [...prev, aiResponse]);
  } catch (err) {
    console.error("Error:", err);
    setIsTyping(false);
    setStreamingContent(null);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "Sorry, I couldn't process your message. Please check your connection and try again.",
      isUser: false,
      timestamp: formatTime(new Date()),
    };
    setMessages((prev) => [...prev, errorMessage]);
    setError("Failed to connect. Please try again.");
  } finally {
    setIsSending(false);
  }
};
```

**5. Optional — New Chat button in header:**
```typescript
const handleNewChat = () => {
  localStorage.removeItem("spurSessionId");
  setSessionId("");
  setMessages(initialMessages);
  setError(null);
};
```

Add in header (next to title):
```tsx
{sessionId && (
  <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-xs">
    New Chat
  </Button>
)}
```

**6. Optional — Error banner below header:**
```tsx
{error && (
  <div className="mt-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-md">
    <p className="text-xs text-destructive">{error}</p>
  </div>
)}
```

### Step 6.3: CORS

Backend already has `cors()`. For production, set `FRONTEND_URL` in backend `.env` to your Vercel URL.

### Step 6.4: Test Full Flow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Open app, send: "Do you ship to USA?"
4. You should get real AI reply and session persisted.

### ✅ Checkpoint 6

- [ ] Frontend connects to backend
- [ ] Messages send successfully
- [ ] SessionId persists in localStorage
- [ ] New Chat button works
- [ ] Error handling works

---

## Phase 7: Testing & Polish (1 hour)

### Test Cases

**Basic:**
- [ ] Send question → get answer
- [ ] Refresh page → conversation persists
- [ ] New chat → messages clear
- [ ] Multiple messages work

**Edge cases:**
- [ ] Empty message → validation error
- [ ] Message > 1000 chars → friendly error
- [ ] Invalid sessionId → new session created

**AI:**
- [ ] "Do you ship to USA?" → correct answer
- [ ] "do u ship usa??" → still works (query rewriter)
- [ ] Unrelated question → polite refusal

**Errors:**
- [ ] Backend down → friendly message in UI
- [ ] Wrong API key → clean error

### ✅ Checkpoint 7

- [ ] All above pass
- [ ] No console errors
- [ ] UI smooth

---

## Phase 8: README (1 hour)

### README.md must include

1. **Quick Start** — clone, install backend + frontend, env vars, run commands
2. **Environment Variables** — `OPENAI_API_KEY`, `PORT`, `VITE_API_URL`, `FRONTEND_URL`
3. **Architecture** — backend layers (routes / services / db), frontend flow
4. **LLM** — provider (OpenAI), model, prompting (system prompt, few-shot), cost control
5. **Trade-offs** — e.g. SQLite vs Postgres, in-memory rate limit, no auth
6. **If I had more time** — e.g. Postgres, Redis, auth, streaming, admin FAQ
7. **Deployment** — Backend (Render), Frontend (Vercel), URLs

### ✅ Checkpoint 8

- [ ] README complete
- [ ] Setup steps clear
- [ ] Trade-offs documented

---

## Phase 9: Deployment (1 hour)

### Backend (Render)

1. New Web Service → connect GitHub repo
2. Root: `backend` (if backend is in subfolder) or leave blank
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Env: `OPENAI_API_KEY`, `FRONTEND_URL` (your Vercel URL)
6. Deploy

### Frontend (Vercel)

1. Import project from GitHub
2. Env: `VITE_API_URL=https://your-app.onrender.com`
3. Deploy

### After deploy

- [ ] Backend health: `https://your-app.onrender.com/chat/health`
- [ ] Frontend loads, chat works
- [ ] No CORS errors
- [ ] Put both URLs in README

### ✅ Checkpoint 9

- [ ] Backend live
- [ ] Frontend live
- [ ] End-to-end works

---

## ✅ Final Checklist

**Code**
- [ ] Backend runs: `npm run dev` in backend
- [ ] Health: `curl http://localhost:3001/chat/health`
- [ ] Chat: `curl -X POST .../chat/message -d '{"message":"Hi"}'`
- [ ] Frontend `.env` has `VITE_API_URL=http://localhost:3001`
- [ ] ChatWidget uses `API_URL` and `sessionId`
- [ ] New Chat clears session and messages
- [ ] Errors show in UI, no crash
- [ ] No secrets in repo, `.env` in `.gitignore`

**Submission**
- [ ] GitHub repo public
- [ ] README has run instructions, env vars, architecture, trade-offs
- [ ] Deployed backend + frontend URLs in README
- [ ] Form submitted

---

## 🚀 Deploy (quick ref)

- **Backend (Render):** build `npm install && npm run build`, start `npm start`, env `OPENAI_API_KEY`, `FRONTEND_URL`
- **Frontend (Vercel):** env `VITE_API_URL=https://your-backend.onrender.com`

---

## 💡 Order of work

**Backend first → Frontend integration → Test → README → Deploy → Submit**

1. Phases 1–5: Build backend  
2. Phase 6: Connect frontend  
3. Phase 7: Testing  
4. Phase 8: README  
5. Phase 9: Deployment  
6. Final checklist → Submit
