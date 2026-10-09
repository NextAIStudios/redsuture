# Dashboard

The dashboard ([`app/dashboard/page.tsx`](../app/dashboard/page.tsx)) is a single
client component with a tabbed layout. A collapsible left sidebar switches between four
tabs; the bottom of the sidebar shows the signed-in user and links to
[Settings](settings.md).

| Tab | What it does |
|-----|--------------|
| **Overview** | Stat cards + a "Recent scans" list. |
| **New scan** | Configure and launch a scan; the live scan card renders here. |
| **Findings** | Browse a scan's vulnerabilities and remediation. |
| **Scan history** | A table of past scans. |

## New scan

A four-step form:

1. **Target architecture** — pick what to test: Web application, Git repository, Local
   directory, White-box hybrid, or Target list. This sets `targetType`.
2. **Schedule** — Run once, or a recurring cadence (see [Scheduling](#scheduling)).
3. **Scope configuration** — the target URL / repo / path(s) for the chosen type.
4. **AI reasoning model & depth** — model (`<select>`) and depth (`quick` / `standard`
   / `deep`), plus optional free-text instructions.

Clicking **Launch scan** calls `startScan()`, which `POST`s to `/api/scan`, stores the
returned `runId`, switches to the New scan tab, and begins polling
`/api/scan/<runId>` every 2 seconds.

### Scheduling

The Schedule step offers five cadences, **gated by the user's plan tier**
(`planTier()` reads the plan from the profile):

| Cadence | Min tier | Unlocked by |
|---------|----------|-------------|
| **Run once** | 0 | everyone |
| **Weekly** | 1 | any paid plan |
| **Monthly** | 1 | any paid plan |
| **Daily** | 2 | Pro / Scale / Business |
| **On every pull request** | 3 | Enterprise |

Tiers map from the plan name: `enterprise → 3`, `pro/scale/business → 2`,
`team/starter → 1`, unknown → 2. Locked cadences render disabled with a lock + the
required tier.

The chosen cadence is sent as `schedule` on the scan request. For a recurring choice
the launch button reads **"Schedule & run first scan"**: the first scan runs for real,
and the UI notes that later runs are handled by the scheduler.

> **Boundary:** executing scans on a cadence needs a scheduler backend (cron/queue),
> which doesn't exist yet. The UI configures the intent and runs the first scan.

## Live scan card & the agent team

While a scan runs, a card on the New scan tab shows:

- a **status/phase/progress** header,
- the **Agent team** — every Strix agent, indented as a tree, with a status dot
  (running pulses red, done is green, waiting is amber), its current **task**, and its
  **skills**,
- a tailing **log**, and token/finding counters.

Click an agent to expand its **steps** — the live, step-by-step actions it's taking
(assistant messages, tool calls with arguments, tool outputs), colour-coded. Steps are
fetched by adding `?agent=<id>` to the poll; they come from Strix's `agents.db`. See
[Strix engine](strix-engine.md#agent-steps-agentsdb).

## Findings

The Findings tab lists a scan's vulnerabilities (severity pill, title, endpoint, CVSS).
Selecting one shows:

- severity / CVSS / "PoC verified" tags,
- the **proof of concept**,
- impact & root-cause analysis,
- a numbered **how-to-fix**,
- the **code patch** as a coloured diff,
- **Copy patch** / **Copy guide**, and a **remediation package** bar that downloads the
  finding as `.patch`, `.md` (developer guide), `.sarif` (SARIF 2.1.0), or `.json`.

> The Findings/History/Overview tabs seed from mock data (`MOCK_SCANS`, `MOCK_VULNS`)
> for demonstration. A completed live scan's findings replace that list via the poller.

## Scan history

A table of past scans (target, date, duration, findings, score) with a link into the
Findings view for each.

## Error handling

If a poll returns `status: 'error'`, the dashboard stops polling and shows the error
message in the scan card — e.g. "Strix is not installed or not on PATH." It never shows
a fabricated completed scan.
