import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const RUNS_DIR = path.join(process.cwd(), 'strix_runs');

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
  _request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  const { runId } = await context.params;
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

  const isComplete = fs.existsSync(sarifPath) || meta.status === 'complete';
  const findings = isComplete ? parseSarif(sarifPath) : [];
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
    counts,
    logs: logs.slice(-30),
    tokenInfo,
    coverage,
    duration: isComplete
      ? `${Math.max(1, Math.round((Date.now() - new Date(meta.startedAt).getTime()) / 1000))}s`
      : 'In progress',
  });
}
