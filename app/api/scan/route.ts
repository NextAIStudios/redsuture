import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const STRIX_BIN = process.env.STRIX_BIN || path.join(os.homedir(), '.strix/bin/strix');
const RUNS_DIR = path.join(process.cwd(), 'strix_runs');

export async function POST(request: Request) {
  try {
    const { target, mode = 'quick', llm = 'anthropic/claude-sonnet-4-6', instructions } = await request.json();

    if (!target) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 });
    }

    // Ensure runs directory exists
    if (!fs.existsSync(RUNS_DIR)) {
      fs.mkdirSync(RUNS_DIR, { recursive: true });
    }

    // Generate a unique run name
    const hostname = new URL(target).hostname.replace(/\./g, '-');
    const runId = `${hostname}_${Date.now().toString(36)}`;

    const args = [
      '--target', target,
      '--scan-mode', mode,
      '--output', path.join(RUNS_DIR, runId),
      '-n', // non-interactive
    ];

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
      target,
      mode,
      llm,
      pid: child.pid,
      startedAt: new Date().toISOString(),
      status: 'running',
    }));

    return NextResponse.json({ runId, pid: child.pid, status: 'running' });
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
