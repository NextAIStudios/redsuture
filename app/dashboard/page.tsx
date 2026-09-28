'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

const MOCK_SCANS = [
  {
    id: 'scan-001',
    target: 'https://myapp.com',
    status: 'complete',
    date: '2024-09-28',
    duration: '4m 12s',
    critical: 2,
    high: 5,
    medium: 3,
    low: 7,
    score: 42,
  },
  {
    id: 'scan-002',
    target: 'https://api.myapp.com',
    status: 'complete',
    date: '2024-09-27',
    duration: '6m 38s',
    critical: 0,
    high: 2,
    medium: 8,
    low: 4,
    score: 71,
  },
  {
    id: 'scan-003',
    target: 'https://staging.myapp.com',
    status: 'complete',
    date: '2024-09-25',
    duration: '3m 55s',
    critical: 1,
    high: 3,
    medium: 2,
    low: 1,
    score: 55,
  },
];

const MOCK_VULNS = [
  { id: 'v1', title: 'SQL Injection in /api/users', severity: 'critical', cvss: 9.8, type: 'Injection', endpoint: 'GET /api/users?id=', status: 'open', poc: "' OR 1=1--" },
  { id: 'v2', title: 'Stored XSS in comment field', severity: 'critical', cvss: 9.1, type: 'XSS', endpoint: 'POST /api/comments', status: 'open', poc: '<script>alert(document.cookie)</script>' },
  { id: 'v3', title: 'JWT algorithm confusion attack', severity: 'high', cvss: 8.2, type: 'Auth', endpoint: 'POST /api/auth/login', status: 'open', poc: 'alg: none bypass' },
  { id: 'v4', title: 'IDOR in user profile endpoint', severity: 'high', cvss: 7.5, type: 'Access Control', endpoint: 'GET /api/profile/:id', status: 'open', poc: 'Change :id to any user ID' },
  { id: 'v5', title: 'Missing rate limiting on login', severity: 'high', cvss: 7.3, type: 'Auth', endpoint: 'POST /api/auth/login', status: 'open', poc: '1000 requests/min allowed' },
  { id: 'v6', title: 'Reflected XSS in search param', severity: 'medium', cvss: 6.1, type: 'XSS', endpoint: 'GET /search?q=', status: 'fixed', poc: '<img src=x onerror=alert(1)>' },
  { id: 'v7', title: 'Sensitive data in error messages', severity: 'medium', cvss: 5.3, type: 'Info Disclosure', endpoint: 'Multiple', status: 'open', poc: 'Stack traces exposed in 500 errors' },
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

const SCAN_PHASES = [
  { phase: 'Initializing AI agents...', progress: 5 },
  { phase: 'Recon & Surface Mapping Agent — active', progress: 15 },
  { phase: 'Crawling endpoints...', progress: 25 },
  { phase: 'Fingerprinting technologies...', progress: 35 },
  { phase: 'Exploitation Agent — active', progress: 45 },
  { phase: 'Testing injection vectors...', progress: 55 },
  { phase: 'Testing authentication flows...', progress: 65 },
  { phase: 'Validation Agent — verifying findings...', progress: 75 },
  { phase: 'Generating PoC exploits...', progress: 85 },
  { phase: 'Compiling report...', progress: 95 },
  { phase: 'Scan complete', progress: 100 },
];

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
  const [scanMode, setScanMode] = useState<'quick' | 'standard' | 'deep'>('quick');
  const [instructions, setInstructions] = useState('');

  // GitHub PR Integration
  const [githubRepoUrl, setGithubRepoUrl] = useState('https://github.com/acme-corp/api-gateway');
  const [githubTargetBranch, setGithubTargetBranch] = useState('main');
  const [autoPrEnabled, setAutoPrEnabled] = useState(true);
  const [prStatuses, setPrStatuses] = useState<Record<string, { status: 'idle' | 'pushing' | 'created'; prUrl?: string; prNumber?: number; branch?: string }>>({});
  const [generatedPatches, setGeneratedPatches] = useState<Record<string, string>>({
    v1: `--- a/src/controllers/userController.ts\n+++ b/src/controllers/userController.ts\n@@ -12,4 +12,4 @@\n- const user = await db.raw("SELECT * FROM users WHERE id = '" + req.query.id + "'");\n+ const user = await db('users').where({ id: req.query.id }).first();`,
    v2: `--- a/src/components/CommentView.tsx\n+++ b/src/components/CommentView.tsx\n@@ -8,3 +8,3 @@\n- <div dangerouslySetInnerHTML={{ __html: comment.body }} />\n+ <div>{DOMPurify.sanitize(comment.body)}</div>`,
    v3: `--- a/src/middleware/auth.ts\n+++ b/src/middleware/auth.ts\n@@ -15,4 +15,4 @@\n- const decoded = jwt.decode(token, { algorithms: ['HS256', 'none'] });\n+ const decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['RS256'] });`,
  });

  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle', phase: '', progress: 0, messages: [], findings: 0, tokens: 0,
  });
  const [selectedScan, setSelectedScan] = useState(MOCK_SCANS[0]);
  const [selectedVuln, setSelectedVuln] = useState<typeof MOCK_VULNS[0] | null>(MOCK_VULNS[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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
        // Load real findings
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
      phase: 'Launching Strix autonomous agents...',
      progress: 5,
      messages: [
        `[CONFIG] Target Architecture: ${targetType.toUpperCase()}`,
        `[CONFIG] Scope: ${targets.join(', ')}`,
        `[GITHUB] Auto-PR Destination: ${githubRepoUrl} (${githubTargetBranch})`,
        `[AGENT] Initializing sandbox & LLM orchestrator...`,
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
          instructions: instructions || undefined,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setScanProgress(prev => ({ ...prev, status: 'error', phase: `Error: ${data.error}` }));
        return;
      }

      setActiveRunId(data.runId);
      // Poll every 5 seconds for live updates
      pollRef.current = setInterval(() => pollScan(data.runId), 5000);
    } catch (e: any) {
      setScanProgress(prev => ({ ...prev, status: 'error', phase: `Failed: ${e.message}` }));
    }
  };

  const handlePushToGithub = async (vuln: typeof MOCK_VULNS[0]) => {
    setPrStatuses(prev => ({ ...prev, [vuln.id]: { status: 'pushing' } }));
    
    try {
      const patch = generatedPatches[vuln.id] || `// SutureEngine auto-fix for ${vuln.title}\n// Enforced strict type sanitization & boundary checking`;
      const res = await fetch('/api/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: githubRepoUrl,
          targetBranch: githubTargetBranch,
          vulnId: vuln.id,
          vulnTitle: vuln.title,
          patchDiff: patch,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPrStatuses(prev => ({
          ...prev,
          [vuln.id]: {
            status: 'created',
            prUrl: data.prUrl,
            prNumber: data.prNumber,
            branch: data.branch,
          },
        }));
      }
    } catch (err) {
      setPrStatuses(prev => ({ ...prev, [vuln.id]: { status: 'idle' } }));
    }
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

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
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            {!sidebarCollapsed && <span>RedSuture</span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {[
            { id: 'overview', icon: '◈', label: 'Overview' },
            { id: 'new-scan', icon: '⊕', label: 'New Scan' },
            { id: 'findings', icon: '⚠', label: 'Findings' },
            { id: 'history', icon: '⊙', label: 'History' },
          ].map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
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
                  <span>Scan running</span>
                  <span>{scanProgress.progress}%</span>
                </div>
              )}
            </div>
          )}
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>DM</div>
            {!sidebarCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>David Muindi</span>
                <span className={styles.userPlan}>Pro Plan</span>
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
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'new-scan' && 'New Security Scan'}
              {activeTab === 'findings' && 'Vulnerability Findings'}
              {activeTab === 'history' && 'Scan History'}
            </h1>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.usageBadge}>
              <span>7 / 50 scans</span>
              <div className={styles.usageBar}><div className={styles.usageBarFill} style={{ width: '14%' }} /></div>
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('new-scan')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              + New Scan
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
                  { label: 'Total Scans', value: '7', icon: '⊙', color: 'var(--text-primary)' },
                  { label: 'Critical Vulns', value: '3', icon: '🔴', color: 'var(--red-bright)' },
                  { label: 'High Vulns', value: '10', icon: '🟠', color: 'var(--orange)' },
                  { label: 'Fixed Issues', value: '12', icon: '✓', color: 'var(--green)' },
                ].map((s, i) => (
                  <div key={i} className={styles.statCard}>
                    <div className={styles.statIcon}>{s.icon}</div>
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
                      {scanProgress.status === 'running' && <><div className={styles.liveDot} /><span>Live Scan</span></>}
                      {scanProgress.status === 'complete' && <><span style={{ color: 'var(--green)' }}>✓</span><span style={{ color: 'var(--green)' }}>Scan Complete</span></>}
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
                        <span className={`${styles.logMsg} ${msg.includes('Agent') ? styles.logAgent : msg.includes('complete') ? styles.logSuccess : ''}`}>
                          {msg.split(']')[1]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.scanMeta}>
                    <span>🔍 {scanProgress.findings} findings</span>
                    <span>📊 {(scanProgress.tokens / 1000).toFixed(0)}K tokens</span>
                    <span>💰 ~${(scanProgress.tokens * 0.000003).toFixed(2)} cost</span>
                  </div>
                </div>
              )}

              {/* Recent scans */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Scans</h2>
                  <button className="btn-ghost" onClick={() => setActiveTab('history')} style={{ fontSize: '0.8rem' }}>View all →</button>
                </div>
                <div className={styles.scanList}>
                  {MOCK_SCANS.map(scan => (
                    <div key={scan.id} className={styles.scanRow} onClick={() => { setSelectedScan(scan); setActiveTab('findings'); }}>
                      <div className={styles.scanTarget}>
                        <div className={styles.scanTargetIcon}>🌐</div>
                        <div>
                          <div className={styles.scanTargetUrl}>{scan.target}</div>
                          <div className={styles.scanDate}>{scan.date} · {scan.duration}</div>
                        </div>
                      </div>
                      <div className={styles.scanBadges}>
                        {scan.critical > 0 && <span className="badge badge-red">{scan.critical} Critical</span>}
                        {scan.high > 0 && <span className="badge badge-orange">{scan.high} High</span>}
                        {scan.medium > 0 && <span className="badge badge-yellow">{scan.medium} Med</span>}
                      </div>
                      <div className={styles.scanScore} style={{ color: scoreColor(scan.score) }}>
                        {scan.score}/100
                      </div>
                      <button className="btn-ghost" style={{ fontSize: '0.8rem' }}>Details →</button>
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
                  <p className={styles.formSectionDesc}>RedSuture supports five Strix autonomous ingestion modes for multi-surface penetration testing.</p>
                </div>

                <div className={styles.targetGrid}>
                  {[
                    {
                      id: 'live-url',
                      label: 'Live Web Application',
                      badge: 'Black-box / DAST',
                      desc: 'Scan production or staging URLs, SPAs, and client-side web apps.',
                      example: 'strix --target https://your-app.com',
                    },
                    {
                      id: 'github-repo',
                      label: 'GitHub / GitLab Repo',
                      badge: 'Source Code / SAST+DAST',
                      desc: 'Scan remote Git repositories, pull requests, and backend logic.',
                      example: 'strix --target https://github.com/org/repo',
                    },
                    {
                      id: 'local-dir',
                      label: 'Local Codebase Directory',
                      badge: 'Local Workspace',
                      desc: 'Run Strix agents directly against local application directories.',
                      example: 'strix --target ./app-directory',
                    },
                    {
                      id: 'whitebox',
                      label: 'White-Box Multi-Target',
                      badge: 'Source + Live URL',
                      desc: 'Correlate live running web endpoints with repository source code.',
                      example: 'strix -t https://github.com/org/repo -t https://your-app.com',
                    },
                    {
                      id: 'target-list',
                      label: 'Bulk Target List',
                      badge: 'Enterprise Scope List',
                      desc: 'Batch scan multiple hosts, APIs, and microservices from a list.',
                      example: 'strix --target-list ./targets.txt',
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
                      <code className={styles.targetCardCmd}>{t.example}</code>
                    </button>
                  ))}
                </div>

                {/* DYNAMIC INPUTS BASED ON SELECTED TARGET TYPE */}
                <div className={styles.targetInputContainer}>
                  {scanType === 'live-url' && (
                    <div className={styles.targetInputGroup}>
                      <label className={styles.inputLabel}>
                        Live Application Endpoint
                        <span className={styles.inputHint}>Full HTTP/HTTPS address to target</span>
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
                        <span className={styles.inputHint}>GitHub, GitLab, or Bitbucket HTTPS repository link</span>
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
                        Local Application Path
                        <span className={styles.inputHint}>Relative or absolute path mounted in runner sandbox</span>
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
                        Target List Entries
                        <span className={styles.inputHint}>One target per non-empty line (URLs, repos, or hostnames)</span>
                      </label>
                      <textarea
                        className={styles.targetListArea}
                        rows={6}
                        placeholder={`https://api.acme.com\nhttps://auth.acme.com\nhttps://github.com/acme/billing\n# Internal QA domain\nhttps://qa-cluster.acme.internal`}
                        value={targetListContent}
                        onChange={e => setTargetListContent(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.optionsGrid}>
                  <div className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>Scan Depth Mode</span>
                      <span className={styles.modeBadge}>{scanMode.toUpperCase()}</span>
                    </div>
                    <div className={styles.radioGroup}>
                      {[
                        { value: 'quick', label: 'Quick Scan', desc: 'Standard OWASP surface & rapid fuzzing (~5m)' },
                        { value: 'standard', label: 'Standard Pentest', desc: 'Full authentication, injection & API mapping (~15m)' },
                        { value: 'deep', label: 'Deep Autonomous Audit', desc: 'Complex multi-step exploit chains & whitebox analysis (~45m)' },
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

                  <div className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>GitHub PR Remediation Destination</span>
                      <span className={styles.githubBadge}>Auto-PR Ready</span>
                    </div>
                    <div className={styles.githubFormGroup}>
                      <div className={styles.subInputWrap}>
                        <label className={styles.subLabel}>Target Repository for Auto-PRs</label>
                        <input
                          type="text"
                          className={styles.subInput}
                          placeholder="https://github.com/client-org/backend-service"
                          value={githubRepoUrl}
                          onChange={e => setGithubRepoUrl(e.target.value)}
                        />
                      </div>
                      <div className={styles.subInputWrap}>
                        <label className={styles.subLabel}>Base Branch</label>
                        <input
                          type="text"
                          className={styles.subInput}
                          placeholder="main"
                          value={githubTargetBranch}
                          onChange={e => setGithubTargetBranch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.optionCard} style={{ width: '100%' }}>
                  <div className={styles.optionHeader}>
                    <span className={styles.optionLabel}>Custom Agent Directives (Optional)</span>
                    <span className={styles.inputHint}>Tailor attack scope or credentials</span>
                  </div>
                  <textarea
                    className={styles.instructionField}
                    placeholder={'Focus on OAuth tokens and BOLA parameter tampering on /api/v2 endpoints.\nSimulate standard role vs admin escalation.'}
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className={styles.scanActions}>
                  <div className={styles.costEstimate}>
                    <span>Target Type:</span>
                    <span className={styles.costAmount}>{scanType.toUpperCase()}</span>
                    <span className={styles.costNote}>— Auto-fix PRs target {githubRepoUrl.replace('https://github.com/', '')}</span>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={startScan}
                    disabled={scanProgress.status === 'running'}
                    style={{ padding: '14px 32px', fontSize: '0.95rem' }}
                  >
                    {scanProgress.status === 'running' ? 'Scan In Progress...' : 'Launch Strix Managed Scan'}
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
                  <span className={styles.findingsDate}>{selectedScan.date} · Strix AI Managed Pentest</span>
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className={`badge ${severityBadge(v.severity)}`} style={{ fontSize: '0.7rem' }}>
                          {v.severity.toUpperCase()}
                        </div>
                        {prStatuses[v.id]?.status === 'created' && (
                          <span className={styles.prBadge}>PR #{prStatuses[v.id]?.prNumber}</span>
                        )}
                      </div>
                      <div className={styles.vulnTitle}>{v.title}</div>
                      <div className={styles.vulnMeta}>
                        <span className={styles.vulnEndpoint}>{v.endpoint}</span>
                        <span className={styles.cvssScore}>CVSS {v.cvss}</span>
                      </div>
                      {v.status === 'fixed' && <span className="badge badge-green" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Remediated</span>}
                    </div>
                  ))}
                </div>

                {selectedVuln ? (
                  <div className={styles.vulnDetail}>
                    <div className={styles.vulnDetailHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="badge badge-red" style={{ fontSize: '0.75rem' }}>{selectedVuln.severity.toUpperCase()} · CVSS {selectedVuln.cvss}</div>
                        {prStatuses[selectedVuln.id]?.status === 'created' && (
                          <a
                            href={prStatuses[selectedVuln.id]?.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.prLinkBadge}
                          >
                            GitHub PR #{prStatuses[selectedVuln.id]?.prNumber} Opened ↗
                          </a>
                        )}
                      </div>
                      <h2 className={styles.vulnDetailTitle}>{selectedVuln.title}</h2>
                      <div className={styles.vulnDetailMeta}>
                        <span>Vulnerability Category: {selectedVuln.type}</span>
                        <span>Target Handler / Endpoint: <code className={styles.code}>{selectedVuln.endpoint}</code></span>
                      </div>
                    </div>

                    {prStatuses[selectedVuln.id]?.status === 'created' && (
                      <div className={styles.prSuccessBanner}>
                        <div className={styles.prSuccessHeader}>
                          <span className={styles.prCheckIcon}>✓</span>
                          <strong>Remediation Pull Request Successfully Pushed to GitHub!</strong>
                        </div>
                        <p className={styles.prSuccessText}>
                          Branch <code>{prStatuses[selectedVuln.id]?.branch}</code> was pushed to <code>{githubRepoUrl}</code>.
                        </p>
                        <a
                          href={prStatuses[selectedVuln.id]?.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '6px 14px', width: 'fit-content' }}
                        >
                          Review &amp; Merge PR on GitHub ↗
                        </a>
                      </div>
                    )}

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>Verified Proof-of-Concept Exploit</h3>
                      <div className={styles.pocBox}>
                        <code>{selectedVuln.poc}</code>
                      </div>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>Technical Impact &amp; Findings Description</h3>
                      <p className={styles.vulnDesc}>
                        The autonomous Strix pentest agent confirmed this exploit vector by actively bypassing validation on <code className={styles.code}>{selectedVuln.endpoint}</code> in an isolated runtime sandbox. No false positives—finding is fully reproducible.
                      </p>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>SutureEngine Generated Code Patch</h3>
                      <div className={styles.patchDiffBox}>
                        <pre className={styles.patchPre}>
                          {generatedPatches[selectedVuln.id] || `// SutureEngine auto-fix for ${selectedVuln.title}\n// Enforce strict authorization checks & parameterized query`}
                        </pre>
                      </div>
                    </div>

                    <div className={styles.vulnActions}>
                      <button
                        className="btn-primary"
                        onClick={() => handlePushToGithub(selectedVuln)}
                        disabled={prStatuses[selectedVuln.id]?.status === 'pushing'}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {prStatuses[selectedVuln.id]?.status === 'pushing'
                          ? 'Pushing Branch to GitHub...'
                          : prStatuses[selectedVuln.id]?.status === 'created'
                          ? 'Push Updated PR to GitHub'
                          : 'Push Fix to GitHub (Create PR)'}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          navigator.clipboard?.writeText(generatedPatches[selectedVuln.id] || '');
                          alert('Patch diff copied to clipboard!');
                        }}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Copy Patch Diff
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
                  <span>Target</span>
                  <span>Date</span>
                  <span>Duration</span>
                  <span>Critical</span>
                  <span>High</span>
                  <span>Score</span>
                  <span></span>
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
                      View →
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
