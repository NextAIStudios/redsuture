# API reference

All routes live under `app/api/` as Next.js Route Handlers (Node runtime). Bodies are
JSON. There is **no authentication** on these routes yet — see [Auth & onboarding](auth-onboarding.md).

## `POST /api/scan`

Starts a the engine pentest in the background and returns immediately.
[`app/api/scan/route.ts`](../app/api/scan/route.ts)

### Request body

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `targets` | `string[]` | — | One or more targets. Blank entries are dropped. |
| `target` | `string` | — | Single-target convenience; used if `targets` is empty. |
| `targetType` | `string` | `"url"` | `url` · `repo` · `dir` · `whitebox` · `list`. For `list`, the first target is treated as a path passed to `--target-list`. |
| `mode` | `string` | `"quick"` | `quick` · `standard` · `deep`. |
| `llm` | `string` | `anthropic/claude-sonnet-4-6` | Primary model (LiteLLM format). Fallbacks follow (see [scan engine](engine.md#model-fallback-backup-models)). |
| `instructions` | `string` | — | Free-text scope notes / credentials / focus. Passed to the engine as `--instruction`. |
| `schedule` | `string` | `"manual"` | `manual` · `weekly` · `monthly` · `daily` · `continuous`. Stored with the request; recurring execution needs a scheduler backend. |

At least one non-empty target is required (else `400`).

### Response

```json
{ "runId": "api-example-com_m1a2b3", "status": "running", "targets": ["https://api.example.com"] }
```

### Example

```bash
curl -X POST http://localhost:3333/api/scan \
  -H "Content-Type: application/json" \
  -d '{"targets":["https://api.example.com"],"targetType":"url","mode":"quick"}'
```

---

## `GET /api/scan`

Lists all scans, newest first, by reading every `*.meta.json` in `scan_runs/`.

### Response

```json
{ "scans": [ { "runId": "...", "target": "...", "targets": ["..."], "targetType": "url",
               "mode": "quick", "llm": "...", "startedAt": "ISO", "status": "complete" } ] }
```

---

## `GET /api/scan/[runId]`

Returns a live snapshot of one run. Poll this (the dashboard uses 2s).
[`app/api/scan/[runId]/route.ts`](../app/api/scan/[runId]/route.ts)

### Query parameters

| Param | Notes |
|-------|-------|
| `agent` | When set to an agent id present in the run, the response includes that agent's `steps` (read from `agents.db`). Omit it to skip the SQLite read. |

### Response

| Field | Type | Notes |
|-------|------|-------|
| `runId` | `string` | |
| `...meta` | object | Everything from `<runId>.meta.json` is spread in (targets, mode, llm, `error`, …). |
| `status` | `string` | `running` · `complete` · `error`. |
| `progress` | `number` | 0–100, heuristic. |
| `findings` | `Finding[]` | `{ id, title, severity, cvss, type, endpoint, status, description, remediation, fix, poc, patch }`. |
| `agents` | `AgentNode[]` | `{ id, name, status, parentId, task, skills[], depth }`, depth-ordered. |
| `activeAgents` | `number` | Count of `running` + `waiting`. |
| `selectedAgent` | `string \| null` | Echo of the `agent` query param. |
| `steps` | `AgentStep[]` | `{ seq, kind: 'message'\|'tool'\|'output', role?, tool?, text }` for the selected agent (empty otherwise). |
| `counts` | `Record<severity, number>` | Severity tally. |
| `logs` | `string[]` | Last 30 log lines. |
| `tokenInfo` | object \| null | Token usage if the run record has it. |
| `duration` | `string` | Elapsed / "In progress". |

`404` if the run's meta file does not exist.

### Example

```bash
curl "http://localhost:3333/api/scan/api-example-com_m1a2b3?agent=exploit"
```

---

## `POST /api/github/pr`

Builds a **fix pull-request payload** for a finding. **Stub:** it constructs and returns
the payload but **does not call the GitHub API** — no branch or PR is actually created.
[`app/api/github/pr/route.ts`](../app/api/github/pr/route.ts)

### Request body

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `repoUrl` | `string` | — | **Required.** `https://github.com/owner/repo` (or `owner/repo`). |
| `targetBranch` | `string` | `"main"` | |
| `vulnId` | `string` | — | Used in the generated branch name. |
| `vulnTitle` | `string` | — | Used in the PR title. |
| `patchDiff` | `string` | — | The patch to attach. |

### Response (shape)

```json
{ "success": true, "repo": "owner/repo", "branch": "redsuture/fix-<id>-<ts>",
  "targetBranch": "main", "prNumber": 1234,
  "prUrl": "https://github.com/owner/repo/pull/1234",
  "title": "[RedSuture Security Fix] ...", "status": "opened", "filesChanged": 1,
  "commits": 1, "verifiedBy": "the engine AI Validation Agent", "createdAt": "ISO", "patch": "..." }
```

`400` if `repoUrl` is missing.

---

## Error shape

All routes return `{ "error": "<message>" }` with an appropriate status (`400` /
`404` / `500`). Thrown values are normalized to a string message.
