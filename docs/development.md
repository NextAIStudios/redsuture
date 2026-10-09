# Development

## Scripts

| Command | Does |
|---------|------|
| `npm run dev -- --port 3333` | Start the dev server at http://localhost:3333 |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npx tsc --noEmit -p .` | Type-check without emitting |

A healthy change passes all three: `tsc`, `eslint app`, and `next build` with no
warnings.

## Next.js 16 notes

This project is on **Next.js 16**, which has breaking changes from earlier versions.
`AGENTS.md` (and `CLAUDE.md`) instruct contributors — human or AI — to read the version's
bundled docs in `node_modules/next/dist/docs/` before changing framework-facing code.
Things that bit us already:

- **Async route params.** Dynamic route handlers receive `params` as a `Promise`:
  `context: { params: Promise<{ runId: string }> }`, then `await context.params`.
- **`react-hooks/set-state-in-effect`** is an **error**. Reading browser-only state
  (`localStorage`) on mount legitimately needs a `useEffect` + `setState`; those spots
  are scoped with `eslint-disable react-hooks/set-state-in-effect` and a comment
  explaining it's a hydration-safe read.
- **Turbopack file tracing.** `spawn()` and `node:sqlite` are annotated with
  `/* turbopackIgnore: true */` so the bundler doesn't trace/inline them.

## Node version

- **20.9+** runs the app and all features except agent-step reading.
- **22.5+** additionally enables the per-agent **step** drill-down, which uses the
  built-in `node:sqlite`. On older Node the reader returns no steps instead of crashing.

## Common gotchas

- **CSS module class must exist.** Referencing `styles.foo` where `.foo` isn't defined
  renders `class="undefined"` (silently unstyled). When adding JSX, add the matching
  class. A fast check:
  ```bash
  comm -23 \
    <(grep -oE "styles\.[A-Za-z0-9_]+" app/dashboard/page.tsx | sed 's/styles\.//' | sort -u) \
    <(grep -oE "\.[A-Za-z0-9_]+\b" app/dashboard/dashboard.module.css | sed 's/\.//' | sort -u)
  ```
  Any output is a referenced-but-undefined class.
- **Don't broad-kill the engine process.** The dev server's working directory sits
  near the engine's run output, so a broad `pkill` can take the dev server down too.
  Stop engine test runs by PID instead.
- **`scan_runs/` is local-only.** It's git-ignored; nothing there is committed.

## Testing a scan without a real target

The engine always runs the **real** the engine binary — there is no mock. To exercise the
status route / UI without launching a live pentest, craft a run directory that matches
the engine's layout (a `<runId>.meta.json`, a nested `scan_runs/<name>/findings.sarif`, and
optionally `.state/agents.json` + a small `agents.db`) and hit
`GET /api/scan/<runId>`. See [scan engine → Run-directory layout](engine.md#run-directory-layout).

## Git / branching

The default branch is `main`. Commit messages in this repo are descriptive and
imperative; PR descriptions summarize the change and its boundaries.

## Where to extend next

| Want | Build |
|------|-------|
| Real accounts & protected routes | A session backend; swap `app/lib/profile.ts` for API calls |
| Recurring scans actually running | A scheduler (cron/queue) that calls `POST /api/scan` on the saved cadence |
| Real fix PRs | Wire `POST /api/github/pr` to the GitHub API (Octokit) with a token |
| Billing / members / integrations | Back the stubbed buttons in [Settings](settings.md) with real providers |
