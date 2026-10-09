import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ScanParams {
  runId: string;
  targets: string[];
  targetType: string; // 'url' | 'repo' | 'dir' | 'whitebox' | 'list'
  mode: 'quick' | 'standard' | 'deep';
  llm: string; // requested primary model (LiteLLM format)
  instructions?: string;
  runDir: string; // the isolated working directory for this scan
}

// Backup models, in LiteLLM format. The model requested for the scan is tried
// first; if its provider fails, the engine is re-run against each of these in
// turn. Override with RS_MODEL_FALLBACKS (a comma-separated list).
const DEFAULT_FALLBACK_MODELS = [
  'anthropic/claude-sonnet-4-6',
  'openai/gpt-5.4',
  'openrouter/z-ai/glm-5.3',
];

// Engine exit codes for a successful run: 0 (no findings) or 2 (findings were
// reported). Anything else is a genuine failure worth a model fallback.
const ENGINE_SUCCESS_CODES = new Set([0, 2]);

function resolveModelChain(primary: string): string[] {
  const configured = process.env.RS_MODEL_FALLBACKS || process.env.STRIX_LLM_FALLBACKS;
  const fallbacks = configured
    ? configured.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_FALLBACK_MODELS;
  return [...new Set([primary, ...fallbacks].filter(Boolean))];
}

function resolveApiKey(): string {
  return (
    process.env.RS_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  );
}

function resolveEngineBin(): string | null {
  const explicit = process.env.RS_ENGINE_BIN || process.env.STRIX_BIN;
  if (explicit && fs.existsSync(/*turbopackIgnore: true*/ explicit)) return explicit;
  const home = path.join(os.homedir(), '.strix', 'bin', 'strix');
  if (fs.existsSync(/*turbopackIgnore: true*/ home)) return home;
  return null; // fall back to a PATH lookup of the engine
}

const ENGINE_HOME = path.join(os.homedir(), '.strix', 'bin');
const ENGINE_FALLBACK_COMMAND = 'strix';

function buildArgs(params: ScanParams): string[] {
  const { targets, targetType, mode, instructions } = params;
  const args: string[] = [];
  if (targetType === 'list') {
    args.push('--target-list', targets[0]);
  } else {
    targets.forEach(t => args.push('--target', t));
  }
  // `-n` runs headless (no TUI); `--scan-mode` sets depth.
  args.push('--scan-mode', mode, '-n');
  if (instructions) args.push('--instruction', instructions);
  return args;
}

// Run the engine once against a single model. Resolves with the process exit
// code, or -1 when the binary could not be launched at all (e.g. not installed).
function runEngineOnce(
  command: string,
  args: string[],
  model: string,
  cwd: string,
  logPath: string,
): Promise<number> {
  return new Promise(resolve => {
    const env = {
      ...process.env,
      STRIX_LLM: model,
      LLM_API_KEY: resolveApiKey(),
      PATH: `${ENGINE_HOME}:${process.env.PATH || ''}`,
    };

    let child;
    try {
      child = spawn(/*turbopackIgnore: true*/ command, args, { cwd, env });
    } catch {
      resolve(-1);
      return;
    }

    const out = fs.createWriteStream(logPath, { flags: 'a' });
    child.stdout?.pipe(out);
    child.stderr?.pipe(out);

    child.on('error', () => {
      out.end();
      resolve(-1);
    });
    child.on('close', code => {
      out.end();
      resolve(code ?? -1);
    });
  });
}

// Runs a real penetration test with RedSuture's engine. Results (findings,
// agent graph, logs) are written to a per-run directory that the status route
// resolves when polling. This never fabricates findings: if the engine is
// unavailable or every model fails, the run is marked as errored.
export async function runScan(params: ScanParams): Promise<void> {
  const { runId, targets, mode, runDir } = params;
  const metaPath = path.join(path.dirname(runDir), `${runId}.meta.json`);
  const logPath = path.join(runDir, 'engine.log');

  fs.mkdirSync(runDir, { recursive: true });

  const appendLog = (line: string) => {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
      fs.appendFileSync(logPath, `[${ts}] ${line}\n`);
    } catch {
      /* best-effort logging */
    }
  };

  const patchMeta = (patch: Record<string, unknown>) => {
    try {
      const meta = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        : {};
      fs.writeFileSync(metaPath, JSON.stringify({ ...meta, ...patch }, null, 2));
    } catch {
      /* best-effort metadata */
    }
  };

  const bin = resolveEngineBin();
  const command = bin || ENGINE_FALLBACK_COMMAND;
  const models = resolveModelChain(params.llm);
  const args = buildArgs(params);

  appendLog(`[orchestrator] Starting penetration test for: ${targets.join(', ')}`);
  appendLog(`[orchestrator] Scan mode: ${mode} | Model priority: ${models.join(' -> ')}`);

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    appendLog(`[orchestrator] Launching engine with model "${model}"`);
    patchMeta({ status: 'running', activeModel: model });

    const code = await runEngineOnce(command, args, model, runDir, logPath);

    if (ENGINE_SUCCESS_CODES.has(code)) {
      appendLog(`[orchestrator] Scan completed with "${model}" (exit ${code}).`);
      patchMeta({
        status: 'complete',
        activeModel: model,
        completedAt: new Date().toISOString(),
      });
      return;
    }

    if (code === -1 && !bin) {
      // The engine could not be launched and no install was found — no point
      // retrying other models, the failure is environmental.
      break;
    }

    const more = i < models.length - 1;
    appendLog(
      `[orchestrator] Model "${model}" failed (exit ${code}).` +
        (more ? ' Falling back to the next model…' : ' No more fallback models.'),
    );
  }

  if (!bin) {
    appendLog('[error] The scan engine is not available on this host. No scan was run.');
    patchMeta({ status: 'error', error: 'The scan engine is not available.' });
    return;
  }

  appendLog(
    '[error] Every configured model failed. Check the provider key / quota, ' +
      'that the runtime is available, and the target scope.',
  );
  patchMeta({ status: 'error', error: 'Scan failed for every configured model.' });
}
