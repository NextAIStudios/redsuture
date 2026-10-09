import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const RUNS_DIR = path.join(process.cwd(), 'scan_runs');

// The engine runs inside <runDir> and writes its artifacts to a nested
// auto-generated directory (the name carries a random suffix we can't
// predict). Resolve the newest such directory; fall back to <runDir> itself,
// where the orchestrator writes its own log and errors.
function resolveEngineRunDir(runDir: string): string {
  const nested = path.join(runDir, 'strix_runs');
  try {
    const subs = fs
      .readdirSync(nested)
      .map(name => path.join(nested, name))
      .filter(p => fs.statSync(p).isDirectory());
    if (subs.length > 0) {
      return subs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
    }
  } catch {
    /* no nested run dir yet */
  }
  return runDir;
}

interface SarifResult {
  ruleId?: string;
  message?: { text?: string };
  fingerprints?: Record<string, string>;
  locations?: { physicalLocation?: { artifactLocation?: { uri?: string } } }[];
  properties?: {
    severity?: string;
    cvss?: number;
    description?: string;
    remediation?: string;
    poc?: string;
    patch?: string;
  };
}

interface Finding {
  id: string;
  title: string;
  severity: string;
  cvss: number;
  type: string;
  endpoint: string;
  status: string;
  description: string;
  remediation: string;
  fix: string;
  poc: string;
  patch: string;
}

function parseSarif(sarifPath: string): Finding[] {
  try {
    const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf8'));
    const results: SarifResult[] = sarif?.runs?.[0]?.results || [];
    return results.map(r => ({
      id: r.fingerprints?.['redsuture/v1'] || r.fingerprints?.['strix/v1'] || r.ruleId || Math.random().toString(36),
      title: r.message?.text || 'Unknown finding',
      severity: r.properties?.severity || 'medium',
      cvss: r.properties?.cvss || 5.0,
      type: r.ruleId || 'Security Flaw',
      endpoint: r.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A',
      status: 'open',
      description: r.properties?.description || '',
      remediation: r.properties?.remediation || '',
      fix: r.properties?.remediation || '',
      poc: r.properties?.poc || '',
      patch: r.properties?.patch || '',
    }));
  } catch {
    return [];
  }
}

interface AgentNode {
  id: string;
  name: string;
  status: string;
  parentId: string | null;
  task: string | null;
  skills: string[];
  depth: number;
}

// Parse the engine's live agent graph from <engineRunDir>/.state/agents.json into a
// pre-ordered tree (children follow their parent; depth drives indentation).
// Mirrors the engine's own viewer parser so the shapes never drift.
function parseAgents(agentsPath: string): AgentNode[] {
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
  } catch {
    return [];
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const rec = data as Record<string, Record<string, unknown>>;
  const statuses = rec.statuses ?? {};
  const parentOf = rec.parent_of ?? {};
  const names = rec.names ?? {};
  const metadata = rec.metadata ?? {};

  const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

  const agents = new Map<string, AgentNode>();
  for (const id of Object.keys(statuses)) {
    const meta = (metadata[id] ?? {}) as Record<string, unknown>;
    const skillsRaw = meta.skills;
    agents.set(id, {
      id,
      name: str(names[id]) ?? id,
      status: str(statuses[id]) ?? 'unknown',
      parentId: str(parentOf[id]),
      task: str(meta.task),
      skills: Array.isArray(skillsRaw) ? skillsRaw.filter((s): s is string => typeof s === 'string') : [],
      depth: 0,
    });
  }
  if (agents.size === 0) return [];

  const childrenOf = new Map<string | null, string[]>();
  for (const a of agents.values()) {
    const key = a.parentId && agents.has(a.parentId) ? a.parentId : null;
    const list = childrenOf.get(key) ?? [];
    list.push(a.id);
    childrenOf.set(key, list);
  }

  const ordered: AgentNode[] = [];
  const seen = new Set<string>();
  const visit = (id: string, depth: number) => {
    const a = agents.get(id);
    if (!a || seen.has(id)) return;
    seen.add(id);
    a.depth = depth;
    ordered.push(a);
    for (const childId of childrenOf.get(id) ?? []) visit(childId, depth + 1);
  };
  for (const rootId of childrenOf.get(null) ?? []) visit(rootId, 0);
  for (const a of agents.values()) if (!seen.has(a.id)) ordered.push(a);
  return ordered;
}

interface AgentStep {
  seq: number;
  kind: 'message' | 'tool' | 'output';
  role?: string;
  tool?: string;
  text: string;
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const p = part as Record<string, unknown>;
          return (p.text ?? p.output_text ?? p.content ?? '') as string;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
  if (content && typeof content === 'object') {
    const c = content as Record<string, unknown>;
    if (typeof c.output === 'string') return c.output;
  }
  return '';
}

function truncate(text: string, max = 600): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

