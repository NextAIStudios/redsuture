# Getting started

## Prerequisites

| Requirement | Why | Notes |
|-------------|-----|-------|
| **Node.js 20.9+** | Next.js 16 requires it | The agent **step** drill-down (reading the engine's local database) needs Node **22.5+** for the built-in `node:sqlite`; on older Node it degrades to "no steps" rather than crashing. |
| **Docker** (running) | The engine runs its sandbox in Docker | Only needed to actually execute scans, not to run the web app. |
| **the engine** | The scanning engine | `# install the RedSuture engine runtime` installs it to `~/<engine-install>/bin`. |
| **An LLM API key** | RedSuture drives models over [LiteLLM](https://github.com/BerriAI/litellm) | Anthropic, OpenAI, OpenRouter, Google, etc. |

The **web UI runs without Docker, the engine, or a key** — you just can't complete a real
scan. A scan with the engine missing is reported as a clear error, never a fake result.

## Install

```bash
git clone https://github.com/NextAIStudios/redsuture.git
cd redsuture
npm install
cp .env.example .env.local   # then fill in your keys
```

## Environment variables

Set these in `.env.local` (see [`.env.example`](../.env.example)):

| Variable | Required | Description |
|----------|----------|-------------|
| `RS_MODEL` | yes | Primary model in LiteLLM format, e.g. `anthropic/claude-sonnet-4-6`, `openai/gpt-5.4`, `openrouter/z-ai/glm-5.3`. |
| `RS_API_KEY` | yes | API key for the primary model's provider. `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` are also accepted as fallbacks. |
| `RS_MODEL_FALLBACKS` | no | Comma-separated LiteLLM models tried, in order, if the primary provider fails. Unset → built-in defaults (`anthropic/claude-sonnet-4-6 → openai/gpt-5.4 → openrouter/z-ai/glm-5.3`). |
| `RS_ENGINE_BIN` | no | Path to the engine binary. Unset → `~/<engine-install>/bin`, then the engine binary on `PATH`. |
| `PORT` | no | Dev-server port (examples use `3333`). |

> `.env.local` is git-ignored. Only `.env.example` is committed.

## Run it

```bash
npm run dev -- --port 3333     # dev server → http://localhost:3333
npm run build                  # production build
npm run start                  # serve the production build
npm run lint                   # ESLint
```

Open **http://localhost:3333**. The three main entry points are:

| Page | Route |
|------|-------|
| Landing / marketing | `/` |
| Sign in / create account | `/auth` (append `?mode=signup` for the create-account form) |
| Dashboard | `/dashboard` |

## First scan (end to end)

1. Make sure **Docker is running** and `RS_MODEL` + `RS_API_KEY` are set.
2. Open `/dashboard` → **New scan**.
3. Pick a **target architecture** (e.g. Web application) and enter a URL **you own or are authorized to test**.
4. Pick a **schedule** (Run once for a one-off), a **model** and a **depth**.
5. Click **Launch scan**. Watch the live agent team and findings populate.

> ⚠️ **Authorized testing only.** Only scan assets you own or have explicit written
> permission to test. the engine actively attacks the target. Unauthorized testing is illegal.

Scan output is written to `scan_runs/` (git-ignored). See [scan engine](engine.md)
for the directory layout.
