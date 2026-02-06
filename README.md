# Spur-Software-Engineer-Hiring-Assignment

AI-powered customer support chat agent for Spur — built with Node.js, TypeScript, and OpenAI.

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Add your OPENAI_API_KEY
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Add .env with VITE_API_URL=http://localhost:3001
npm run dev
```

### Environment Variables
- **Backend:** `OPENAI_API_KEY`, `PORT`, `FRONTEND_URL`
- **Frontend:** `VITE_API_URL`

### API testing
- Tested via **curl** — chat endpoint replies are working.

## Project Structure
- `backend/` — Express API, SQLite, OpenAI integration
- `frontend/` — React chat UI
- `PLAN.md` — Full build & integration plan

## License
MIT
