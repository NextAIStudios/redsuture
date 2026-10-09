import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { runScan } from './engine';

const RUNS_DIR = path.join(process.cwd(), 'scan_runs');

interface ScanMeta {
  runId: string;
  startedAt: string;
  status: string;
  target?: string;
  targets?: string[];
  targetType?: string;
  mode?: string;
  llm?: string;
  [key: string]: unknown;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export async function POST(request: Request) {
  try {
    const {
      target,
      targets,
      targetType = 'url',
      mode = 'quick',
      llm = process.env.RS_MODEL || 'anthropic/claude-sonnet-4-6',
      instructions,
    } = await request.json();

    const finalTargets: string[] = [];
    if (Array.isArray(targets) && targets.length > 0) {
      finalTargets.push(...targets.filter((t: string) => Boolean(t && t.trim())));
    } else if (target && typeof target === 'string') {
      finalTargets.push(target.trim());
    }

    if (finalTargets.length === 0) {
      return NextResponse.json(
        { error: 'At least one target (URL, repo, directory, or target list) is required' },
        { status: 400 },
      );
    }

    if (!fs.existsSync(RUNS_DIR)) {
      fs.mkdirSync(RUNS_DIR, { recursive: true });
    }

    // Build a safe, unique run id from the first target.
    let primaryHost = 'scan';
    try {
      if (finalTargets[0].startsWith('http://') || finalTargets[0].startsWith('https://')) {
        primaryHost = new URL(finalTargets[0]).hostname.replace(/[^a-zA-Z0-9-]/g, '-');
      } else {
        primaryHost = path.basename(finalTargets[0]).replace(/[^a-zA-Z0-9-]/g, '-');
      }
    } catch {
      primaryHost = 'target';
    }

    const runId = `${primaryHost || 'target'}_${Date.now().toString(36)}`;
    const runOutput = path.join(RUNS_DIR, runId);
    fs.mkdirSync(runOutput, { recursive: true });

    const metaPath = path.join(RUNS_DIR, `${runId}.meta.json`);
    const initialMeta: ScanMeta = {
      runId,
      target: finalTargets.join(', '),
      targets: finalTargets,
      targetType,
      mode,
      llm,
      startedAt: new Date().toISOString(),
      status: 'running',
    };
    fs.writeFileSync(metaPath, JSON.stringify(initialMeta, null, 2));

    // Launch the scan in the background. The engine handles model
    // fallback and honest error reporting; progress is read via GET /api/scan/<runId>.
    runScan({
      runId,
      targets: finalTargets,
      targetType,
      mode,
      llm,
      instructions,
      runDir: runOutput,
    }).catch(e => console.error('[scan/engine-error]', e));

    return NextResponse.json({ runId, status: 'running', targets: finalTargets });
  } catch (err) {
    console.error('[scan/start]', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(RUNS_DIR)) return NextResponse.json({ scans: [] });

    const entries = fs.readdirSync(RUNS_DIR);
    const metas = entries
      .filter(f => f.endsWith('.meta.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(RUNS_DIR, f), 'utf8')) as ScanMeta;
        } catch {
          return null;
        }
      })
      .filter((meta): meta is ScanMeta => meta !== null)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return NextResponse.json({ scans: metas });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