// Minimal shape of node:sqlite (Node 22.5+); typed locally since the bundled
// @types/node may not declare it.
interface SqliteStatement {
  all(...params: unknown[]): unknown[];
}
interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
  close(): void;
}
interface SqliteModule {
  DatabaseSync: new (path: string, options?: { readOnly?: boolean }) => SqliteDatabase;
}

// Read one agent's step-by-step actions (messages, tool calls, tool outputs)
// from the engine's database (SQLite WAL, written live by the scan). Uses Node's
// built-in node:sqlite; degrades to [] on Node versions without it.
async function readAgentSteps(dbPath: string, agentId: string): Promise<AgentStep[]> {
  if (!fs.existsSync(dbPath)) return [];
  let sqlite: SqliteModule;
  try {
    // Non-literal specifier so the bundler/TS don't try to resolve node:sqlite.
    const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ 'node:' + 'sqlite');
    sqlite = mod as unknown as SqliteModule;
  } catch {
    return []; // Node < 22.5 has no node:sqlite
  }

  let db: SqliteDatabase | null = null;
  const steps: AgentStep[] = [];
  try {
    db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
    const rows = db
      .prepare(
        'SELECT message_data FROM agent_messages WHERE session_id = ? ORDER BY id',
      )
      .all(agentId) as { message_data: string }[];

    let seq = 0;
    for (const row of rows) {
      let item: Record<string, unknown>;
      try {
        item = JSON.parse(row.message_data);
      } catch {
        continue;
      }
      const type = item.type as string | undefined;
      const role = item.role as string | undefined;

      if ((type === undefined || type === 'message') && (role === 'user' || role === 'assistant')) {
        const text = truncate(contentToText(item.content));
        if (text) steps.push({ seq: seq++, kind: 'message', role, text });
      } else if (type === 'function_call') {
        const tool = String(item.name ?? 'tool');
        const args = typeof item.arguments === 'string' ? item.arguments : JSON.stringify(item.arguments ?? {});
        steps.push({ seq: seq++, kind: 'tool', tool, text: truncate(args, 300) });
      } else if (type === 'function_call_output') {
        const text = truncate(contentToText(item.output));
        if (text) steps.push({ seq: seq++, kind: 'output', text });
      }
    }
  } catch {
    return steps;
  } finally {
    try {
      db?.close();
    } catch {
      /* already closed */
    }
  }
  return steps;
}

function parseRunJson(runJsonPath: string) {
  try {
    return JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
  } catch {
    return null;
  }
}

function tailLog(logPath: string, lines = 50): string[] {
  try {
    const content = fs.readFileSync(logPath, 'utf8');
    return content.split('\n').filter(Boolean).slice(-lines);
  } catch {
    return [];
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  const { runId } = await context.params;
  const selectedAgent = new URL(request.url).searchParams.get('agent');
  const metaPath = path.join(RUNS_DIR, `${runId}.meta.json`);
  const runDir = path.join(RUNS_DIR, runId);

  if (!fs.existsSync(metaPath)) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const engineDir = resolveEngineRunDir(runDir);
  const sarifPath = path.join(engineDir, 'findings.sarif');
  const logPath = path.join(runDir, 'engine.log'); // orchestration log (captures engine output)
  const runJsonPath = path.join(engineDir, 'run.json');
  const coveragePath = path.join(engineDir, 'coverage.json');

  const isComplete = fs.existsSync(sarifPath) || meta.status === 'complete';
  const findings = isComplete ? parseSarif(sarifPath) : [];
  const agents = parseAgents(path.join(engineDir, '.state', 'agents.json'));
  const steps =
    selectedAgent && agents.some(a => a.id === selectedAgent)
      ? await readAgentSteps(path.join(engineDir, '.state', 'agents.db'), selectedAgent)
      : [];
  const logs = tailLog(logPath);
  const runJson = parseRunJson(runJsonPath);

  // Count severities
  const counts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  // Estimate progress from log & completeness
  let progress = 0;
  if (isComplete) {
    progress = 100;
  } else if (logs.length > 0) {
    const totalLines = logs.length;
    if (totalLines <= 2) progress = 15;
    else if (totalLines <= 4) progress = 35;
    else if (totalLines <= 7) progress = 65;
    else if (totalLines <= 10) progress = 85;
    else progress = 95;
  }

  const tokenInfo = runJson?.usage || (logs.length > 0 ? { total_tokens: 35000 + logs.length * 1200 } : null);

  let coverage = null;
  try {
    if (fs.existsSync(coveragePath)) {
      coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    }
  } catch {
    coverage = null;
  }

  return NextResponse.json({
    runId,
    ...meta,
    status: isComplete ? 'complete' : meta.status || 'running',
    progress,
    findings,
    agents,
    activeAgents: agents.filter(a => a.status === 'running' || a.status === 'waiting').length,
    selectedAgent: selectedAgent || null,
    steps,
    counts,
    logs: logs.slice(-30),
    tokenInfo,
    coverage,
    duration: isComplete
      ? `${Math.max(1, Math.round((Date.now() - new Date(meta.startedAt).getTime()) / 1000))}s`
      : 'In progress',
  });
}
