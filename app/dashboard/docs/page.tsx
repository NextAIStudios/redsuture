'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './docs.module.css';
import Logo from '../../components/Logo';
import {
  ArrowLeftIcon, CopyIcon, CheckIcon, RadarIcon, SettingsIcon,
  CodeIcon, ListIcon, ExternalLinkIcon,
} from '../../components/icons';

type Section =
  | 'intro' | 'quickstart' | 'auth' | 'start-scan' | 'poll-scan'
  | 'list-scans' | 'agents' | 'github-pr' | 'models' | 'engine';

const NAV: { group: string; items: { id: Section; label: string }[] }[] = [
  {
    group: 'Getting started',
    items: [
      { id: 'intro', label: 'Introduction' },
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'auth', label: 'Authentication' },
    ],
  },
  {
    group: 'Scan API',
    items: [
      { id: 'start-scan', label: 'Start a scan' },
      { id: 'poll-scan', label: 'Poll a scan' },
      { id: 'list-scans', label: 'List scans' },
      { id: 'agents', label: 'Agents & steps' },
    ],
  },
  {
    group: 'More',
    items: [
      { id: 'github-pr', label: 'Open a fix PR' },
      { id: 'models', label: 'Models & environment' },
      { id: 'engine', label: 'Strix engine' },
    ],
  },
];

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className={styles.code}>
      <div className={styles.codeHead}>
        <span className={styles.codeLang}>{lang}</span>
        <button className={styles.copyBtn} onClick={copy}>
          {copied ? <><CheckIcon size={13} /> Copied</> : <><CopyIcon size={13} /> Copy</>}
        </button>
      </div>
      <pre className={styles.pre}><code>{code}</code></pre>
    </div>
  );
}

function Field({ name, type, req, children }: { name: string; type: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <code className={styles.fieldName}>{name}</code>
        <span className={styles.fieldType}>{type}</span>
        {req ? <span className={styles.reqd}>required</span> : <span className={styles.opt}>optional</span>}
      </div>
      <p className={styles.fieldDesc}>{children}</p>
    </div>
  );
}

const METHOD_CLASS: Record<string, string> = { GET: styles.get, POST: styles.post };
function Endpoint({ method, path }: { method: 'GET' | 'POST'; path: string }) {
  return (
    <div className={styles.endpoint}>
      <span className={`${styles.method} ${METHOD_CLASS[method]}`}>{method}</span>
      <code className={styles.path}>{path}</code>
    </div>
  );
}

