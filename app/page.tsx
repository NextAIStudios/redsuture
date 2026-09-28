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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
          <a href="#surfaces">Target Architectures</a>
          <a href="#remediation">Remediation Guides</a>
          <a href="#models">AI Engine</a>
          <a href="#compliance">Compliance</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Enterprise FAQ</a>
        </div>
        <div className={styles.navActions}>
          <Link href="/auth" className="btn-ghost">Sign In</Link>
          <Link href="/auth?mode=signup" className="btn-primary">
            Request Managed Scan
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
            <a href="#surfaces" onClick={() => setMenuOpen(false)}>Target Architectures</a>
            <a href="#remediation" onClick={() => setMenuOpen(false)}>Remediation Guides</a>
            <a href="#models" onClick={() => setMenuOpen(false)}>AI Engine</a>
            <a href="#compliance" onClick={() => setMenuOpen(false)}>Compliance</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>Enterprise FAQ</a>
          </div>
          <div className={styles.mobileNavActions}>
            <Link href="/auth" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Request Managed Scan
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
    '> redsuture audit --target https://api.enterprise-gateway.io --mode autonomous',
    '  [ORCHESTRATOR] Initializing multi-agent red team with Anthropic Claude & OpenAI...',
    '  [RECON-AGENT] Discovered 64 attack vectors & mapped API authorization flows',
    '  [EXPLOIT-AGENT] Probing BOLA & parameterized injection in /api/v2/orders',
    '  [FINDING-CRITICAL] CVE-2025-2184: Broken Object Level Authorization validated',
    '  [VALIDATION-AGENT] Deterministic PoC verified in isolated sandbox (Zero false positives)',
    '  [SUTURE-ENGINE] Synthesized step-by-step remediation guide & code diff',
    '  [EXPORT-ENGINE] Generated downloadable .patch diff, PDF audit report & SARIF telemetry',
    '  -------------------------------------------------------------',
    '  Assessment complete. 100% reproducible findings with remediation ready.',
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
        <span className={styles.termTitle}>redsuture-core // autonomous-ai-orchestration</span>
        <span className={styles.termLiveStatus}>
          <span className={styles.pulseGreen} /> ACTIVE
        </span>
      </div>
      <div className={styles.terminalBody}>
        {lines.filter(Boolean).map((line, i) => {
          let lineClass = styles.termLine;
          if (line.includes('[FINDING-CRITICAL]')) lineClass = `${styles.termLine} ${styles.termCritical}`;
          else if (line.includes('[FINDING-HIGH]')) lineClass = `${styles.termLine} ${styles.termHigh}`;
          else if (line.includes('[SUTURE-ENGINE]') || line.includes('[EXPORT-ENGINE]')) lineClass = `${styles.termLine} ${styles.termFix}`;
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

const targetSurfaces = [
  {
    title: 'Live Web Applications',
    badge: 'Dynamic DAST',
    description: 'Black-box adversarial testing of production and staging web apps, SPAs, SSR pipelines, and client interfaces.',
    highlight: 'XSS, CSRF, DOM manipulation, SSRF & Session Security',
  },
  {
    title: 'Remote Git Repositories',
    badge: 'Source SAST + Logic',
    description: 'Code-level vulnerability analysis directly within GitHub, GitLab, and Bitbucket repositories.',
    highlight: 'Taint tracking, exposed credentials, hardcoded logic flaws',
  },
  {
    title: 'Local Codebase Workspaces',
    badge: 'Internal QA',
    description: 'Direct testing of developer application directories and pre-deployment microservice packages.',
    highlight: 'Package dependencies, unsafe imports, configuration gaps',
  },
  {
    title: 'White-Box Correlated Hybrid',
    badge: 'Deep Multi-Target',
    description: 'Simultaneous testing correlating running live endpoints with source code logic for maximum exploit depth.',
    highlight: 'Codebase-informed live payload fuzzing & PoC verification',
  },
  {
    title: 'Bulk Enterprise Scope Lists',
    badge: 'Portfolio Estate',
    description: 'Continuous portfolio-wide vulnerability scanning across dozens of microservices, APIs, and domain lists.',
    highlight: 'Batch discovery, automated prioritization & asset tagging',
  },
  {
    title: 'REST, GraphQL & gRPC APIs',
    badge: 'API Security',
    description: 'Deep parameter fuzzing, broken object level authorization (BOLA/IDOR), token tampering, and schema exposure.',
    highlight: 'OAuth scopes, rate-limit bypassing, JWT algorithmic confusion',
  },
];

const platformCapabilities = [
  {
    icon: <CpuIcon />,
    title: 'Advanced AI Frontier Model Orchestration',
    desc: 'Powered by the latest reasoning models from Anthropic (Claude) and OpenAI, our specialized agent graph emulates real-world threat actors.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Zero False-Positive Exploit Verification',
    desc: 'Every identified weakness is validated with an executable proof-of-concept in an isolated runtime sandbox before reporting. Zero alert fatigue.',
  },
  {
    icon: <DownloadIcon />,
    title: 'Downloadable Step-by-Step Remediation Guides',
    desc: 'Receive comprehensive remediation packages including line-by-line developer guides, surgical code diffs (.patch), PDF audit reports, and SARIF telemetry.',
  },
  {
    icon: <CodeIcon />,
    title: 'Target Architecture Flexibility',
    desc: 'Clients choose the target scope they want tested: Live URLs, Git Repositories, Local Directories, White-box estates, or Domain lists.',
  },
  {
    icon: <FileCheckIcon />,
    title: 'Audit-Grade Compliance Reporting',
    desc: 'Export technical SARIF logs and executive pentest attestations formatted for SOC 2 Type II, ISO/IEC 27001, HIPAA, and PCI-DSS v4.0 auditors.',
  },
  {
    icon: <ServerIcon />,
    title: 'Safe, Non-Destructive Execution',
    desc: 'Intelligent throttling, sandboxed payloads, and non-destructive testing guarantee continuous validation without downtime or data corruption.',
  },
];

const downloadFormats = [
  {
    ext: '.patch / .diff',
    title: 'SutureEngine Code Patch',
    desc: 'Ready-to-apply git patch files with exact framework-specific remediation code.',
  },
  {
    ext: '.md / .json',
    title: 'Step-by-Step Developer Guide',
    desc: 'Detailed architectural walkthrough, root-cause analysis, and verification test scripts.',
  },
  {
    ext: '.pdf',
    title: 'Executive Audit Pentest Report',
    desc: 'CISO-level executive summary with CVSS scoring, risk matrices, and compliance mapping.',
  },
  {
    ext: '.sarif',
    title: 'SARIF v2.1.0 Standard Telemetry',
    desc: 'Direct integration artifact for CI/CD pipelines, GitHub Security, and enterprise SIEMs.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Select Target Scope',
    desc: 'You choose which assets to evaluate: live web applications, remote Git repositories, white-box hybrid targets, or bulk domain lists.',
  },
  {
    step: '02',
    title: 'Autonomous Managed AI Attack',
    desc: 'We deploy coordinated AI agents on your behalf to map endpoints, probe injection vectors, and safely validate vulnerabilities in a sandbox.',
  },
  {
    step: '03',
    title: 'Deterministic PoC Validation',
    desc: 'Each weakness is confirmed with reproducible proof-of-concept exploits, CVSS scores, and exact evidence logs with zero false positives.',
  },
  {
    step: '04',
    title: 'Download Remediation Package',
    desc: 'Download step-by-step implementation guides, surgical code patches (.patch), and audit reports to close vulnerabilities instantly.',
  },
];

const enterprisePlans = [
  {
    name: 'Team',
    price: '$199',
    period: '/month',
    desc: 'For high-velocity engineering teams requiring continuous automated security validation.',
    features: [
      '25 Managed Scans / Month',
      'Web Applications & REST APIs',
      'Deterministic PoC Validation',
      'Downloadable Step-by-Step Guides',
      'SutureEngine Code Patch Exports',
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
      '100 Managed Scans / Month',
      'Web, REST, GraphQL, gRPC & Mobile',
      'Git Repositories & White-Box Hybrid',
      'Multi-Format Exports (PDF, SARIF, Patch)',
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
      'Unlimited Managed Red Team Scans',
      'Self-Hosted / Private VPC Runner Deployment',
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
    question: 'How do you perform penetration tests on our behalf?',
    answer: 'You define the target architecture you want tested (a live URL, a repository, or a hybrid white-box environment). Our managed platform deploys coordinated AI agents powered by OpenAI and Anthropic Claude models to discover, validate, and document security flaws with zero false positives.',
  },
  {
    question: 'What format do the remediation guides and code fixes come in?',
    answer: 'You receive downloadable step-by-step developer implementation procedures in Markdown/JSON, ready-to-apply Git patch files (.patch / .diff), executive audit-ready PDF reports, and standardized SARIF v2.1.0 logs for CI/CD integration.',
  },
  {
    question: 'Which AI models power the RedSuture platform?',
    answer: 'RedSuture orchestrates the latest state-of-the-art AI reasoning models, including Anthropic Claude 3.7 / Sonnet / Opus series and OpenAI frontier reasoning models (o1 / GPT-4o / GPT-5 class), into an autonomous red-teaming pipeline.',
  },
  {
    question: 'How does RedSuture ensure production environments remain safe?',
    answer: 'RedSuture operates with strictly non-destructive payload policies and adaptive rate-limiting algorithms. Scans can be executed against staging, preview environments, or live production with fine-grained throttling controls to protect database integrity and uptime.',
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
              <span>POWERED BY LATEST OPENAI &amp; ANTHROPIC CLAUDE MODELS</span>
            </div>
            <h1 className={styles.heroTitle}>
              Autonomous AI Offense.<br />
              <span className={styles.heroTitleAccent}>Step-by-Step Remediation.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              We deliver managed, continuous AI penetration testing on your behalf powered by the latest OpenAI and Anthropic Claude reasoning models. Specify your target architecture—Live Web Apps, Repositories, or White-Box estates—and receive verified exploit PoCs with step-by-step remediation guides and surgical code patches ready to download.
            </p>
            <div className={styles.heroActions}>
              <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                Deploy Managed Security Scan
                <ArrowRightIcon />
              </Link>
              <a href="#remediation" className="btn-secondary" style={{ padding: '14px 24px' }}>
                Explore Remediation Formats
              </a>
            </div>
            <div className={styles.heroMetrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>100%</span>
                <span className={styles.metricLabel}>Verified PoC Exploits</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>Multi-Format</span>
                <span className={styles.metricLabel}>Downloadable Guides</span>
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

      {/* Enterprise Threat Surface Ticker with Isolated Overflow Container */}
      <div className={styles.ticker}>
        <div className={styles.tickerLabel}>
          <span>ACTIVE THREAT MITIGATION COVERAGE</span>
        </div>
        <div className={styles.tickerTrackWrapper}>
          <div className={styles.tickerTrack}>
            {[...THREAT_VECTORS, ...THREAT_VECTORS].map((vector, index) => (
              <span key={index} className={styles.tickerItem}>
                <span className={styles.tickerDot} /> {vector}
              </span>
            ))}
          </div>
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

      {/* Attack Surface Coverage by Client Target Types */}
      <section id="surfaces" className={styles.section} style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>CLIENT TARGET ARCHITECTURES</span>
            <h2 className={styles.sectionTitle}>We test the exact assets your business relies on.</h2>
            <p className={styles.sectionSub}>
              Select the target types you want evaluated. Our autonomous AI handles the rest, safely discovering exploitable vulnerabilities across every digital tier.
            </p>
          </div>
          <div className={styles.surfacesGrid}>
            {targetSurfaces.map((surface, idx) => (
              <div key={idx} className={styles.surfaceCard}>
                <div className={styles.surfaceHeader}>
                  <h3 className={styles.surfaceTitle}>{surface.title}</h3>
                  <span className={styles.surfaceBadge}>{surface.badge}</span>
                </div>
                <p className={styles.surfaceDesc}>{surface.description}</p>
                <div className={styles.surfaceFooter}>
                  <span>Coverage: {surface.highlight}</span>
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
              Move from periodic manual pentests and noisy vulnerability scanners to continuous, verified adversarial simulations with complete remediation packages.
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

      {/* AI Models Showcase */}
      <section id="models" className={styles.section} style={{ background: 'var(--bg-base)' }}>
        <div className="container">
          <div className={styles.modelsContainer}>
            <div className={styles.modelsLeft}>
              <span className={styles.sectionCategory}>FRONTIER AI REASONING</span>
              <h2 className={styles.modelsTitle}>Orchestrating OpenAI &amp; Anthropic Claude.</h2>
              <p className={styles.modelsDesc}>
                RedSuture combines the deepest reasoning architectures in AI to form a multi-agent offensive security pipeline. Rather than shallow static rules, our agents actively reason through complex authentication flows, business logic edge-cases, and multi-step exploit chains.
              </p>
              <div className={styles.modelsList}>
                <div className={styles.modelItem}>
                  <div className={styles.modelDot} />
                  <div>
                    <strong>Anthropic Claude Reasoning Architecture:</strong>
                    <span> Deep contextual code comprehension, taint path mapping, and high-precision remediation diff generation.</span>
                  </div>
                </div>
                <div className={styles.modelItem}>
                  <div className={styles.modelDot} />
                  <div>
                    <strong>OpenAI Frontier Models:</strong>
                    <span> Rapid adversarial hypothesis generation, dynamic fuzzing logic, and complex protocol payload formulation.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modelsRight}>
              <div className={styles.agentGraphBox}>
                <div className={styles.agentNode}>
                  <span className={styles.agentTag}>AGENT 01</span>
                  <strong>Reconnaissance &amp; Surface Mapper</strong>
                  <span>Automated endpoint crawling &amp; OAuth flow graphing</span>
                </div>
                <div className={styles.agentArrow}>↓</div>
                <div className={styles.agentNode}>
                  <span className={styles.agentTag}>AGENT 02</span>
                  <strong>Adversarial Reasoning &amp; Exploitation</strong>
                  <span>Stateful attack tree generation &amp; injection execution</span>
                </div>
                <div className={styles.agentArrow}>↓</div>
                <div className={styles.agentNode}>
                  <span className={styles.agentTag}>AGENT 03</span>
                  <strong>Deterministic PoC Sandbox Validator</strong>
                  <span>Zero false-positive exploit verification &amp; CVSS rating</span>
                </div>
                <div className={styles.agentArrow}>↓</div>
                <div className={styles.agentNodeHighlight}>
                  <span className={styles.agentTagHighlight}>SUTURE ENGINE</span>
                  <strong>Remediation &amp; Patch Synthesizer</strong>
                  <span>Step-by-step guide &amp; multi-format downloadable code diffs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Downloadable Remediation Formats Showcase */}
      <section id="remediation" className={styles.section} style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCategory}>MULTI-FORMAT DELIVERABLES</span>
            <h2 className={styles.sectionTitle}>Everything your engineering team needs to fix fast.</h2>
            <p className={styles.sectionSub}>
              We don&apos;t just dump issue tickets. RedSuture generates step-by-step developer guides and surgical code patches ready to download in whichever format fits your workflow.
            </p>
          </div>

          <div className={styles.formatsGrid}>
            {downloadFormats.map((f, i) => (
              <div key={i} className={styles.formatCard}>
                <div className={styles.formatExt}>{f.ext}</div>
                <h3 className={styles.formatTitle}>{f.title}</h3>
                <p className={styles.formatDesc}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className={styles.diffContainer} style={{ marginTop: '40px' }}>
            <div className={styles.diffHeader}>
              <div className={styles.diffTab}>
                <CodeIcon className={styles.diffTabIcon} />
                <span>api/src/controllers/authController.ts</span>
                <span className={styles.diffBadge}>Step-by-Step Remediation Guide Attached</span>
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
                <div className={styles.diffLabelSuccess}>SUTURE REMEDIATION (PARAMETRIZED &amp; SCOPED)</div>
                <pre className={styles.diffCode}>
{`// Verified patch: Strict tenant claim validation & parameterized query
export async function getAccountTransactions(req: AuthenticatedRequest, res: Response) {
  const { accountId } = req.params;
  const sessionUserId = req.user.id;
  
  // 1. Enforce tenant boundary check
  await verifyAccountOwnership(sessionUserId, accountId);
  
  // 2. Parameterized database lookup
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
            <span className={styles.sectionCategory}>MANAGED SERVICE WORKFLOW</span>
            <h2 className={styles.sectionTitle}>From scope selection to verified remediation.</h2>
            <p className={styles.sectionSub}>
              A seamless continuous security lifecycle operated on your behalf with zero developer friction.
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
            <span className={styles.sectionCategory}>MANAGED SERVICE PRICING</span>
            <h2 className={styles.sectionTitle}>Predictable, transparent tiering.</h2>
            <p className={styles.sectionSub}>
              Enterprise-grade autonomous offensive security at a fraction of traditional consultancy retainers.
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
                  href="/auth?mode=signup"
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
              Key technical details regarding our managed AI services, target architecture options, and delivery formats.
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
            <span>EVALUATE YOUR SECURITY POSTURE</span>
          </div>
          <h2 className={styles.ctaTitle}>Fortify your digital assets with autonomous AI offensive testing.</h2>
          <p className={styles.ctaSub}>
            Deploy your first security assessment in minutes. Validated proof-of-concept exploits and downloadable step-by-step remediation guides.
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
                Managed autonomous penetration testing and downloadable vulnerability remediation guides for modern enterprise applications.
              </p>
              <p className={styles.footerStudio}>
                Engineered by <span className={styles.studioName}>NextAI Studios</span>
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Platform</div>
                <a href="#models">AI Reasoning Engine</a>
                <a href="#surfaces">Target Architectures</a>
                <a href="#remediation">Downloadable Guides</a>
                <Link href="/dashboard">Security Dashboard</Link>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Target Types</div>
                <a href="#surfaces">Live Web Apps &amp; APIs</a>
                <a href="#surfaces">Source Code Repositories</a>
                <a href="#surfaces">White-Box Hybrid Estates</a>
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
              Authorized penetration testing only. Scan targets strictly within your organizational ownership or documented legal authorization.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
