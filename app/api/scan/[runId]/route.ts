import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const RUNS_DIR = path.join(process.cwd(), 'strix_runs');

function parseSarif(sarifPath: string) {
  try {
    const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf8'));
    const results = sarif?.runs?.[0]?.results || [];
    return results.map((r: any) => ({
      id: r.fingerprints?.['strix/v1'] || Math.random().toString(36),
      title: r.message?.text || 'Unknown',
      severity: r.properties?.severity || 'info',
      cvss: r.properties?.cvss || 0,
      type: r.ruleId || 'unknown',
      endpoint: r.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'N/A',
      status: 'open',
      description: r.properties?.description || '',
      remediation: r.properties?.remediation || '',
      poc: r.properties?.poc || '',
    }));
  } catch { return []; }
}

function parseRunJson(runJsonPath: string) {
  try {
    return JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
  } catch { return null; }
}

function tailLog(logPath: string, lines = 50): string[] {
  try {
    const content = fs.readFileSync(logPath, 'utf8');
    return content.split('\n').slice(-lines).filter(Boolean);
  } catch { return []; }
}

export async function GET(
  _request: Request,
  { params }: { params: { runId: string } }
) {
  const { runId } = params;
  const metaPath = path.join(RUNS_DIR, `${runId}.meta.json`);
  const runDir = path.join(RUNS_DIR, runId);

  if (!fs.existsSync(metaPath)) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const sarifPath = path.join(runDir, 'findings.sarif');
  const logPath = path.join(runDir, 'strix.log');
  const runJsonPath = path.join(runDir, 'run.json');
  const coveragePath = path.join(runDir, 'coverage.json');

  const isComplete = fs.existsSync(sarifPath);
  const findings = isComplete ? parseSarif(sarifPath) : [];
  const logs = tailLog(logPath);
  const runJson = parseRunJson(runJsonPath);

  // Count severities
  const counts = findings.reduce((acc: any, f: any) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  // Estimate progress from log
  let progress = 0;
  if (isComplete) {
    progress = 100;
  } else if (logs.length > 0) {
    const lastLine = logs[logs.length - 1];
    if (lastLine.includes('turn 1')) progress = 10;
    else if (lastLine.includes('turn 1')) progress = 15;
    else if (lastLine.includes('turn 2')) progress = 25;
    else if (lastLine.includes('turn 3')) progress = 35;
    else if (lastLine.includes('turn 4')) progress = 45;
    else if (lastLine.includes('turn 5')) progress = 55;
    else if (lastLine.includes('turn 6')) progress = 65;
    else if (lastLine.includes('turn 7')) progress = 75;
    else if (lastLine.includes('turn 8')) progress = 85;
    else progress = 20;
  }

  // Get cost/token info from run.json if available
  const tokenInfo = runJson?.usage || null;

  // Parse coverage
  let coverage = null;
  try {
    if (fs.existsSync(coveragePath)) {
      coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    }
  } catch {}

  return NextResponse.json({
    runId,
    ...meta,
    status: isComplete ? 'complete' : 'running',
    progress,
    findings,
    counts,
    logs: logs.slice(-30), // last 30 log lines
    tokenInfo,
    coverage,
    duration: isComplete
      ? `${Math.round((Date.now() - new Date(meta.startedAt).getTime()) / 1000 / 60)}m`
      : 'In progress',
  });
}
