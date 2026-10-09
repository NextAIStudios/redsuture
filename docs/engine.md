# scan engine

RedSuture's scanning is powered by RedSuture's engine, an
open-source multi-agent AI pentesting tool. This document explains how RedSuture
starts a scan, how it finds the engine's output, how model fallback works, and the honest
boundaries of the integration.

> **The engine never fabricates findings.** An earlier version shipped a mock that
> returned the same five hardcoded "findings" for any target; that was removed in
> commit `727df69`. If The engine is missing or every model fails, the run is marked
> **errored** with a real message — not a fake success.

## Files involved

| File | Role |
|------|------|
| [`app/api/scan/route.ts`](../app/api/scan/route.ts) | `POST` starts a run; `GET` lists runs |
| [`app/api/scan/engine.ts`](../app/api/scan/engine.ts) | `runScan()` — spawns the engine, model fallback, honest errors |
| [`app/api/scan/[runId]/route.ts`](../app/api/scan/[runId]/route.ts) | `GET` — status, logs, agents, steps, findings |

## Starting a run

`POST /api/scan` creates the run directory and kicks off `runScan()` in the
background (it is **not** awaited — the HTTP response returns a `runId` right away).

`runScan()` ([`engine.ts`](../app/api/scan/engine.ts)):

1. **Resolves the engine binary** — `RS_ENGINE_BIN`, then `~/<engine-install>/bin`, else falls
   back to the engine binary on `PATH`. If none can be launched the run is errored with an
   install hint.
2. **Builds the model chain** — the requested model first, then each fallback
   (`RS_MODEL_FALLBACKS`, or the built-in `anthropic/claude-sonnet-4-6 → openai/gpt-5.4
   → openrouter/z-ai/glm-5.3`), de-duplicated.
3. **Builds CLI args** that match the real engine:
   - `--target <t>` (repeated) or `--target-list <file>` for a target list
   - `--scan-mode <quick|standard|deep>`
   - `-n` (headless / non-interactive)
   - `--instruction <text>` (singular — **not** `--instructions`)
   - *(Note: The engine has **no** `--output` flag; RedSuture controls output location via `cwd`, see below.)*
4. **Runs each model in turn.** The engine exits `0` (no findings) or `2` (findings found) on
   success — **both are treated as success**. Any other exit code is a provider failure
   and the engine retries with the next model. All attempts stream their stdout/stderr
   into the run's `engine.log`.
5. **Updates `<runId>.meta.json`** with `status: running | complete | error` and the
   `activeModel`.

### Environment passed to the engine

`engine.ts` sets `RS_MODEL` to the current model, `RS_API_KEY`
(falling back to `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`), and prepends
`<engine-install>/bin` to `PATH`.

## Run-directory layout

The engine has no flag to set the run name — it auto-generates `<slug>_<random>`. RedSuture
can't predict that, so it runs each scan in an **isolated working directory** and reads
back the single run directory the engine creates inside it:

```
scan_runs/
├── <runId>.meta.json          ← RedSuture's metadata (status, model, targets)
└── <runId>/                    ← spawn cwd for this scan
    ├── engine.log               ← engine orchestration log + the engine stdout/stderr
    └── scan_runs/
        └── <slug>_<random>/    ← the engine's own run dir (auto-named)
            ├── findings.sarif  ← SARIF 2.1.0 results
            ├── .state/
            │   ├── agents.json ← live agent graph (status/task/skills/parent)
            │   └── agents.db   ← SQLite: per-agent message/tool-call stream
            ├── run.json        ← run record
            └── ...              ← CSV / markdown / other reports
```

`resolvethe engineRunDir()` in the status route finds the newest directory under
`<runId>/scan_runs/` and reads artifacts from there, falling back to `<runId>/` for
the engine's own error logs.

> `scan_runs/` is git-ignored.

## Reading status, agents, steps, findings

`GET /api/scan/[runId]` returns a snapshot each poll:

| Field | Source | Notes |
|-------|--------|-------|
| `status` | meta + presence of `findings.sarif` | `running` / `complete` / `error` |
| `progress` | heuristic from log-line count | 0–100 |
| `findings` | `findings.sarif` | parsed into `{ id, title, severity, cvss, type, endpoint, poc, description, remediation, patch }` |
| `agents` | `.state/agents.json` | pre-ordered tree: `{ id, name, status, parentId, task, skills, depth }` |
| `activeAgents` | derived | count of `running` + `waiting` |
| `steps` | `.state/agents.db` (SQLite) | **only** when `?agent=<id>` is passed; that agent's messages, tool calls and outputs |
| `logs` | `engine.log` | last 30 lines |
| `error` | meta | present when `status === 'error'` |

### Agent graph (`agents.json`)

RedSuture mirrors the engine's own parser: the file is `{ statuses, parent_of, names,
metadata }` keyed by agent id, flattened into a depth-ordered tree. Agent statuses are
`running`, `waiting`, `budget_paused`, `completed`, `stopped`, `crashed`, `failed`.

### Agent steps (`agents.db`)

Per-agent actions live in a SQLite WAL database, table `agent_messages(session_id,
message_data, …)`. RedSuture opens it **read-only** via Node's built-in `node:sqlite`
and maps each JSON item to a step:

- a chat message → `{ kind: 'message', role, text }`
- a `function_call` → `{ kind: 'tool', tool, text(args) }`
- a `function_call_output` → `{ kind: 'output', text }`

> `node:sqlite` requires **Node 22.5+**. On older Node the step reader catches the
> missing module and returns `[]` — the agent panel still works, it just won't show steps.

## Model fallback ("backup models")

This is the "same models, with a backup" behavior: every attempt is a real engine run,
just with a different `RS_MODEL`. Configure the chain with `RS_MODEL_FALLBACKS`
(comma-separated LiteLLM model ids). A provider outage on the primary model
transparently moves to the next.

## What's real vs. not

- **Real:** spawning the engine, model fallback, parsing SARIF / agent graph / steps, honest error states.
- **Needs a backend:** recurring **schedules** (the first run is real; cadence execution needs a scheduler). See [Dashboard → Scheduling](dashboard.md#scheduling).
- **Stub:** [`POST /api/github/pr`](api-reference.md#post-apigithubpr) builds a PR payload but does not call the GitHub API.
