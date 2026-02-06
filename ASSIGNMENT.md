# Spur – Assignment Requirements Checklist

**Deadline:** 31st December 2025

---

## Core Requirements

### Chat UI
- [ ] Scrollable message list
- [ ] User vs AI message distinction
- [ ] Input + send, Enter sends
- [ ] Auto-scroll to latest
- [ ] Disabled send while loading
- [ ] Optional: typing indicator

### Backend API
- [ ] `POST /chat/message` — body: `{ message, sessionId? }`, returns `{ reply, sessionId }`
- [ ] Persist every message (user + AI)
- [ ] Associate with session
- [ ] Call real LLM API

### LLM
- [ ] OpenAI/Claude, API key in env
- [ ] Service: `generateReply(history, userMessage)`
- [ ] Conversation history in context
- [ ] Handle errors, friendly message
- [ ] Cap tokens/messages (document)

### FAQ / Domain
- [ ] Shipping, return/refund, support hours in prompt or DB
- [ ] AI answers FAQs reliably

### Data
- [ ] `conversations` (id, createdAt, metadata)
- [ ] `messages` (id, conversationId, sender, text, timestamp)
- [ ] Fetch history by sessionId on reload

### Robustness
- [ ] No empty messages
- [ ] Handle long messages
- [ ] No crash on bad input
- [ ] LLM errors → clean UI message
- [ ] No secrets in repo

---

## Submission

- [ ] Public GitHub repo
- [ ] Run instructions (backend + frontend)
- [ ] DB setup
- [ ] Env vars documented
- [ ] README: architecture, LLM notes, trade-offs
- [ ] Deployed URL

---

## Build Order (from PLAN.md)

1. Backend (Phases 1–5)
2. Frontend integration (Phase 6)
3. Test → Deploy → README → Submit
