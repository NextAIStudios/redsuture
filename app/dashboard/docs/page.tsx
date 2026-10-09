'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './docs.module.css';
import {
  SearchIcon, CopyIcon, CheckIcon, RadarIcon, CodeIcon, ListIcon, GitIcon,
  LayersIcon, ArrowRightIcon,
} from '../../components/icons';

type NavGroup = { group: string; items: { id: string; label: string }[] };

const NAV: NavGroup[] = [
  {
    group: 'Getting started',
    items: [
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'authentication', label: 'Authentication' },
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
    group: 'Reference',
    items: [
      { id: 'github-pr', label: 'Open a fix PR' },
      { id: 'models', label: 'Models & environment' },
      { id: 'engine', label: 'Scan engine' },
    ],
  },
];

const TOC = NAV.flatMap(g => g.items);

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
  const [active, setActive] = useState('quickstart');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Scroll-spy: highlight the section nearest the top of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -68% 0px', threshold: 0 },
    );
    TOC.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Cmd/Ctrl-K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const jumpTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const q = query.trim().toLowerCase();
  const filteredNav = NAV
    .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q)) }))
    .filter(g => g.items.length > 0);

  const CARDS = [
    { id: 'quickstart', icon: <RadarIcon size={20} />, title: 'Quickstart', desc: 'Start your first scan in two calls' },
    { id: 'start-scan', icon: <CodeIcon size={20} />, title: 'Scan API', desc: 'Start, poll and list scans' },
    { id: 'agents', icon: <ListIcon size={20} />, title: 'Agents & steps', desc: 'Watch the agent team live' },
    { id: 'github-pr', icon: <GitIcon size={20} />, title: 'Fix pull requests', desc: 'Ship patches to GitHub' },
    { id: 'models', icon: <LayersIcon size={20} />, title: 'Models', desc: 'Pick models & fallbacks' },
  ];

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logoMark}><LayersIcon size={16} /></span>
          <span className={styles.brandName}>RedSuture</span>
          <span className={styles.docsPill}>Developer Docs</span>
        </div>
        <div className={styles.searchWrap}>
          <SearchIcon size={15} />
          <input
            ref={searchRef}
            className={styles.search}
            placeholder="Search docs…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className={styles.kbd}>⌘K</span>
        </div>
        <nav className={styles.topNav}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/settings">Settings</Link>
          <Link href="/dashboard" className={styles.openBtn}>Open app <ArrowRightIcon size={14} /></Link>
        </nav>
      </header>

      <div className={styles.shell}>
        {/* Left nav */}
        <aside className={styles.leftnav}>
          {filteredNav.map(g => (
            <div key={g.group} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{g.group}</div>
              {g.items.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={jumpTo(item.id)}
                  className={`${styles.navItem} ${active === item.id ? styles.navItemActive : ''}`}
                  aria-current={active === item.id ? 'true' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
          {filteredNav.length === 0 && <p className={styles.navEmpty}>No matches.</p>}
        </aside>

        {/* Content */}
        <main className={styles.content}>
          {/* Hero */}
          <div className={styles.hero}>
            <span className={styles.eyebrow}>Developer documentation</span>
            <h1 className={styles.heroTitle}>Pentest your app in minutes.</h1>
            <p className={styles.lead}>
              One API call starts an autonomous pentest. Poll it for live agent
              activity and findings, each with a proof of concept and a ready-to-merge fix.
            </p>
            <div className={styles.cards}>
              {CARDS.map(c => (
                <a key={c.id} href={`#${c.id}`} onClick={jumpTo(c.id)} className={styles.card}>
                  <span className={styles.cardIcon}>{c.icon}</span>
                  <span className={styles.cardTitle}>{c.title}</span>
                  <span className={styles.cardDesc}>{c.desc}</span>
                </a>
              ))}
            </div>
            <div className={styles.callout}>
              <CheckIcon size={16} />
              <span>
                <strong>Live dashboard:</strong> configure, launch and watch scans visually in the{' '}
                <Link href="/dashboard">RedSuture dashboard</Link> — no code required.
              </span>
            </div>
          </div>

          {/* Quickstart */}
          <section id="quickstart" className={styles.section}>
            <h2>Quickstart</h2>
            <p>Make sure Docker is running and your environment is set, then start a scan and poll it.</p>
            <h3>1. Configure</h3>
            <CodeBlock lang="bash" code={`# .env.local
RS_MODEL=anthropic/claude-sonnet-4-6
RS_API_KEY=your-provider-api-key`} />
            <h3>2. Start a scan</h3>
            <CodeBlock lang="bash" code={`curl -X POST http://localhost:3333/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"targets":["https://api.example.com"],"targetType":"url","mode":"quick"}'
# → { "runId": "api-example-com_m1a2b3", "status": "running" }`} />
            <h3>3. Poll for progress &amp; findings</h3>
            <CodeBlock lang="bash" code={`curl "http://localhost:3333/api/scan/api-example-com_m1a2b3"`} />
            <div className={styles.warn}>
              Only scan assets you own or have explicit written permission to test. The engine actively attacks the target.
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className={styles.section}>
            <h2>Authentication</h2>
            <p>
              The API routes are currently <strong>unauthenticated</strong> — there is no
              server session or API key yet. In the browser, the app uses a client-side
              flag only to personalize and gate the UI; it does not protect the routes.
            </p>
            <div className={styles.note}>
              Before deploying publicly, add a session / API-key layer and protect{' '}
              <code>/api/scan*</code>.
            </div>
          </section>

          {/* Start a scan */}
          <section id="start-scan" className={styles.section}>
            <h2>Start a scan</h2>
            <Endpoint method="POST" path="/api/scan" />
            <p>Starts a pentest in the background and returns a <code>runId</code> immediately.</p>
            <h3>Body</h3>
            <Field name="targets" type="string[]" req>One or more targets. Blank entries are dropped.</Field>
            <Field name="target" type="string">Single-target convenience; used if <code>targets</code> is empty.</Field>
            <Field name="targetType" type="string"><code>url</code> · <code>repo</code> · <code>dir</code> · <code>whitebox</code> · <code>list</code>. Default <code>url</code>.</Field>
            <Field name="mode" type="string"><code>quick</code> · <code>standard</code> · <code>deep</code>. Default <code>quick</code>.</Field>
            <Field name="llm" type="string">Primary model, LiteLLM format. Default <code>anthropic/claude-sonnet-4-6</code>. Fallbacks follow automatically.</Field>
            <Field name="instructions" type="string">Scope notes, credentials or focus passed to the engine.</Field>
            <Field name="schedule" type="string"><code>manual</code> · <code>weekly</code> · <code>monthly</code> · <code>daily</code> · <code>continuous</code>. Default <code>manual</code>.</Field>
            <h3>Example</h3>
            <CodeBlock lang="javascript" code={`const res = await fetch('/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targets: ['https://api.example.com'],
    targetType: 'url',
    mode: 'quick',
  }),
});
const { runId } = await res.json();`} />
          </section>

          {/* Poll a scan */}
          <section id="poll-scan" className={styles.section}>
            <h2>Poll a scan</h2>
            <Endpoint method="GET" path="/api/scan/:runId" />
            <p>Returns a live snapshot. The dashboard polls this every 2 seconds until <code>status</code> is <code>complete</code> or <code>error</code>.</p>
            <h3>Query</h3>
            <Field name="agent" type="string">When set to an agent id in the run, includes that agent&apos;s <code>steps</code>. Omit to skip the step read.</Field>
            <h3>Response</h3>
            <CodeBlock lang="json" code={`{
  "runId": "api-example-com_m1a2b3",
  "status": "running",            // running | complete | error
  "progress": 62,
  "findings": [ { "id", "title", "severity", "cvss", "endpoint", "poc", "patch" } ],
  "agents": [ { "id", "name", "status", "parentId", "task", "skills", "depth" } ],
  "activeAgents": 3,
  "steps": [ { "seq", "kind": "tool", "tool": "browser_navigate", "text": "..." } ],
  "counts": { "critical": 1, "high": 3 },
  "logs": [ "..." ]
}`} />
            <h3>Polling loop</h3>
            <CodeBlock lang="javascript" code={`const timer = setInterval(async () => {
  const data = await fetch(\`/api/scan/\${runId}\`).then(r => r.json());
  render(data.agents, data.findings, data.progress);
  if (data.status === 'complete' || data.status === 'error') clearInterval(timer);
}, 2000);`} />
          </section>

          {/* List scans */}
          <section id="list-scans" className={styles.section}>
            <h2>List scans</h2>
            <Endpoint method="GET" path="/api/scan" />
            <p>Returns every scan, newest first.</p>
            <CodeBlock lang="json" code={`{
  "scans": [
    { "runId": "...", "target": "https://api.example.com", "targetType": "url",
      "mode": "quick", "startedAt": "2026-10-09T10:00:00.000Z", "status": "complete" }
  ]
}`} />
          </section>

          {/* Agents & steps */}
          <section id="agents" className={styles.section}>
            <h2>Agents &amp; steps</h2>
            <p>
              RedSuture runs a graph of specialized agents (recon, exploitation, validation,
              remediation). The poll response includes the live <code>agents</code> tree;
              request one agent&apos;s <code>steps</code> to see exactly what it&apos;s doing.
            </p>
            <h3>Agent shape</h3>
            <CodeBlock lang="typescript" code={`interface Agent {
  id: string;
  name: string;              // "Recon", "Exploitation", ...
  status: string;            // running | waiting | completed | failed | ...
  parentId: string | null;   // tree edges
  task: string | null;       // what it's doing right now
  skills: string[];          // ["bola", "sqli", "proxy"]
  depth: number;             // indentation in the tree
}`} />
            <h3>Fetch an agent&apos;s steps</h3>
            <CodeBlock lang="bash" code={`curl "http://localhost:3333/api/scan/<runId>?agent=exploit"
# steps: [ { kind: "message" | "tool" | "output", tool?, role?, text } ]`} />
            <div className={styles.note}>
              Steps come from the engine&apos;s database and require <strong>Node 22.5+</strong>{' '}
              (built-in <code>node:sqlite</code>). On older Node the agent tree still works; steps come back empty.
            </div>
          </section>

          {/* Fix PR */}
          <section id="github-pr" className={styles.section}>
            <h2>Open a fix PR</h2>
            <Endpoint method="POST" path="/api/github/pr" />
            <p>Builds a pull-request payload for a finding&apos;s patch.</p>
            <div className={styles.warn}>
              <strong>Stub.</strong> This route constructs and returns the payload but does
              not call the GitHub API — no branch or PR is created. Wire it to Octokit with a token to make it real.
            </div>
            <h3>Body</h3>
            <Field name="repoUrl" type="string" req><code>https://github.com/owner/repo</code> or <code>owner/repo</code>.</Field>
            <Field name="targetBranch" type="string">Default <code>main</code>.</Field>
            <Field name="vulnId" type="string">Used in the generated branch name.</Field>
            <Field name="vulnTitle" type="string">Used in the PR title.</Field>
            <Field name="patchDiff" type="string">The patch to attach.</Field>
          </section>

          {/* Models */}
          <section id="models" className={styles.section}>
            <h2>Models &amp; environment</h2>
            <p>The engine reaches 100+ model providers. Set the primary model and key, and an optional fallback chain.</p>
            <CodeBlock lang="bash" code={`# Primary model (LiteLLM format) and its key
RS_MODEL=anthropic/claude-sonnet-4-6
RS_API_KEY=your-provider-api-key

# Optional: comma-separated backup models, tried in order on provider failure.
# Unset → anthropic/claude-sonnet-4-6 → openai/gpt-5.4 → openrouter/z-ai/glm-5.3
RS_MODEL_FALLBACKS=openai/gpt-5.4,openrouter/z-ai/glm-5.3

# Optional: path to the engine binary
RS_ENGINE_BIN=`} />
            <p>Each scan tries the requested model first, then each fallback — every attempt is a real scan. Pass <code>llm</code> on the request to override the primary per scan.</p>
          </section>

          {/* Engine */}
          <section id="engine" className={styles.section}>
            <h2>Scan engine</h2>
            <p>
              Each scan runs RedSuture&apos;s autonomous engine in an isolated workspace.
              The engine writes its results to a per-run directory that the poll route
              reads back.
            </p>
            <ul className={styles.list}>
              <li>Every run produces SARIF 2.1.0 findings, a live agent graph, a per-agent step stream, and logs.</li>
              <li>A run with no findings and a run with findings are both successful completions.</li>
              <li>If the engine is unavailable or every model fails, the run is marked <code>error</code> — never a fabricated result.</li>
              <li>Run output stays on your machine and is git-ignored.</li>
            </ul>
          </section>
        </main>

        {/* Right TOC */}
        <aside className={styles.toc}>
          <div className={styles.tocLabel}>On this page</div>
          <ul className={styles.tocList}>
            {TOC.map(t => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  onClick={jumpTo(t.id)}
                  className={active === t.id ? styles.tocActive : ''}
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
