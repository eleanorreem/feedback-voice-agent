# Voice Reflective Journal

A trauma-informed voice journaling tool built by [Chayn](https://www.chayn.co). Users have a short voice conversation with an AI companion that asks reflective questions, then receive a structured summary of what they shared.

## Architecture

```
frontend/          Next.js web app (auth, dashboard, voice UI, summary review)
agent/             Python voice agent (LiveKit + OpenAI Realtime API)
database/          PostgreSQL schema and migrations
docker-compose.yml Local PostgreSQL instance
```

**How it works:**

1. User logs in and starts a voice session
2. The frontend connects to a LiveKit room and dispatches the Python agent
3. The agent asks 3 reflective questions via real-time voice (OpenAI Realtime API)
4. After the conversation, the agent generates a structured summary and saves it to PostgreSQL
5. The frontend polls for the summary and displays it for review

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Shadcn/ui |
| Voice Agent | Python 3.13+, LiveKit Agents, OpenAI Realtime API |
| Database | PostgreSQL 16 |
| Auth | Email/password with bcrypt + JWT |
| Voice Transport | LiveKit Cloud |

## Prerequisites

- **Node.js** 22+ and **pnpm**
- **Python** 3.13+
- **Docker** (for PostgreSQL)
- A [LiveKit Cloud](https://cloud.livekit.io) account (API key + secret)
- An [OpenAI](https://platform.openai.com) API key

## Getting Started

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5433 and runs the initial schema migration.

### 2. Set up the frontend

```bash
cd frontend
cp .env.example .env.local    # then fill in your credentials
pnpm install
pnpm dev
```

Open http://localhost:3000.

### 3. Set up the voice agent

```bash
cd agent
cp .env.example .env.local    # then fill in your credentials
python -m venv .venv
source .venv/bin/activate
pip install -e .
python agent.py dev
```

### Environment Variables

Both `frontend/.env.example` and `agent/.env.example` contain templates with all required variables. Copy each to `.env.local` and fill in your values.

**Frontend** (`frontend/.env.local`):
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` - LiveKit Cloud credentials
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing session tokens (min 32 chars)

**Agent** (`agent/.env.local`):
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` - Same LiveKit credentials
- `OPENAI_API_KEY` - OpenAI API key (needs access to `gpt-realtime-mini` and `gpt-4.1-mini`)
- `DATABASE_URL` - Same PostgreSQL connection string

## Project Structure

```
feedback-voice-agent/
├── .github/workflows/     CI (lint, build, syntax checks)
├── agent/
│   ├── agent.py           Main voice agent
│   ├── db.py              Database queries (asyncpg)
│   ├── prompts.py         System prompts and question bank
│   ├── session_manager.py Session state machine
│   └── .env.example
├── database/
│   └── migrations/        SQL schema
├── frontend/
│   ├── app/               Next.js routes and API endpoints
│   ├── components/        UI components (Shadcn + custom)
│   ├── lib/               Auth, database, utilities
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## License

[MIT](./LICENSE)
