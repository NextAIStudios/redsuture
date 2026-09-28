# ⬡ RedSuture

> **Autonomous offense. Instant closure.**
> 
> AI-powered penetration testing platform for developers and enterprises.
> A product of **NextAI Studios**.

![RedSuture](https://img.shields.io/badge/RedSuture-v1.0-dc2626?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)
![Strix](https://img.shields.io/badge/Powered_by-Strix_AI-dc2626?style=for-the-badge)

---

## What is RedSuture?

RedSuture is a SaaS security platform that deploys **Strix AI pentest agents** to autonomously attack your web apps, APIs, and mobile backends — finding real vulnerabilities with working proof-of-concept exploits, then helping you fix them instantly.

Think: a full red team running 24/7, at a fraction of the cost.

---

## Features

- 🤖 **Multi-agent AI pentest** — Recon, Exploitation, and Validation agents work in parallel
- ⚡ **Real exploit validation** — Zero false positives, every finding confirmed with a PoC
- 🔍 **Full attack surface** — Web apps, REST APIs, GraphQL, mobile backends
- 🩹 **AI auto-fix** — Get surgical code patches for every vulnerability
- 🔁 **CI/CD integration** — Scan on every pull request
- 📄 **Compliance reports** — SOC 2, ISO 27001, PCI DSS ready

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Styling | Vanilla CSS Modules |
| AI Pentest Engine | [Strix](https://strix.ai) v1.6.2 |
| LLM Backend | Anthropic Claude Sonnet 4.6 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Strix CLI](https://strix.ai) installed (`curl -sSL https://strix.ai/install | bash`)
- Docker (for Strix sandbox)
- An LLM API key (Anthropic, OpenAI, or OpenRouter)

### Installation

```bash
# Clone the repo
git clone https://github.com/NextAIStudios/redsuture.git
cd redsuture

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

```env
STRIX_LLM=anthropic/claude-sonnet-4-6
LLM_API_KEY=your-anthropic-api-key
STRIX_BIN=/path/to/.strix/bin/strix
```

### Run Development Server

```bash
npm run dev -- --port 3333
```

Open [http://localhost:3333](http://localhost:3333)

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Marketing page with pricing |
| Auth | `/auth` | Sign in / Sign up |
| Dashboard | `/dashboard` | Security workspace |

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scan` | Start a new Strix pentest scan |
| `GET` | `/api/scan` | List all scans |
| `GET` | `/api/scan/[runId]` | Get scan status, logs, and findings |

### Start a Scan

```bash
curl -X POST http://localhost:3333/api/scan \
  -H "Content-Type: application/json" \
  -d '{"target": "https://your-app.com", "mode": "quick"}'
```

---

## Pricing

| Plan | Price | Scans/mo |
|------|-------|----------|
| Starter | $49/mo | 10 |
| Pro | $149/mo | 50 |
| Business | $499/mo | 200 |
| Enterprise | Custom | Unlimited |

---

## ⚠️ Legal

RedSuture is for **authorized security testing only**. Only scan applications you own or have **explicit written permission** to test. Unauthorized scanning is illegal.

---

## Built by

**NextAI Studios** — Building the next generation of AI-powered developer tools.

---

*Powered by [Strix](https://strix.ai) — Autonomous AI Penetration Testing Agents*
