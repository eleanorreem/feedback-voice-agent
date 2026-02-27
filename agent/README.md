# Voice Agent

The Python voice agent that powers the reflective journal conversations. Built with [LiveKit Agents](https://docs.livekit.io/agents) and the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime).

## What it does

1. Connects to a LiveKit room when a user starts a session
2. Greets the user and asks 3 reflective questions via real-time voice
3. After the conversation, generates a structured summary using GPT-4.1-mini
4. Saves the summary and transcript to PostgreSQL

## Setup

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e .

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials
```

## Running

```bash
source .venv/bin/activate
python agent.py dev
```

The `dev` flag enables auto-reload on file changes.

## Environment Variables

See `.env.example` for required variables:

| Variable | Description |
|----------|-------------|
| `LIVEKIT_API_KEY` | LiveKit Cloud API key |
| `LIVEKIT_API_SECRET` | LiveKit Cloud API secret |
| `LIVEKIT_URL` | LiveKit Cloud WebSocket URL |
| `OPENAI_API_KEY` | OpenAI API key |
| `DATABASE_URL` | PostgreSQL connection string |

## Files

| File | Description |
|------|-------------|
| `agent.py` | Main agent entry point and session lifecycle |
| `prompts.py` | System prompt, opening questions, and summary generation prompt |
| `session_manager.py` | Session state machine and turn tracking |
| `db.py` | Database queries using asyncpg |
