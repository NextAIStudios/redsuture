# Getting started

## Prerequisites

| Requirement | Why | Notes |
|-------------|-----|-------|
| **Node.js 20.9+** | Next.js 16 requires it | The agent **step** drill-down (reading Strix's SQLite DB) needs Node **22.5+** for the built-in `node:sqlite`; on older Node it degrades to "no steps" rather than crashing. |
| **Docker** (running) | Strix runs its sandbox in Docker | Only needed to actually execute scans, not to run the web app. |
| **Strix CLI** | The scanning engine | `curl -sSL https://strix.ai/install | bash` installs it to `~/.strix/bin/strix`. See [github.com/usestrix/strix](https://github.com/usestrix/strix). |
| **An LLM API key** | Strix drives models over [LiteLLM](https://github.com/BerriAI/litellm) | Anthropic, OpenAI, OpenRouter, Google, etc. |

The **web UI runs without Docker, Strix, or a key** — you just can't complete a real
scan. A scan with Strix missing is reported as a clear error, never a fake result.

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
| `STRIX_LLM` | yes | Primary model in LiteLLM format, e.g. `anthropic/claude-sonnet-4-6`, `openai/gpt-5.4`, `openrouter/z-ai/glm-5.3`. |
| `LLM_API_KEY` | yes | API key for the primary model's provider. `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` are also accepted as fallbacks. |
| `STRIX_LLM_FALLBACKS` | no | Comma-separated LiteLLM models tried, in order, if the primary provider fails. Unset → built-in defaults (`anthropic/claude-sonnet-4-6 → openai/gpt-5.4 → openrouter/z-ai/glm-5.3`). |
| `STRIX_BIN` | no | Path to the Strix binary. Unset → `~/.strix/bin/strix`, then `strix` on `PATH`. |
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

1. Make sure **Docker is running** and `STRIX_LLM` + `LLM_API_KEY` are set.
2. Open `/dashboard` → **New scan**.
3. Pick a **target architecture** (e.g. Web application) and enter a URL **you own or are authorized to test**.
4. Pick a **schedule** (Run once for a one-off), a **model** and a **depth**.
5. Click **Launch scan**. Watch the live agent team and findings populate.

> ⚠️ **Authorized testing only.** Only scan assets you own or have explicit written
> permission to test. Strix actively attacks the target. Unauthorized testing is illegal.

Scan output is written to `strix_runs/` (git-ignored). See [Strix engine](strix-engine.md)
for the directory layout.
