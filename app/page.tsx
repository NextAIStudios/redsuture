'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

const THREAT_VECTORS = [
  'Broken Object Level Auth (BOLA)',
  'SQL & NoSQL Injection Vectors',
  'Server-Side Request Forgery (SSRF)',
  'JWT & Cryptographic Flaws',
  'GraphQL Introspection & Over-fetching',
  'Privilege Escalation Chains',
  'Remote Code Execution (RCE)',
  'Cross-Site Scripting (XSS)',
  'API Rate-Limit & Logic Bypass',
  'CI/CD Pipeline Dependency Poisoning'
];

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function GitPullRequestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function FileCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <div className={`container ${styles.navInner}`}>
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <div className={styles.logoBadge}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className={styles.logoText}>RedSuture</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#platform">Platform</a>
          <a href="#surfaces">Attack Surfaces</a>
          <a href="#remediation">Suture Remediation</a>
          <a href="#compliance">Compliance</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Enterprise FAQ</a>
        </div>
        <div className={styles.navActions}>
          <Link href="/auth" className="btn-ghost">Sign In</Link>
          <Link href="/auth?mode=signup" className="btn-primary">
            Request Enterprise Scan
            <ArrowRightIcon />
          </Link>
        </div>
        <button
          className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnActive : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close Menu' : 'Open Menu'}
        >
          <span className={styles.bar1} />
          <span className={styles.bar2} />
          <span className={styles.bar3} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`${styles.mobileDrawer} ${menuOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={`container ${styles.mobileDrawerInner}`}>
          <div className={styles.mobileNavLinks}>
            <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
            <a href="#surfaces" onClick={() => setMenuOpen(false)}>Attack Surfaces</a>
            <a href="#remediation" onClick={() => setMenuOpen(false)}>Suture Remediation</a>
            <a href="#compliance" onClick={() => setMenuOpen(false)}>Compliance</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>Enterprise FAQ</a>
          </div>
          <div className={styles.mobileNavActions}>
            <Link href="/auth" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Request Enterprise Scan
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroTerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const terminalLines = [
    '> redsuture scan --target https://api.enterprise-gateway.io --mode deep',
    '  [ORCHESTRATOR] Initializing autonomous multi-agent red team...',
    '  [RECON-AGENT] Enumerated 64 endpoints & mapped OAuth scopes',
    '  [EXPLOIT-AGENT] Probing BOLA & SQLi attack surfaces on /api/v2/orders',
    '  [FINDING-CRITICAL] CVE-2025-2184: Broken Object Level Auth in /api/v2/orders/:id',
    '  [FINDING-HIGH] CWE-89: Parameterized bypass in search filter',
    '  [VALIDATION-AGENT] Deterministic PoC verified (Sandbox execution 200 OK)',
    '  [SUTURE-ENGINE] Synthesizing surgical remediation patch...',
    '  [GIT-AUTOMATION] Generated PR #1084: "Fix authorization check on order querying"',
    '  [COMPLIANCE] Artifacts exported → SARIF v2.1.0 & SOC 2 Attestation',
    '  -------------------------------------------------------------',
    '  Execution complete. Target secured with 0 false positives.',
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < terminalLines.length) {
        setLines(prev => [...prev, terminalLines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setLines([]);
          i = 0;
        }, 4000);
      }
    }, 240);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalHeader}>
        <div className={styles.termControls}>
          <div className={styles.termDot} style={{ background: '#ef4444' }} />
          <div className={styles.termDot} style={{ background: '#f59e0b' }} />
          <div className={styles.termDot} style={{ background: '#10b981' }} />
        </div>
        <span className={styles.termTitle}>redsuture-agent-core // execution-runtime-prod</span>
        <span className={styles.termLiveStatus}>
          <span className={styles.pulseGreen} /> ACTIVE
        </span>
      </div>
      <div className={styles.terminalBody}>
        {lines.filter(Boolean).map((line, i) => {
          let lineClass = styles.termLine;
          if (line.includes('[FINDING-CRITICAL]')) lineClass = `${styles.termLine} ${styles.termCritical}`;
          else if (line.includes('[FINDING-HIGH]')) lineClass = `${styles.termLine} ${styles.termHigh}`;
          else if (line.includes('[SUTURE-ENGINE]') || line.includes('[GIT-AUTOMATION]')) lineClass = `${styles.termLine} ${styles.termFix}`;
          else if (line.includes('[VALIDATION-AGENT]')) lineClass = `${styles.termLine} ${styles.termSuccess}`;
          else if (line.startsWith('>')) lineClass = `${styles.termLine} ${styles.termCmd}`;

          return (
            <div key={i} className={lineClass}>
              {line}
            </div>
          );
        })}
        <span className={styles.termCursor}>_</span>
      </div>
    </div>
  );
}

const enterpriseSurfaces = [
  {
    title: 'Live Web Applications',
    description: 'Black-box DAST probing of web apps, SPAs, SSR pipelines, and client-side frontends. Evaluates DOM flaws, authentication bypasses, CSRF, and injection.',
    scope: 'strix --target https://your-app.com',
  },
  {
    title: 'GitHub & GitLab Repositories',
    description: 'Source-aware static and dynamic analysis directly within the code repository. Identifies tainted flows, exposed secrets, and unauthenticated endpoints.',
    scope: 'strix --target https://github.com/org/repo',
  },
  {
    title: 'White-Box Correlated Multi-Target',
    description: 'Hybrid evaluation correlating running live web endpoints with underlying GitHub source code for maximum exploitation depth and verified PoCs.',
    scope: 'strix -t repo -t https://app.com',
  },
  {
    title: 'Bulk Enterprise Scope Lists',
    description: 'Continuous portfolio-wide vulnerability scanning across dozens of microservices, APIs, and domains from structured target lists.',
    scope: 'strix --target-list ./targets.txt',
  },
];

const platformCapabilities = [
  {
    icon: <CpuIcon />,
    title: 'Managed Multi-Agent Penetration Testing',
    desc: 'We operate autonomous Strix AI agents on your behalf, emulating sophisticated red-team adversaries across your chosen target architectures.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Zero False-Positive Exploit Validation',
    desc: 'Every finding is validated with an executable proof-of-concept in an isolated runtime sandbox before being reported. Zero alert fatigue.',
  },
  {
    icon: <GitPullRequestIcon />,
    title: 'Automated GitHub Pull Request Remediation',
    desc: 'Our SutureEngine synthesizes review-ready code diffs and pushes pull requests directly to your customer repositories with ready-to-merge fixes.',
  },
  {
    icon: <CodeIcon />,
    title: 'Flexible Ingestion by Target Type',
    desc: 'Select from live web applications, GitHub repositories, local directory paths, white-box hybrid targets, or bulk domain lists.',
  },
  {
    icon: <FileCheckIcon />,
    title: 'Audit-Grade Compliance Reporting',
    desc: 'Export standardized SARIF v2.1.0 artifacts, technical documentation, and executive summaries mapped to SOC 2, ISO 27001, and PCI-DSS audits.',
  },
  {
    icon: <ServerIcon />,
    title: 'Safe, Non-Destructive Execution',
    desc: 'Smart adaptive throttling and non-destructive payloads guarantee continuous security testing without downtime or database corruption.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Select Target Types',
    desc: 'Define the scope you want assessed: live web app URLs, GitHub repositories, white-box hybrid targets, or bulk domain lists.',
  },
  {
    step: '02',
    title: 'Autonomous Strix Pentest',
    desc: 'RedSuture deploys coordinated AI agents on your behalf to map endpoints, probe injection vectors, and safely validate vulnerabilities.',
  },
  {
    step: '03',
    title: 'Deterministic PoC Validation',
    desc: 'Each weakness is confirmed with reproducible proof-of-concept exploits, CVSS scores, and evidence logs.',
  },
  {
    step: '04',
    title: 'Push Auto-Fix PR to GitHub',
    desc: 'SutureEngine generates compile-ready patches and pushes an automated Pull Request directly to your GitHub repository for 1-click merging.',
  },
];

const enterprisePlans = [
  {
    name: 'Team',
    price: '$199',
    period: '/month',
    desc: 'For high-velocity engineering teams requiring continuous automated security validation.',
    features: [
      '25 Automated Scans / Month',
      'Web Applications & REST APIs',
      'Deterministic PoC Validation',
      'AI-Powered Code Patch Suggestions',
      'GitHub & GitLab CI/CD Integration',
      'Standard SLA & Support',
    ],
    cta: 'Start Team Trial',
    popular: false,
  },
  {
    name: 'Scale',
    price: '$599',
    period: '/month',
    desc: 'For scaling companies with complex architectures, multi-repo setups, and compliance audits.',
    features: [
      '100 Automated Scans / Month',
      'Web, REST, GraphQL, gRPC & Mobile',
      'Source Code & Repository Scanners',
      'Automated Pull Request (PR) Fixes',
      'SOC 2, ISO 27001 & PCI-DSS Reports',
      'Jira, Slack & SIEM Webhook Integration',
      'Role-Based Access Control (RBAC)',
      'Priority Security Engineering Support',
    ],
    cta: 'Start Scale Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For security organizations requiring custom VPC execution, private models, and dedicated SLAs.',
    features: [
      'Unlimited Continuous Red Team Scans',
      'Self-Hosted / Private VPC Agent Deployment',
      'Custom LLM & Private Model Inference',
      'SAML 2.0 / OIDC SSO & Custom RBAC',
      'Custom Compliance & Executive Briefings',
      'Custom Exploit Payload Rules & Throttling',
      'Dedicated Security Architect & 99.99% SLA',
      '24/7 Red Team Escalation Channel',
    ],
    cta: 'Contact Enterprise Sales',
    popular: false,
  },
];

const faqs = [
  {
    question: 'How does RedSuture ensure production environments are not disrupted?',
    answer: 'RedSuture operates with strictly non-destructive payload policies and adaptive rate-limiting algorithms. Scans can be executed against staging, preview environments, or live production with fine-grained throttling controls to protect database integrity and uptime.',
  },
  {
    question: 'How does RedSuture achieve zero false positives?',
    answer: 'Unlike static analyzers that rely on pattern-matching heuristics, RedSuture functions as an active penetration tester. An alert is only recorded when an autonomous agent validates that the exploit successfully executed in a sandboxed verification cycle.',
  },
  {
    question: 'How does the SutureEngine generate code-level fixes?',
    answer: 'When a vulnerability is verified, RedSuture inspects the surrounding context, frameworks, and architecture. It synthesizes a precise code diff (e.g., parameterized database calls, strict authorization middlewares, or sanitized inputs) and opens a GitHub or GitLab pull request ready for peer review.',
  },
  {
    question: 'Can RedSuture test private source code repositories and internal APIs?',
    answer: 'Yes. RedSuture can be connected via GitHub/GitLab apps for source-level context, and agent runners can be deployed inside private VPCs or behind firewalls to test internal microservices without exposing endpoints to the public internet.',
  },
  {
    question: 'Are RedSuture reports accepted for SOC 2, ISO 27001, and PCI DSS audits?',
    answer: 'Yes. RedSuture produces industry-standard SARIF logs, technical findings, and executive pentest summaries that fulfill technical testing requirements for SOC 2 Type II, ISO/IEC 27001, and PCI DSS v4.0 penetration testing mandates.',
  },
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className={styles.page}>
      <NavBar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className={styles.pulseIndicator} />
              <span>CONTINUOUS OFFENSIVE SECURITY PLATFORM</span>
            </div>
            <h1 className={styles.heroTitle}>
              Autonomous Cyber Offense.<br />
              <span className={styles.heroTitleAccent}>Push-to-GitHub Remediation.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              We deliver managed, continuous AI penetration testing powered by Strix agents on your behalf. Specify your target types—Live Web Apps, Repositories, or White-Box estates—and receive verified exploit PoCs with automated pull requests pushed directly to your GitHub repository.
            </p>
            <div className={styles.heroActions}>
              <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                Deploy Security Scan
                <ArrowRightIcon />
              </Link>
              <a href="#platform" className="btn-secondary" style={{ padding: '14px 24px' }}>
                Explore Platform Architecture
              </a>
            </div>
            <div className={styles.heroMetrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>100%</span>
                <span className={styles.metricLabel}>Verified PoC Exploits</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>&lt; 90s</span>
                <span className={styles.metricLabel}>Time-to-Remediation</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>Zero</span>
                <span className={styles.metricLabel}>False Positive Rate</span>
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <HeroTerminal />
          </div>
        </div>
      </section>

      {/* Enterprise Threat Surface Ticker */}
      <div className={styles.ticker}>
        <div className={styles.tickerLabel}>ACTIVE THREAT MITIGATION COVERAGE</div>
        <div className={styles.tickerTrack}>
          {[...THREAT_VECTORS, ...THREAT_VECTORS].map((vector, index) => (
            <span key={index} className={styles.tickerItem}>
              <span className={styles.tickerDot} /> {vector}
            </span>
          ))}
        </div>
      </div>

      {/* Compliance & Standards Bar */}
      <section id="compliance" className={styles.complianceBar}>
        <div className="container">
          <p className={styles.complianceHeading}>AUDIT-GRADE SECURITY COMPLIANCE AUTOMATION</p>
          <div className={styles.complianceGrid}>
            <div className={styles.complianceItem}>
              <ShieldIcon className={styles.complianceIcon} />
              <span>SOC 2 Type II</span>
            </div>
            <div className={styles.complianceItem}>
              <LockIcon className={styles.complianceIcon} />
              <span>ISO / IEC 27001</span>
            </div>
            <div className={styles.complianceItem}>
              <FileCheckIcon className={styles.complianceIcon} />
              <span>PCI-DSS v4.0</span>
            </div>
            <div className={styles.complianceItem}>
              <ServerIcon className={styles.complianceIcon} />
              <span>HIPAA Security Rule</span>
            </div>
            <div className={styles.complianceItem}>
              <CodeIcon className={styles.complianceIcon} />
              <span>OWASP Top 10</span>
            </div>
            <div className={styles.complianceItem}>
              <CpuIcon className={styles.complianceIcon} />
              <span>NIST CSF 2.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Attack Surface Coverage */}
      <section id="surfaces" className={styles.section} style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>ATTACK SURFACE COVERAGE</span>
            <h2 className={styles.sectionTitle}>Comprehensive multi-asset security validation.</h2>
            <p className={styles.sectionSub}>
              Modern enterprise threats span beyond simple perimeter testing. RedSuture validates applications across every layer of your digital architecture.
            </p>
          </div>
          <div className={styles.surfacesGrid}>
            {enterpriseSurfaces.map((surface, idx) => (
              <div key={idx} className={styles.surfaceCard}>
                <div className={styles.surfaceScopeBadge}>{surface.scope}</div>
                <h3 className={styles.surfaceTitle}>{surface.title}</h3>
                <p className={styles.surfaceDesc}>{surface.description}</p>
                <div className={styles.surfaceFooter}>
                  <span>Continuous autonomous scan enabled</span>
                  <CheckmarkIcon className={styles.checkIcon} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section id="platform" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>ENTERPRISE CAPABILITIES</span>
            <h2 className={styles.sectionTitle}>Engineering-first offensive intelligence.</h2>
            <p className={styles.sectionSub}>
              Move from periodic manual pentests and noisy vulnerability reports to continuous, verified adversarial simulations with instant code remediation.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {platformCapabilities.map((feature, idx) => (
              <div key={idx} className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive SutureEngine Code Diff Showcase */}
      <section id="remediation" className={styles.section} style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>SUTURE CODE ENGINE</span>
            <h2 className={styles.sectionTitle}>Don&apos;t just identify vulnerabilities. Close them.</h2>
            <p className={styles.sectionSub}>
              RedSuture generates surgical, review-ready code diffs directly targeting root cause logic in your repositories.
            </p>
          </div>
          <div className={styles.diffContainer}>
            <div className={styles.diffHeader}>
              <div className={styles.diffTab}>
                <CodeIcon className={styles.diffTabIcon} />
                <span>api/src/controllers/authController.ts</span>
                <span className={styles.diffBadge}>Suture Auto-Fix PR #1084</span>
              </div>
            </div>
            <div className={styles.diffBody}>
              <div className={styles.diffSection}>
                <div className={styles.diffLabelDanger}>VULNERABLE IMPLEMENTATION (CWE-89 &amp; BOLA)</div>
                <pre className={styles.diffCode}>
{`// Vulnerable to unauthenticated direct object access and raw query injection
export async function getAccountTransactions(req: Request, res: Response) {
  const { accountId, filter } = req.body;
  const rawQuery = "SELECT * FROM transactions WHERE account_id = '" + accountId + "'";
  const records = await db.raw(rawQuery);
  return res.json(records);
}`}
                </pre>
              </div>
              <div className={styles.diffSection}>
                <div className={styles.diffLabelSuccess}>SUTURE AI REMEDIATION (PARAMETRIZED &amp; SCOPED)</div>
                <pre className={styles.diffCode}>
{`// Verified patch: Strict tenant claim validation & parameterized query
export async function getAccountTransactions(req: AuthenticatedRequest, res: Response) {
  const { accountId } = req.params;
  const sessionUserId = req.user.id;
  
  // Enforce tenant boundary check
  await verifyAccountOwnership(sessionUserId, accountId);
  
  const records = await db('transactions')
    .where({ account_id: accountId, user_id: sessionUserId })
    .select('id', 'amount', 'timestamp', 'status');
    
  return res.json(records);
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / 4-Step Process */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>OPERATIONAL WORKFLOW</span>
            <h2 className={styles.sectionTitle}>From target ingestion to verified closure.</h2>
            <p className={styles.sectionSub}>
              A continuous, automated lifecycle built to protect modern microservices, single-page apps, and production APIs without developer friction.
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {workflowSteps.map((step, idx) => (
              <div key={idx} className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNum}>{step.step}</span>
                  {idx < workflowSteps.length - 1 && <div className={styles.stepConnector} />}
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.section} style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>ENTERPRISE PRICING</span>
            <h2 className={styles.sectionTitle}>Predictable, transparent tiering.</h2>
            <p className={styles.sectionSub}>
              Continuous offensive security at a fraction of traditional manual consultancy retainers.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {enterprisePlans.map((plan, idx) => (
              <div key={idx} className={`${styles.pricingCard} ${plan.popular ? styles.pricingCardPopular : ''}`}>
                {plan.popular && <div className={styles.popularBadge}>RECOMMENDED FOR TEAMS</div>}
                <div className={styles.pricingHeader}>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <div className={styles.planPriceWrapper}>
                    <span className={styles.planPrice}>{plan.price}</span>
                    {plan.period && <span className={styles.planPeriod}>{plan.period}</span>}
                  </div>
                  <p className={styles.planDesc}>{plan.desc}</p>
                </div>
                <div className={styles.planDivider} />
                <ul className={styles.planFeatures}>
                  {plan.features.map((item, fIdx) => (
                    <li key={fIdx} className={styles.planFeatureItem}>
                      <CheckmarkIcon className={styles.featureCheckIcon} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === 'Enterprise' ? '/auth?mode=signup' : '/auth?mode=signup'}
                  className={plan.popular ? 'btn-primary' : 'btn-secondary'}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise FAQ */}
      <section id="faq" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>ENTERPRISE FAQ</span>
            <h2 className={styles.sectionTitle}>Frequently asked questions.</h2>
            <p className={styles.sectionSub}>
              Key technical details regarding execution safety, code privacy, and compliance integration.
            </p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div className={styles.faqQuestion}>
                    <span>{faq.question}</span>
                    <span className={styles.faqToggleIcon}>{isOpen ? '−' : '+'}</span>
                  </div>
                  {isOpen && <div className={styles.faqAnswer}>{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Enterprise CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className={styles.heroBadge} style={{ margin: '0 auto 20px auto' }}>
            <span>EVALUATE YOUR ATTACK SURFACE</span>
          </div>
          <h2 className={styles.ctaTitle}>Fortify your digital assets with autonomous offensive AI.</h2>
          <p className={styles.ctaSub}>
            Deploy your first security assessment in minutes. Validated proof-of-concept exploits and instant code-level remediation.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '16px 36px' }}>
              Launch Initial Security Scan
              <ArrowRightIcon />
            </Link>
            <Link href="/auth" className="btn-secondary" style={{ fontSize: '1rem', padding: '16px 28px' }}>
              Access Security Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <div className={styles.logoBadge}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className={styles.logoText}>RedSuture</span>
              </div>
              <p className={styles.footerTagline}>
                Autonomous penetration testing and real-time vulnerability remediation for modern enterprise applications.
              </p>
              <p className={styles.footerStudio}>
                Engineered by <span className={styles.studioName}>NextAI Studios</span>
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Platform</div>
                <a href="#platform">Autonomous Agents</a>
                <a href="#surfaces">Attack Surfaces</a>
                <a href="#remediation">SutureEngine</a>
                <Link href="/dashboard">Security Dashboard</Link>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Solutions</div>
                <a href="#surfaces">Web Application Security</a>
                <a href="#surfaces">API Penetration Testing</a>
                <a href="#surfaces">CI/CD &amp; Git Security</a>
                <a href="#compliance">Compliance Automation</a>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Governance &amp; Trust</div>
                <a href="#compliance">SOC 2 &amp; ISO 27001</a>
                <a href="#">Responsible Disclosure</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} RedSuture by NextAI Studios. All rights reserved.</p>
            <p className={styles.footerWarning}>
              Authorized penetration testing only. Scan targets strictly within your organizational ownership or documented legal scope.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
