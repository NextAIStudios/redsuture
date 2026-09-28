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
  const [scanTarget, setScanTarget] = useState('');
  const [scanType, setScanType] = useState<'url' | 'repo' | 'api'>('url');
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle', phase: '', progress: 0, messages: [], findings: 0, tokens: 0,
  });
  const [selectedScan, setSelectedScan] = useState(MOCK_SCANS[0]);
  const [selectedVuln, setSelectedVuln] = useState<typeof MOCK_VULNS[0] | null>(null);
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

  const startScan = async () => {
    if (!scanTarget || scanProgress.status === 'running') return;
    setScanProgress({ status: 'running', phase: 'Launching Strix agents...', progress: 5, messages: [], findings: 0, tokens: 0 });
    setActiveTab('overview');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: scanTarget, mode: 'quick' }),
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
                <div className={styles.scanTypeGrid}>
                  {[
                    { id: 'url', icon: '🌐', label: 'Web App', desc: 'Scan a live URL' },
                    { id: 'repo', icon: '📦', label: 'Repository', desc: 'GitHub / GitLab URL' },
                    { id: 'api', icon: '⚡', label: 'API / OpenAPI', desc: 'Swagger / Postman spec' },
                  ].map(t => (
                    <button
                      key={t.id}
                      className={`${styles.scanTypeCard} ${scanType === t.id ? styles.scanTypeCardActive : ''}`}
                      onClick={() => setScanType(t.id as typeof scanType)}
                    >
                      <span className={styles.scanTypeIcon}>{t.icon}</span>
                      <span className={styles.scanTypeLabel}>{t.label}</span>
                      <span className={styles.scanTypeDesc}>{t.desc}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.targetInput}>
                  <label className={styles.inputLabel}>
                    {scanType === 'url' ? 'Target URL' : scanType === 'repo' ? 'Repository URL' : 'API Spec URL or File'}
                  </label>
                  <div className={styles.inputWrap}>
                    <input
                      type="text"
                      className={styles.targetField}
                      placeholder={
                        scanType === 'url' ? 'https://your-app.com' :
                        scanType === 'repo' ? 'https://github.com/org/repo' :
                        'https://api.your-app.com/openapi.json'
                      }
                      value={scanTarget}
                      onChange={e => setScanTarget(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.optionsGrid}>
                  <div className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>Scan Mode</span>
                      <span className="badge badge-green">Cost Optimized</span>
                    </div>
                    <div className={styles.radioGroup}>
                      {[
                        { value: 'quick', label: 'Quick', desc: '~5 min · Low cost', recommended: true },
                        { value: 'standard', label: 'Standard', desc: '~15 min · Medium cost', recommended: false },
                        { value: 'deep', label: 'Deep', desc: '~45 min · Higher cost', recommended: false },
                      ].map(opt => (
                        <label key={opt.value} className={styles.radioLabel}>
                          <input type="radio" name="mode" defaultChecked={opt.recommended} className={styles.radio} />
                          <div className={styles.radioContent}>
                            <span className={styles.radioTitle}>{opt.label} {opt.recommended && <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Recommended</span>}</span>
                            <span className={styles.radioDesc}>{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>Instructions (optional)</span>
                    </div>
                    <textarea
                      className={styles.instructionField}
                      placeholder={'Focus on authentication flows.\nTest as admin user with credentials: admin@test.com / test123'}
                      rows={5}
                    />
                  </div>
                </div>

                <div className={styles.scanActions}>
                  <div className={styles.costEstimate}>
                    <span>⚡ Estimated cost:</span>
                    <span className={styles.costAmount}>~$0.15 – $0.50</span>
                    <span className={styles.costNote}>(deducted from your plan)</span>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={startScan}
                    disabled={!scanTarget || scanProgress.status === 'running'}
                    style={{ padding: '14px 32px', fontSize: '1rem' }}
                  >
                    {scanProgress.status === 'running' ? '⟳ Scan Running...' : '🚀 Launch Scan'}
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
                  <span className={styles.findingsDate}>{selectedScan.date}</span>
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
                        {v.severity}
                      </div>
                      <div className={styles.vulnTitle}>{v.title}</div>
                      <div className={styles.vulnMeta}>
                        <span className={styles.vulnEndpoint}>{v.endpoint}</span>
                        <span className={styles.cvssScore}>CVSS {v.cvss}</span>
                      </div>
                      {v.status === 'fixed' && <span className="badge badge-green" style={{ fontSize: '0.65rem', marginTop: '4px' }}>✓ Fixed</span>}
                    </div>
                  ))}
                </div>

                {selectedVuln ? (
                  <div className={styles.vulnDetail}>
                    <div className={styles.vulnDetailHeader}>
                      <div className="badge badge-red" style={{ fontSize: '0.75rem' }}>{selectedVuln.severity} · CVSS {selectedVuln.cvss}</div>
                      <h2 className={styles.vulnDetailTitle}>{selectedVuln.title}</h2>
                      <div className={styles.vulnDetailMeta}>
                        <span>Type: {selectedVuln.type}</span>
                        <span>Endpoint: <code className={styles.code}>{selectedVuln.endpoint}</code></span>
                      </div>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>⚠ Proof of Concept</h3>
                      <div className={styles.pocBox}>
                        <code>{selectedVuln.poc}</code>
                      </div>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>📋 Description</h3>
                      <p className={styles.vulnDesc}>
                        This vulnerability allows an attacker to manipulate the <code className={styles.code}>{selectedVuln.endpoint}</code> endpoint
                        to gain unauthorized access or extract sensitive data. The AI pentest agent confirmed this finding
                        with a working exploit that produced a valid proof-of-concept.
                      </p>
                    </div>

                    <div className={styles.vulnSection}>
                      <h3 className={styles.vulnSectionTitle}>🩹 Recommended Fix</h3>
                      <div className={styles.fixBox}>
                        <p>1. Implement parameterized queries / input sanitization</p>
                        <p>2. Apply principle of least privilege</p>
                        <p>3. Add proper authentication checks before processing input</p>
                        <p>4. Enable WAF rules for this endpoint</p>
                      </div>
                    </div>

                    <div className={styles.vulnActions}>
                      <button className="btn-primary" style={{ fontSize: '0.875rem' }}>
                        ✨ Generate Fix (AI Patch)
                      </button>
                      <button className="btn-secondary" style={{ fontSize: '0.875rem' }}>
                        📋 Copy Report
                      </button>
                      <button className="btn-ghost" style={{ fontSize: '0.875rem' }}>
                        ✓ Mark as Fixed
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.vulnDetailEmpty}>
                    <span className={styles.emptyIcon}>⚠</span>
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
