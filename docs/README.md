# RedSuture Documentation

> **Autonomous offense. Instant closure.**
> AI-powered penetration testing for web apps, APIs and code — verified findings and ready-to-merge fixes.
> A product of **NextAI Studios**.

RedSuture is a Next.js application that is built around its own autonomous engine,
a multi-agent AI penetration-testing engine. You point it at a target
(a live URL, an API, a Git repository, or all three), the engine's agents attack it the way
a real adversary would, and every finding comes back with a proof of concept and a
code fix.

## Documentation map

| Doc | What's inside |
|-----|----------------|
| [Getting started](getting-started.md) | Prerequisites, install, environment variables, running the app |
| [Architecture](architecture.md) | Tech stack, request flow, how the pieces fit together |
| [scan engine](engine.md) | How scans run, model fallback, run directories, live agent data |
| [API reference](api-reference.md) | Every route under `/api`, request/response shapes |
| [Dashboard](dashboard.md) | Overview, New scan + scheduling, live agents, findings, history |
| [Settings](settings.md) | General, Members, Billing, Integrations, Audit Logs, Help |
| [Auth & onboarding](auth-onboarding.md) | Sign-in/up, onboarding, the client-side profile store |
| [Pricing](pricing.md) | The five-tier plan ladder and how plans gate features |
| [Project structure](project-structure.md) | File-by-file reference |
| [Development](development.md) | Scripts, conventions, type/lint/build, Next.js 16 notes |

## The 60-second tour

1. A visitor lands on the marketing page ([`app/page.tsx`](../app/page.tsx)) and clicks **Launch scan**.
2. If they aren't signed in they go to **/auth**; new sign-ups pass through **/onboarding** to set up their organization.
3. In the **dashboard** they choose a target, a schedule, a model and a depth, then launch.
4. The browser `POST`s to [`/api/scan`](../app/api/scan/route.ts), which starts a real **engine** run in the background.
5. The dashboard polls [`/api/scan/[runId]`](../app/api/scan/[runId]/route.ts) every 2s, showing the live **agent team**, each agent's **steps**, and findings as they're confirmed.
6. Each finding ships with a proof of concept, a root-cause write-up, and downloadable fixes (`.patch`, `.md`, `.sarif`, `.json`).

## Status & honesty notes

RedSuture's **scanning engine is real** — it runs the engine and never fabricates
findings. Several surrounding systems are **front-end stand-ins** until their backends
are built, and the app is explicit about this rather than faking success:

- **Auth** is a client-side flag (`localStorage`), not a server session. See [Auth & onboarding](auth-onboarding.md).
- **Billing, members, integrations** render fully but their action buttons explain they need a provider/backend. See [Settings](settings.md).
- **Recurring schedules** are configured in the UI; executing them on a cadence needs a scheduler backend. See [Dashboard → Scheduling](dashboard.md#scheduling).

Each doc calls out exactly where the line between "real" and "stand-in" sits.
