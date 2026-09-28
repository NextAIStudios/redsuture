import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const STRIX_BIN = process.env.STRIX_BIN || path.join(os.homedir(), '.strix/bin/strix');
const RUNS_DIR = path.join(process.cwd(), 'strix_runs');

export async function POST(request: Request) {
  try {
    const {
      target,
      targets,
      targetType = 'url',
      mode = 'quick',
      llm = 'anthropic/claude-sonnet-4-6',
      instructions
    } = await request.json();

    const finalTargets: string[] = [];
    if (Array.isArray(targets) && targets.length > 0) {
      finalTargets.push(...targets.filter((t: string) => Boolean(t && t.trim())));
    } else if (target && typeof target === 'string') {
      finalTargets.push(target.trim());
    }

    if (finalTargets.length === 0) {
      return NextResponse.json({ error: 'At least one target (URL, Repo, Directory, or Target list) is required' }, { status: 400 });
    }

    // Ensure runs directory exists
    if (!fs.existsSync(RUNS_DIR)) {
      fs.mkdirSync(RUNS_DIR, { recursive: true });
    }

    // Generate a safe unique run name based on first target
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

    const args: string[] = [];

    if (targetType === 'list') {
      // Targets list file
      args.push('--target-list', finalTargets[0]);
    } else {
      // Support single or multiple -t / --target inputs (for whitebox or multiple target types)
      finalTargets.forEach(t => {
        args.push('--target', t);
      });
    }

    args.push(
      '--scan-mode', mode,
      '--output', runOutput,
      '-n', // non-interactive mode
    );

    if (instructions) {
      args.push('--instructions', instructions);
    }

    const env = {
      ...process.env,
      STRIX_LLM: llm,
      LLM_API_KEY: process.env.LLM_API_KEY || '',
      PATH: `${path.join(os.homedir(), '.strix/bin')}:${process.env.PATH}`,
    };

    // Spawn strix in background
    const child = spawn(STRIX_BIN, args, {
      env,
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    // Save metadata
    const metaPath = path.join(RUNS_DIR, `${runId}.meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify({
      runId,
      target: finalTargets.join(', '),
      targets: finalTargets,
      targetType,
      mode,
      llm,
      pid: child.pid,
      startedAt: new Date().toISOString(),
      status: 'running',
    }));

    return NextResponse.json({ runId, pid: child.pid, status: 'running', targets: finalTargets });
  } catch (err: any) {
    console.error('[scan/start]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // List all scans
  try {
    if (!fs.existsSync(RUNS_DIR)) return NextResponse.json({ scans: [] });

    const entries = fs.readdirSync(RUNS_DIR);
    const metas = entries
      .filter(f => f.endsWith('.meta.json'))
      .map(f => {
        try {
          const meta = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, f), 'utf8'));
          const runDir = path.join(RUNS_DIR, meta.runId);
          // Check if scan is done by looking for findings.sarif
          if (fs.existsSync(path.join(runDir, 'findings.sarif'))) {
            meta.status = 'complete';
          }
          return meta;
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return NextResponse.json({ scans: metas });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
