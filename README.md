# ⬡ RedSuture

> **Autonomous offense. Instant closure.**
>
> AI-powered penetration testing for web apps, APIs and code — with verified findings and ready-to-merge fixes.
> A product of **NextAI Studios**.

![RedSuture](https://img.shields.io/badge/RedSuture-v1.0-e5383b?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)
![Strix](https://img.shields.io/badge/Powered_by-Strix-e5383b?style=for-the-badge)

---

## What is RedSuture?

RedSuture deploys [Strix](https://github.com/usestrix/strix) AI agents that test your web apps, APIs and source code the way a real attacker would. Every finding is backed by a proof of concept, and each one ships with a remediation package: a code patch, a developer guide, an executive report and SARIF output.

---

## Features

- 🤖 **Multi-agent testing** — reconnaissance, exploitation and validation agents work in parallel
- ✅ **Proof of concept for every finding** — results are reproduced before they are reported
- 🎯 **Flexible targets** — live URLs, Git repositories, local directories, white-box (code + live URL) and bulk target lists
- 🩹 **Remediation packages** — `.patch`, Markdown guide, SARIF 2.1.0 and JSON report per finding
- 🔁 **Workflow-ready** — SARIF for GitHub code scanning and CI pipelines
- 📄 **Audit-oriented reporting** — structured around SOC 2, ISO 27001, PCI DSS and HIPAA testing requirements

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | React 19, CSS Modules, shared design tokens in `app/globals.css` |
| Pentest engine | [Strix](https://github.com/usestrix/strix) (open source, runs in Docker) |
| Default model | `anthropic/claude-sonnet-4-6` (any model Strix supports can be configured) |

---

## Getting Started

### Prerequisites

- Node.js **20.9+** (required by Next.js 16)
- [Strix CLI](https://github.com/usestrix/strix) installed (`curl -sSL https://strix.ai/install | bash`)
- Docker, running (Strix uses it for its sandbox)
- An API key for a model provider Strix supports

### Installation

```bash
git clone https://github.com/NextAIStudios/redsuture.git
cd redsuture
npm install
cp .env.example .env.local   # then add your keys
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `STRIX_LLM` | Model in LiteLLM format, e.g. `anthropic/claude-sonnet-4-6` |
| `LLM_API_KEY` | API key for that model's provider |
| `STRIX_BIN` | Path to the Strix binary (defaults to `~/.strix/bin/strix`) |
| `PORT` | Dev server port (`3333` in the examples below) |

### Scripts

```bash
npm run dev -- --port 3333   # development server → http://localhost:3333
npm run build                # production build
npm run start                # serve the production build
npm run lint                 # ESLint
```

---

## Documentation

Detailed docs live in [`docs/`](docs/README.md):

| Doc | Covers |
|-----|--------|
| [Getting started](docs/getting-started.md) | Prerequisites, install, env vars, first scan |
| [Architecture](docs/architecture.md) | Tech stack, request flow, design system |
| [Strix engine](docs/strix-engine.md) | How scans run, model fallback, run dirs, live agent data |
| [API reference](docs/api-reference.md) | Every `/api` route |
| [Dashboard](docs/dashboard.md) | New scan, scheduling, live agents, findings |
| [Settings](docs/settings.md) | General, Members, Billing, Integrations, Audit, Help |
| [Auth & onboarding](docs/auth-onboarding.md) | Sign-in/up, onboarding, the profile store |
| [Pricing](docs/pricing.md) | The five-tier plan ladder |
| [Project structure](docs/project-structure.md) | File-by-file reference |
| [Development](docs/development.md) | Scripts, conventions, Next.js 16 notes |

---

## Project Structure

```
app/
├── page.tsx, page.module.css          # Landing page
├── auth/                              # Sign in / create account
├── dashboard/                         # Security workspace (overview, new scan, findings, history)
├── components/
│   ├── icons.tsx                      # Shared SVG icon set
│   └── Logo.tsx                       # Brand mark used on every page
├── api/
│   ├── scan/route.ts                  # Start and list Strix scans
│   ├── scan/[runId]/route.ts          # Scan status, logs and findings
│   └── github/pr/route.ts             # Fix pull request payload
└── globals.css                        # Design tokens, buttons, badges
```

Scan output is written to `strix_runs/` (git-ignored).

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Product overview, coverage, pricing and FAQ |
| Auth | `/auth` | Sign in; `/auth?mode=signup` opens account creation |
| Dashboard | `/dashboard` | Overview, new scan, findings with remediation, scan history |

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scan` | Start a Strix scan in the background |
| `GET` | `/api/scan` | List all scans |
| `GET` | `/api/scan/[runId]` | Scan status, recent logs, findings and severity counts |
| `POST` | `/api/github/pr` | Build a fix pull request payload (GitHub API integration not wired up yet) |

### Start a scan

```bash
curl -X POST http://localhost:3333/api/scan \
  -H "Content-Type: application/json" \
  -d '{"targets": ["https://your-app.com"], "targetType": "url", "mode": "quick"}'
```

| Field | Values |
|-------|--------|
| `targets` | Array of URLs, repository links or paths |
| `targetType` | `url`, `repo`, `dir`, `whitebox`, `list` |
| `mode` | `quick`, `standard`, `deep` |
| `llm` | Optional model override (defaults to `anthropic/claude-sonnet-4-6`) |
| `instructions` | Optional scope notes, credentials or focus areas |

---

## Pricing

| Plan | Price | Scans / month |
|------|-------|---------------|
| Team | $199/mo | 25 |
| Scale | $599/mo | 100 |
| Enterprise | Custom | Unlimited |

---

## ⚠️ Legal

RedSuture is for **authorized security testing only**. Only scan applications and infrastructure you own or have **explicit written permission** to test. Unauthorized scanning is illegal.

---

## Built by

**NextAI Studios** — building the next generation of AI-powered developer tools.

*Powered by [Strix](https://github.com/usestrix/strix) — open-source autonomous AI penetration testing agents.*
