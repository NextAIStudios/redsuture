# Architecture

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router, TypeScript, React 19) |
| Styling | **CSS Modules** + design tokens in [`app/globals.css`](../app/globals.css) |
| Icons | Hand-rolled inline SVGs ([`app/components/icons.tsx`](../app/components/icons.tsx), [`brands.tsx`](../app/components/brands.tsx)) |
| Pentest engine | **the engine** (external CLI, runs in Docker) via LiteLLM |
| Server runtime | Next.js Route Handlers (Node runtime) |
| Client state | React hooks; a client-side profile/auth store in `localStorage` |

There is **no database and no server session layer yet**. Scan state lives on disk in
`scan_runs/` (written by the engine, read by the API routes); user/account state lives in
the browser's `localStorage`.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React client components)                              │
│                                                                 │
│  /          landing page, gated "Launch scan" CTAs              │
│  /auth      sign in / create account  ──┐                       │
│  /onboarding company + website  ────────┤ writes localStorage   │
│  /dashboard new scan, live agents, findings, history            │
│  /dashboard/settings  account / org / billing / integrations    │
└───────────────┬─────────────────────────────────────────────────┘
                │ fetch()
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js Route Handlers (server, Node runtime)                  │
│                                                                 │
│  POST /api/scan            → starts a the engine run (engine.ts)     │
│  GET  /api/scan            → lists runs (reads scan_runs/)     │
│  GET  /api/scan/[runId]    → status, logs, agents, steps, finds │
│  POST /api/github/pr       → builds a fix-PR payload (stub)     │
└───────────────┬─────────────────────────────────────────────────┘
                │ spawn()                      ▲ read files
                ▼                              │
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  the engine (Docker sandbox)   │──▶│  scan_runs/<runId>/...       │
│  multi-agent pentest engine   │   │  findings.sarif, agents.json, │
│  via LiteLLM → LLM providers  │   │  agents.db, logs, run.json    │
└──────────────────────────────┘   └──────────────────────────────┘
```

## Request flow: launching a scan

1. **Client** ([`app/dashboard/page.tsx`](../app/dashboard/page.tsx)) collects the
   target(s), schedule, model and depth, then `POST`s to `/api/scan`.
2. **`POST /api/scan`** ([`route.ts`](../app/api/scan/route.ts)) validates the targets,
   creates `scan_runs/<runId>/`, writes `<runId>.meta.json`, and calls
   `runScan(...)` from [`engine.ts`](../app/api/scan/engine.ts) **without awaiting**
   it (fire-and-forget background run). It returns `{ runId }` immediately.
3. **`engine.ts`** resolves the engine binary and an ordered model chain, then spawns
   the engine with `cwd = scan_runs/<runId>`. The engine writes its results into a
   nested, auto-named run directory below that.
4. **Client** polls **`GET /api/scan/[runId]`** every 2 seconds. That route resolves
   the engine's nested run directory and parses `findings.sarif`, the agent graph
   (`agents.json`), per-agent steps (`agents.db`), and the orchestration log.
5. When `findings.sarif` appears (or meta says `complete`/`error`), polling stops and
   the UI shows the final state.

See [scan engine](engine.md) for the details of steps 3–4.

## Design system

Colors, typography and component primitives (`.btn-primary`, `.btn-secondary`,
`.badge-*`, etc.) are defined once as CSS custom properties and global classes in
[`app/globals.css`](../app/globals.css). Each page/feature has its own `*.module.css`
that references those tokens, so the landing page, auth, onboarding, dashboard and
settings all share one visual language. The brand accent is red (`--red-primary`),
the surface is near-black, and type is Inter + JetBrains Mono (mono for code and IDs).

## Rendering model

Every interactive page is a **client component** (`'use client'`). The API routes are
**server** route handlers that touch the filesystem and spawn processes, so they must
run on the Node runtime (the default for route handlers). `node:sqlite` and `spawn`
are marked with `/* turbopackIgnore: true */` so the bundler doesn't try to trace or
inline them.