export default function DocsPage() {
  const [section, setSection] = useState<Section>('intro');

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" aria-label="RedSuture home"><Logo /></Link>
        </div>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeftIcon size={14} /> Back to dashboard
        </Link>
        <nav className={styles.nav} aria-label="Developer docs">
          {NAV.map(g => (
            <div key={g.group} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{g.group}</div>
              {g.items.map(item => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${section === item.id ? styles.navItemActive : ''}`}
                  onClick={() => setSection(item.id)}
                  aria-current={section === item.id ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          {section === 'intro' && (
            <article className={styles.article}>
              <span className={styles.eyebrow}>Developer docs</span>
              <h1>RedSuture API</h1>
              <p className={styles.lead}>
                RedSuture drives <a href="https://github.com/usestrix/strix" target="_blank" rel="noopener noreferrer">Strix</a>,
                a multi-agent AI pentesting engine. Point the API at a target, and
                autonomous agents attack it, validate every finding with a proof of
                concept, and return a code fix.
              </p>
              <p>
                The API is a small set of JSON routes under <code>/api</code>. You start a
                scan, then poll it for live agent activity and findings. All examples use
                a local dev server at <code>http://localhost:3333</code>.
              </p>
              <div className={styles.cards}>
                <button className={styles.jump} onClick={() => setSection('quickstart')}>
                  <RadarIcon size={18} /><span><strong>Quickstart</strong>Start your first scan in two calls.</span>
                </button>
                <button className={styles.jump} onClick={() => setSection('start-scan')}>
                  <CodeIcon size={18} /><span><strong>Scan API</strong>Start, poll and list scans.</span>
                </button>
                <button className={styles.jump} onClick={() => setSection('agents')}>
                  <ListIcon size={18} /><span><strong>Agents &amp; steps</strong>Watch the agent team live.</span>
                </button>
                <Link className={styles.jump} href="/dashboard/settings">
                  <SettingsIcon size={18} /><span><strong>Settings</strong>Account, billing, integrations.</span>
                </Link>
              </div>
              <div className={styles.callout}>
                <strong>Full written docs</strong> live in the repository under
                {' '}<code>docs/</code> — architecture, the Strix engine internals, and a
                file-by-file reference.
              </div>
            </article>
          )}

          {section === 'quickstart' && (
            <article className={styles.article}>
              <h1>Quickstart</h1>
              <p>Make sure Docker is running and your environment is set, then start a scan and poll it.</p>
              <h2>1. Configure</h2>
              <CodeBlock lang="bash" code={`# .env.local
STRIX_LLM=anthropic/claude-sonnet-4-6
LLM_API_KEY=your-provider-api-key`} />
              <h2>2. Start a scan</h2>
              <CodeBlock lang="bash" code={`curl -X POST http://localhost:3333/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"targets":["https://api.example.com"],"targetType":"url","mode":"quick"}'
# → { "runId": "api-example-com_m1a2b3", "status": "running", "targets": [ ... ] }`} />
              <h2>3. Poll for progress &amp; findings</h2>
              <CodeBlock lang="bash" code={`curl "http://localhost:3333/api/scan/api-example-com_m1a2b3"`} />
              <div className={styles.warn}>
                ⚠️ Only scan assets you own or have explicit written permission to test.
                Strix actively attacks the target.
              </div>
            </article>
          )}

          {section === 'auth' && (
            <article className={styles.article}>
              <h1>Authentication</h1>
              <p>
                The API routes are currently <strong>unauthenticated</strong> — there is
                no server session or API key yet. In the browser, the app uses a
                client-side flag (<code>localStorage</code>) only to personalize and gate
                the UI; it does not protect the routes.
              </p>
              <div className={styles.callout}>
                <strong>Before deploying publicly</strong>, add a session/API-key layer
                and protect <code>/api/scan*</code>. See <code>docs/auth-onboarding.md</code>
                for the plan.
              </div>
            </article>
          )}

          {section === 'start-scan' && (
            <article className={styles.article}>
              <h1>Start a scan</h1>
              <Endpoint method="POST" path="/api/scan" />
              <p>Starts a Strix pentest in the background and returns a <code>runId</code> immediately.</p>
              <h2>Body</h2>
              <Field name="targets" type="string[]" req>One or more targets. Blank entries are dropped.</Field>
              <Field name="target" type="string">Single-target convenience; used if <code>targets</code> is empty.</Field>
              <Field name="targetType" type="string">
                <code>url</code> · <code>repo</code> · <code>dir</code> · <code>whitebox</code> · <code>list</code>. Default <code>url</code>.
              </Field>
              <Field name="mode" type="string"><code>quick</code> · <code>standard</code> · <code>deep</code>. Default <code>quick</code>.</Field>
              <Field name="llm" type="string">Primary model, LiteLLM format. Default <code>anthropic/claude-sonnet-4-6</code>. Fallbacks follow automatically.</Field>
              <Field name="instructions" type="string">Scope notes, credentials or focus; passed to Strix as <code>--instruction</code>.</Field>
              <Field name="schedule" type="string"><code>manual</code> · <code>weekly</code> · <code>monthly</code> · <code>daily</code> · <code>continuous</code>. Default <code>manual</code>.</Field>
              <h2>Example</h2>
              <CodeBlock lang="javascript" code={`const res = await fetch('/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targets: ['https://api.example.com'],
    targetType: 'url',
    mode: 'quick',
    llm: 'anthropic/claude-sonnet-4-6',
    instructions: 'Focus on auth and IDOR in /v2',
  }),
});
const { runId } = await res.json();`} />
            </article>
          )}

          {section === 'poll-scan' && (
            <article className={styles.article}>
              <h1>Poll a scan</h1>
              <Endpoint method="GET" path="/api/scan/:runId" />
              <p>Returns a live snapshot. The dashboard polls this every 2 seconds until <code>status</code> is <code>complete</code> or <code>error</code>.</p>
              <h2>Query</h2>
              <Field name="agent" type="string">When set to an agent id in the run, includes that agent&apos;s <code>steps</code>. Omit to skip the step read.</Field>
              <h2>Response</h2>
              <CodeBlock lang="json" code={`{
  "runId": "api-example-com_m1a2b3",
  "status": "running",            // running | complete | error
  "progress": 62,
  "findings": [ { "id", "title", "severity", "cvss", "endpoint", "poc", "patch", ... } ],
  "agents": [ { "id", "name", "status", "parentId", "task", "skills": [], "depth" } ],
  "activeAgents": 3,
  "steps": [ { "seq", "kind": "tool", "tool": "browser_navigate", "text": "..." } ],
  "counts": { "critical": 1, "high": 3 },
  "logs": [ "..." ],
  "error": null
}`} />
              <h2>Polling loop</h2>
              <CodeBlock lang="javascript" code={`async function poll(runId) {
  const timer = setInterval(async () => {
    const data = await fetch(\`/api/scan/\${runId}\`).then(r => r.json());
    render(data.agents, data.findings, data.progress);
    if (data.status === 'complete' || data.status === 'error') clearInterval(timer);
  }, 2000);
}`} />
            </article>
          )}

          {section === 'list-scans' && (
            <article className={styles.article}>
              <h1>List scans</h1>
              <Endpoint method="GET" path="/api/scan" />
              <p>Returns every scan, newest first.</p>
              <CodeBlock lang="json" code={`{
  "scans": [
    { "runId": "...", "target": "https://api.example.com", "targetType": "url",
      "mode": "quick", "llm": "anthropic/claude-sonnet-4-6",
      "startedAt": "2026-10-09T10:00:00.000Z", "status": "complete" }
  ]
}`} />
            </article>
          )}

          {section === 'agents' && (
            <article className={styles.article}>
              <h1>Agents &amp; steps</h1>
              <p>
                Strix runs a graph of specialized agents (recon, exploitation, validation,
                remediation). The poll response includes the live <code>agents</code> tree;
                request one agent&apos;s <code>steps</code> to see exactly what it&apos;s doing.
              </p>
              <h2>Agent shape</h2>
              <CodeBlock lang="typescript" code={`interface Agent {
  id: string;
  name: string;              // "Recon", "Exploitation", ...
  status: string;            // running | waiting | completed | failed | ...
  parentId: string | null;   // tree edges
  task: string | null;       // what it's doing right now
  skills: string[];          // ["bola", "sqli", "proxy"]
  depth: number;             // indentation in the tree
}`} />
              <h2>Fetch a specific agent&apos;s steps</h2>
              <CodeBlock lang="bash" code={`curl "http://localhost:3333/api/scan/<runId>?agent=exploit"
# steps: [ { kind: "message" | "tool" | "output", tool?, role?, text } ]`} />
              <div className={styles.callout}>
                Steps come from Strix&apos;s SQLite database and require <strong>Node 22.5+</strong>
                {' '}(built-in <code>node:sqlite</code>). On older Node the agent tree still
                works; steps come back empty.
              </div>
            </article>
          )}

          {section === 'github-pr' && (
            <article className={styles.article}>
              <h1>Open a fix PR</h1>
              <Endpoint method="POST" path="/api/github/pr" />
              <p>
                Builds a pull-request payload for a finding&apos;s patch.
              </p>
              <div className={styles.warn}>
                <strong>Stub.</strong> This route constructs and returns the payload but
                does <strong>not</strong> call the GitHub API — no branch or PR is created.
                Wire it to Octokit with a token to make it real.
              </div>
              <h2>Body</h2>
              <Field name="repoUrl" type="string" req><code>https://github.com/owner/repo</code> or <code>owner/repo</code>.</Field>
              <Field name="targetBranch" type="string">Default <code>main</code>.</Field>
              <Field name="vulnId" type="string">Used in the generated branch name.</Field>
              <Field name="vulnTitle" type="string">Used in the PR title.</Field>
              <Field name="patchDiff" type="string">The patch to attach.</Field>
            </article>
          )}

          {section === 'models' && (
            <article className={styles.article}>
              <h1>Models &amp; environment</h1>
              <p>Strix talks to 100+ providers through LiteLLM. Set the primary model and key, and an optional fallback chain.</p>
              <CodeBlock lang="bash" code={`# Primary model (LiteLLM format) and its key
STRIX_LLM=anthropic/claude-sonnet-4-6
LLM_API_KEY=your-provider-api-key

# Optional: comma-separated backup models, tried in order on provider failure.
# Unset → anthropic/claude-sonnet-4-6 → openai/gpt-5.4 → openrouter/z-ai/glm-5.3
STRIX_LLM_FALLBACKS=openai/gpt-5.4,openrouter/z-ai/glm-5.3

# Optional: path to the Strix binary (default ~/.strix/bin/strix, then PATH)
STRIX_BIN=`} />
              <p>
                Each scan tries the requested model first, then each fallback — every
                attempt is a real Strix run, just with a different model. Pass <code>llm</code>
                on the request to override the primary per scan.
              </p>
              <h2>Common models</h2>
              <ul className={styles.list}>
                <li><code>anthropic/claude-sonnet-4-6</code></li>
                <li><code>openai/gpt-5.4</code></li>
                <li><code>openrouter/z-ai/glm-5.3</code></li>
                <li><code>vertex_ai/gemini-3-pro-preview</code></li>
                <li><code>deepseek/deepseek-v4-pro</code></li>
              </ul>
            </article>
          )}

          {section === 'engine' && (
            <article className={styles.article}>
              <h1>Strix engine</h1>
              <p>
                A scan spawns the real Strix CLI in an isolated working directory. Strix
                writes its results to disk; the poll route reads them back.
              </p>
              <CodeBlock lang="text" code={`strix_runs/
├── <runId>.meta.json          # status, model, targets
└── <runId>/                   # spawn cwd
    ├── strix.log              # orchestration log + Strix output
    └── strix_runs/<auto>/     # Strix's own run dir
        ├── findings.sarif     # SARIF 2.1.0 results
        ├── .state/agents.json # live agent graph
        ├── .state/agents.db   # per-agent step stream (SQLite)
        └── run.json`} />
              <ul className={styles.list}>
                <li>Strix exits <code>0</code> (no findings) or <code>2</code> (findings) on success — both count as success.</li>
                <li>If Strix is missing or every model fails, the run is marked <code>error</code> — never a fabricated result.</li>
                <li><code>strix_runs/</code> is git-ignored.</li>
              </ul>
              <a className={styles.extLink} href="https://github.com/usestrix/strix" target="_blank" rel="noopener noreferrer">
                Strix on GitHub <ExternalLinkIcon />
              </a>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
