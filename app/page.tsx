'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Logo from './components/Logo';
import {
  ShieldIcon, CodeIcon, GitIcon, GaugeIcon, FileCheckIcon, GlobeIcon, LayersIcon,
  FolderIcon, ApiIcon, ListIcon, CheckIcon, ArrowRightIcon, PlusIcon, DownloadIcon,
} from './components/icons';

const AUTH_FLAG = 'rs_authed';

// Routes to the dashboard when the user is signed in, otherwise to sign-up.
// Auth is a client-side flag here (set by the auth page); there is no server
// session, so this gates the UI rather than enforcing access.
function useLaunchScan() {
  const router = useRouter();
  return (e?: React.MouseEvent) => {
    e?.preventDefault();
    let authed = false;
    try {
      authed = localStorage.getItem(AUTH_FLAG) === '1';
    } catch {
      authed = false;
    }
    router.push(authed ? '/dashboard' : '/auth?mode=signup');
  };
}

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#platform', label: 'Platform' },
  { href: '#engine', label: 'AI engine' },
  { href: '#coverage', label: 'Coverage' },
  { href: '#deliverables', label: 'Remediation' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setMenuOpen(false);
  const launchScan = useLaunchScan();

  return (
    <header className={`${styles.nav} ${scrolled || menuOpen ? styles.navScrolled : ''} ${menuOpen ? styles.navOpen : ''}`}>
      <div className={`container ${styles.navInner}`}>
        <Link href="/" onClick={close} aria-label="RedSuture home">
          <Logo />
        </Link>
        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className={styles.navActions}>
          <Link href="/auth" className={styles.navSignIn}>Sign in</Link>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={launchScan}>
            Launch scan
          </button>
        </div>
        <button
          className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnActive : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`${styles.mobileDrawer} ${menuOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className="container">
          <nav className={styles.mobileNavLinks} aria-label="Mobile">
            {NAV_LINKS.map(l => <a key={l.href} href={l.href} onClick={close}>{l.label}</a>)}
          </nav>
          <div className={styles.mobileNavActions}>
            <Link href="/auth" className={`${styles.btn} ${styles.btnSecondary}`} onClick={close}>Sign in</Link>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={e => { close(); launchScan(e); }}>Launch scan</button>
          </div>
        </div>
      </div>
    </header>
  );
}

type Severity = 'critical' | 'high' | 'medium' | 'low';

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function SeverityPill({ level }: { level: Severity }) {
  return <span className={`${styles.sev} ${styles[`sev_${level}`]}`}>{SEVERITY_LABEL[level]}</span>;
}

const SAMPLE_FINDINGS: { level: Severity; title: string; where: string }[] = [
  { level: 'critical', title: 'Broken object level authorization (BOLA)', where: 'GET /v2/orders/{id}' },
  { level: 'high', title: 'SQL injection in search filter', where: 'POST /v2/search' },
  { level: 'high', title: 'JWT accepts unsigned tokens & alg confusion', where: 'POST /auth/session' },
  { level: 'medium', title: 'SSRF via webhook callback URL', where: 'POST /v2/webhooks' },
];

function HeroReport() {
  const launchScan = useLaunchScan();
  return (
    <div className={styles.window} aria-label="Example RedSuture scan report">
      <div className={styles.windowBar}>
        <span className={styles.windowDots}><i /><i /><i /></span>
        <span className={styles.windowUrl}>app.redsuture.com/scans/api.enterprise-gateway.io</span>
      </div>

      <div className={styles.reportHead}>
        <div>
          <div className={styles.reportTarget}>api.enterprise-gateway.io</div>
          <div className={styles.reportMeta}>
            <span className={styles.statusDot} /> Scan complete · Web + API · 4m 12s
          </div>
        </div>
        <span className={styles.reportBadge}>5 verified findings</span>
      </div>

      <div className={styles.reportStats}>
        {([['critical', 1], ['high', 3], ['medium', 1], ['low', 0]] as [Severity, number][]).map(([level, n]) => (
          <div key={level} className={styles.reportStat}>
            <span className={`${styles.reportStatBar} ${styles[`bar_${level}`]}`} />
            <span className={styles.reportStatNum}>{n}</span>
            <span className={styles.reportStatLabel}>{SEVERITY_LABEL[level]}</span>
          </div>
        ))}
      </div>

      <ul className={styles.findingList}>
        {SAMPLE_FINDINGS.map((f, i) => (
          <li key={f.title} className={`${styles.findingRow} ${i === 0 ? styles.findingRowActive : ''}`}>
            <SeverityPill level={f.level} />
            <div className={styles.findingText}>
              <span className={styles.findingTitle}>{f.title}</span>
              <code className={styles.findingWhere}>{f.where}</code>
            </div>
            <span className={styles.findingStatus}>
              <CheckIcon size={13} /> PoC verified
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.reportFoot}>
        <span className={styles.reportFiles}>
          <code>.patch</code><code>.md</code><code>.pdf</code><code>.sarif</code>
        </span>
        <button type="button" className={styles.reportAction} onClick={launchScan}>
          <DownloadIcon size={14} /> Download fixes
        </button>
      </div>
    </div>
  );
}

const STANDARDS = ['SOC 2 Type II', 'ISO/IEC 27001', 'PCI DSS v4.0', 'HIPAA', 'OWASP Top 10', 'NIST CSF 2.0'];

const THREAT_VECTORS = [
  'Broken Object Level Auth (BOLA)',
  'SQL & NoSQL Query Injection',
  'Server-Side Request Forgery (SSRF)',
  'JWT Algorithm Confusion & Spoofing',
  'GraphQL Introspection & Overfetching',
  'Privilege Escalation Chains',
  'Remote Code Execution (RCE)',
  'Stored & Reflected Cross-Site Scripting',
  'API Rate-Limit & Logic Bypass',
  'AST Taint Flow & CI/CD Poisoning',
  'IDOR In Tenant Resource Handlers',
  'OAuth 2.0 Token Exchange Flaws',
];

const STEPS = [
  {
    title: 'Define the scope',
    desc: 'Point RedSuture at a live URL, an API gateway, a Git repository, or both for white-box correlation. You configure strict boundaries and test depth.',
  },
  {
    title: 'Autonomous offensive agents execute',
    desc: 'Frontier AI reasoning models orchestrate reconnaissance, hypothesis exploration, and exploit generation. Every finding is proven in an isolated sandbox.',
  },
  {
    title: 'Download verified code fixes',
    desc: 'Each finding ships with severity scoring, PoC reproduction steps, root cause analysis, and ready-to-apply patches in unified diff, markdown, PDF, and SARIF formats.',
  },
];

const TARGETS = [
  { icon: <GlobeIcon />, title: 'Web applications', desc: 'SPAs, server-rendered apps, and staging environments tested black-box.' },
  { icon: <ApiIcon />, title: 'REST, GraphQL & gRPC APIs', desc: 'Auth flows, object-level access, token handling, and schema exposure.' },
  { icon: <GitIcon />, title: 'Git repositories', desc: 'GitHub, GitLab, and Bitbucket — taint analysis, secrets, and logic flaws.' },
  { icon: <FolderIcon />, title: 'Local codebases', desc: 'Pre-deployment packages and services before they reach production.' },
  { icon: <LayersIcon />, title: 'White-box hybrid', desc: 'Source code and live endpoints tested together for code-informed exploits.' },
  { icon: <ListIcon />, title: 'Bulk target lists', desc: 'Portfolios of microservices, domains, and subnets prioritized automatically.' },
];

const AGENTS = [
  { name: 'Reconnaissance Agent', desc: 'Discovers endpoints, parameters, HTTP methods, and exposed surface boundaries.' },
  { name: 'Adversarial Exploration Agent', desc: 'Formulates multi-step attack hypotheses using frontier AI reasoning.' },
  { name: 'Sandbox Validation Agent', desc: 'Deterministically reproduces each exploit in an isolated environment and calculates CVSS vectors.' },
  { name: 'SutureEngine Remediation', desc: 'Synthesizes surgical unified code patches and step-by-step developer remediation guides.' },
];

const FORMATS = [
  { ext: '.patch', title: 'Unified code diff patch', desc: 'Ready-to-apply code changes with exact line-by-line syntax tailored to your framework.' },
  { ext: '.md', title: 'Developer remediation guide', desc: 'Root-cause analysis, reproduction curl scripts, and step-by-step testing verification.' },
  { ext: '.pdf', title: 'Executive audit report', desc: 'CVSS v3.1 scoring, compliance mapping (SOC 2, ISO 27001, PCI DSS), and risk breakdown.' },
  { ext: '.sarif', title: 'SARIF v2.1.0 standard', desc: 'Structured static and dynamic results ready for CI/CD pipelines, GitHub code scanning, and SIEMs.' },
];

const PLANS = [
  {
    name: 'Team',
    price: '$199',
    period: '/month',
    desc: 'Continuous offensive testing for engineering teams shipping web applications and APIs.',
    features: [
      '25 scans per month',
      'Web applications & REST APIs',
      'Proof of concept for every finding',
      'Downloadable code patches (.patch)',
      'Markdown developer guides (.md)',
      'Email support',
    ],
    cta: 'Start trial',
    href: '/auth?mode=signup',
    popular: false,
  },
  {
    name: 'Scale',
    price: '$599',
    period: '/month',
    desc: 'For organizations with complex microservices architectures and compliance mandates.',
    features: [
      '100 scans per month',
      'Everything in Team, plus:',
      'GraphQL, gRPC & Git repositories',
      'White-box hybrid correlation',
      'Executive PDF & SARIF v2.1.0 exports',
      'SOC 2, ISO 27001 & PCI DSS compliance mapping',
      'Jira, Slack & SIEM integrations',
      'Role-based access control',
      'Priority support',
    ],
    cta: 'Start trial',
    href: '/auth?mode=signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For enterprise security teams requiring dedicated VPC runners and custom model deployments.',
    features: [
      'Unlimited scans',
      'Self-hosted or private VPC execution runners',
      'Bring your own model (OpenAI / Anthropic / Local)',
      'SAML / OIDC single sign-on',
      'Custom rate limits & payload rules',
      'Dedicated security architect',
      'Custom SLA & 24/7 technical escalation',
    ],
    cta: 'Contact sales',
    href: '/auth?mode=signup',
    popular: false,
  },
];

const FAQS = [
  {
    q: 'How does RedSuture differ from legacy vulnerability scanners?',
    a: 'Legacy scanners rely on static regex and signature matching that produce excessive false positives. RedSuture deploys autonomous AI agents powered by OpenAI and Anthropic reasoning models that analyze business logic, chain multi-step exploits, and only report vulnerabilities that have been deterministically reproduced with working proof of concepts in a secure sandbox.',
  },
  {
    q: 'What remediation deliverables are provided after a scan?',
    a: 'Every validated vulnerability includes a complete remediation package downloadable from the dashboard: unified diff .patch files ready for your codebase, step-by-step Markdown developer guides, executive audit PDF reports with compliance mapping, and standard SARIF v2.1.0 files for SIEM or CI/CD ingestion.',
  },
  {
    q: 'Which AI reasoning models power the RedSuture platform?',
    a: 'RedSuture orchestrates state-of-the-art reasoning models from Anthropic (Claude 3.5 Sonnet / Opus) and OpenAI (GPT-4o, o1, o3-mini) across AST taint analysis, attack tree exploration, and surgical patch synthesis. Enterprise plans support bring-your-own-key (BYOK) and private VPC inference.',
  },
  {
    q: 'Is it safe to run scans against production infrastructure?',
    a: 'Yes. RedSuture operates with non-destructive payloads and intelligent adaptive rate limiting by default. Teams can also test staging environments, local directory trees, or Git repositories before deploying to production.',
  },
  {
    q: 'Are reports accepted by compliance auditors (SOC 2, ISO 27001, PCI DSS)?',
    a: 'Yes. Audit reports are structured according to the rigorous penetration testing standards required by SOC 2 Type II, ISO/IEC 27001, PCI DSS v4.0, HIPAA, and NIST CSF 2.0, documenting testing scope, methodology, CVSS v3.1 scoring, and verified remediation evidence.',
  },
  {
    q: 'What authorization is required before scanning?',
    a: 'You must possess documented ownership or explicit written authorization to perform security testing against the target assets. RedSuture strictly enforces organizational scope verification.',
  },
];

function SectionHeader({ eyebrow, title, sub, center = false }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`${styles.sectionHeader} ${center ? styles.sectionHeaderCenter : ''}`}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {sub && <p className={styles.sectionSub}>{sub}</p>}
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={styles.faqList}>
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
            <h3>
              <button
                className={styles.faqQuestion}
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
              >
                <span>{item.q}</span>
                <PlusIcon className={styles.faqIcon} />
              </button>
            </h3>
            <div id={`faq-${i}`} className={styles.faqAnswer} hidden={!isOpen}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const launchScan = useLaunchScan();
  return (
    <div className={styles.page}>
      <NavBar />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroBackdrop} aria-hidden="true" />
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <a href="#deliverables" className={styles.announce}>
                <span className={styles.announceTag}>Automated</span>
                Downloadable code patches &amp; step-by-step guides
                <ArrowRightIcon size={14} />
              </a>
              <h1 className={styles.heroTitle}>
                Autonomous offense.
                <span className={styles.heroTitleAccent}>Instant closure.</span>
              </h1>
              <p className={styles.heroSub}>
                RedSuture deploys autonomous AI reasoning agents that probe your web applications, APIs, and repositories for deep logic flaws — proving each vulnerability in an isolated sandbox and delivering downloadable, ready-to-apply surgical code patches.
              </p>
              <div className={styles.heroActions}>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`} onClick={launchScan}>
                  Launch a scan <ArrowRightIcon />
                </button>
                <a href="#deliverables" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnLg}`}>
                  View sample fixes
                </a>
              </div>
              <ul className={styles.heroPoints}>
                <li><CheckIcon /> Proof of concept for every finding</li>
                <li><CheckIcon /> Non-destructive safe payloads</li>
                <li><CheckIcon /> Downloadable code patches &amp; guides</li>
              </ul>
            </div>
            <div className={styles.heroVisual}>
              <HeroReport />
            </div>
          </div>
        </section>

        {/* Standards Banner */}
        <section id="compliance" className={styles.standards} aria-label="Compliance frameworks">
          <div className="container">
            <p className={styles.standardsLabel}>Audit-ready reports mapped to leading security frameworks</p>
            <ul className={styles.standardsList}>
              {STANDARDS.map(s => <li key={s}>{s}</li>)}
            </ul>
          </div>
        </section>

        {/* Active Threat Mitigation Coverage Ticker */}
        <section className={styles.tickerSection} aria-label="Active Threat Mitigation Coverage">
          <div className="container">
            <div className={styles.tickerHeader}>
              <span className={styles.tickerTag}>ACTIVE THREAT COVERAGE</span>
              <span className={styles.tickerSub}>Continuous autonomous testing across critical OWASP &amp; CWE vectors</span>
            </div>
          </div>
          <div className={styles.tickerWrap}>
            <div className={styles.tickerTrack}>
              {THREAT_VECTORS.concat(THREAT_VECTORS).map((vector, idx) => (
                <div key={idx} className={styles.tickerItem}>
                  <span className={styles.tickerDot} />
                  <span className={styles.tickerText}>{vector}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className={styles.section}>
          <div className="container">
            <SectionHeader
              eyebrow="How it works"
              title="From scope configuration to verified patch in minutes."
              sub="Traditional penetration tests take weeks to schedule and yield static PDFs. RedSuture executes autonomously whenever you ship and delivers surgical fixes your team can apply immediately."
            />
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li key={s.title} className={styles.step}>
                  <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Platform Bento */}
        <section id="platform" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <SectionHeader
              eyebrow="Platform"
              title="Findings you can verify. Fixes you can apply."
              sub="Every result is backed by sandboxed evidence and paired with surgical code patches written specifically for your stack."
            />
            <div className={styles.bento}>
              <article className={`${styles.card} ${styles.cardWide}`}>
                <div className={styles.cardIcon}><ShieldIcon /></div>
                <h3 className={styles.cardTitle}>Reproduced evidence, zero noise</h3>
                <p className={styles.cardDesc}>
                  Validation agents execute each attack tree in an isolated reproduction sandbox. Findings are only confirmed once a working proof of concept succeeds deterministically.
                </p>
                <div className={styles.evidence}>
                  <div className={styles.evidenceHead}>
                    <span>Evidence · BOLA on /api/v2/orders/:id</span>
                    <span className={styles.evidenceOk}><CheckIcon size={13} /> Reproduced 3/3</span>
                  </div>
                  <pre className={styles.code}>
<span className={styles.tokMuted}># Request as unprivileged tenant B for order owned by tenant A</span>{'\n'}
<span className={styles.tokKey}>GET</span> /api/v2/orders/10892?includeInvoice=true HTTP/1.1{'\n'}
Authorization: Bearer <span className={styles.tokStr}>&lt;tenant_b_session_jwt&gt;</span>{'\n'}
{'\n'}
<span className={styles.tokOk}>HTTP/1.1 200 OK</span>{'\n'}
{'{ '}<span className={styles.tokStr}>&quot;orderId&quot;</span>: 10892, <span className={styles.tokStr}>&quot;tenantId&quot;</span>: <span className={styles.tokStr}>&quot;tenant_alpha&quot;</span>, <span className={styles.tokStr}>&quot;amount&quot;</span>: 4200.00{' }'}
                  </pre>
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><CodeIcon /></div>
                <h3 className={styles.cardTitle}>Surgical code patches</h3>
                <p className={styles.cardDesc}>SutureEngine synthesizes typed, framework-specific diffs that resolve the root cause without side effects.</p>
                <pre className={`${styles.code} ${styles.codeSmall}`}>
<span className={styles.diffDel}>- const order = await db(&apos;orders&apos;).where({'{'} id {'}'}).first();</span>{'\n'}
<span className={styles.diffAdd}>+ const order = await db(&apos;orders&apos;)</span>{'\n'}
<span className={styles.diffAdd}>+   .where({'{'} id, tenant_id: req.user.tenantId {'}'})</span>{'\n'}
<span className={styles.diffAdd}>+   .first();</span>{'\n'}
<span className={styles.diffAdd}>+ if (!order) return res.status(404).json({'{'} error: &apos;Not found&apos; {'}'});</span>
                </pre>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><FileCheckIcon /></div>
                <h3 className={styles.cardTitle}>Downloadable remediation</h3>
                <p className={styles.cardDesc}>Download .patch diffs, step-by-step Markdown guides, executive PDF reports, and SARIF v2.1.0 files directly from your dashboard.</p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><GaugeIcon /></div>
                <h3 className={styles.cardTitle}>Safe by design</h3>
                <p className={styles.cardDesc}>Non-destructive payloads, adaptive rate limiting, and strict scope allowlists prevent disruption to production services.</p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><GitIcon /></div>
                <h3 className={styles.cardTitle}>Enterprise integrations</h3>
                <p className={styles.cardDesc}>Integrate findings seamlessly into GitHub code scanning, Jira issue tracking, SIEM platforms, and CI/CD pipelines.</p>
              </article>
            </div>
          </div>
        </section>

        {/* AI Engine */}
        <section id="engine" className={styles.section}>
          <div className="container">
            <SectionHeader
              eyebrow="Frontier AI reasoning"
              title="A coordinated red team of specialized AI agents."
              sub="Powered by frontier reasoning models from Anthropic and OpenAI, RedSuture’s agent pipeline traces authentication flows, business logic, and multi-step attack chains that signature tools fail to detect."
            />
            <ol className={styles.pipeline}>
              {AGENTS.map((a, i) => (
                <li key={a.name} className={`${styles.agent} ${i === AGENTS.length - 1 ? styles.agentFinal : ''}`}>
                  <span className={styles.agentIndex}>Agent {String(i + 1).padStart(2, '0')}</span>
                  <h3 className={styles.agentName}>{a.name}</h3>
                  <p className={styles.agentDesc}>{a.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Coverage */}
        <section id="coverage" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <SectionHeader
              eyebrow="Target architectures"
              title="Test the digital surfaces your organization relies on."
              sub="Select any combination of targets. Autonomous agents adapt their reconnaissance and offensive techniques to each architecture."
            />
            <div className={styles.targets}>
              {TARGETS.map(t => (
                <div key={t.title} className={styles.target}>
                  <div className={styles.targetIcon}>{t.icon}</div>
                  <div>
                    <h3 className={styles.targetTitle}>{t.title}</h3>
                    <p className={styles.targetDesc}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deliverables */}
        <section id="deliverables" className={styles.section}>
          <div className="container">
            <div className={styles.split}>
              <div>
                <SectionHeader
                  eyebrow="Remediation deliverables"
                  title="Everything your engineering team needs to close the flaw."
                  sub="Each finding is exported in standard formats designed for immediate developer action and compliance audits."
                />
                <ul className={styles.formats}>
                  {FORMATS.map(f => (
                    <li key={f.ext} className={styles.format}>
                      <code className={styles.formatExt}>{f.ext}</code>
                      <div>
                        <div className={styles.formatTitle}>{f.title}</div>
                        <p className={styles.formatDesc}>{f.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.window}>
                <div className={styles.windowBar}>
                  <span className={styles.windowDots}><i /><i /><i /></span>
                  <span className={styles.windowUrl}>src/controllers/orderController.ts</span>
                  <span className={styles.windowTag}>CWE-639 · CWE-89</span>
                </div>
                <pre className={`${styles.code} ${styles.diff}`}>
<span className={styles.diffHunk}>@@ -24,8 +24,14 @@ orderController.ts</span>{'\n'}
<span className={styles.diffDel}>- export async function getOrderDetails(req: Request, res: Response) {'{'}</span>{'\n'}
<span className={styles.diffDel}>-   const {'{'} orderId {'}'} = req.params;</span>{'\n'}
<span className={styles.diffDel}>-   const order = await db(&apos;orders&apos;).where({'{'} id: orderId {'}'}).first();</span>{'\n'}
<span className={styles.diffAdd}>+ export async function getOrderDetails(req: AuthenticatedRequest, res: Response) {'{'}</span>{'\n'}
<span className={styles.diffAdd}>+   const {'{'} orderId {'}'} = req.params;</span>{'\n'}
<span className={styles.diffAdd}>+   const sessionTenantId = req.user.tenantId;</span>{'\n'}
<span className={styles.diffAdd}>+</span>{'\n'}
<span className={styles.diffAdd}>+   // Enforce tenant boundary validation</span>{'\n'}
<span className={styles.diffAdd}>+   const order = await db(&apos;orders&apos;)</span>{'\n'}
<span className={styles.diffAdd}>+     .where({'{'} id: orderId, tenant_id: sessionTenantId {'}'})</span>{'\n'}
<span className={styles.diffAdd}>+     .first();</span>{'\n'}
<span className={styles.diffAdd}>+</span>{'\n'}
<span className={styles.diffAdd}>+   if (!order) return res.status(404).json({'{'} error: &apos;Order not found&apos; {'}'});</span>{'\n'}
<span className={styles.diffCtx}>    return res.status(200).json(order);</span>{'\n'}
<span className={styles.diffCtx}>  {'}'}</span>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <SectionHeader
              center
              eyebrow="Pricing"
              title="Transparent, predictable pricing."
              sub="Continuous autonomous security testing at a fraction of traditional consultancy retainers."
            />
            <div className={styles.pricing}>
              {PLANS.map(plan => (
                <div key={plan.name} className={`${styles.plan} ${plan.popular ? styles.planPopular : ''}`}>
                  <div className={styles.planHead}>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    {plan.popular && <span className={styles.planBadge}>Most popular</span>}
                  </div>
                  <p className={styles.planDesc}>{plan.desc}</p>
                  <div className={styles.planPrice}>
                    <span className={styles.planAmount}>{plan.price}</span>
                    {plan.period && <span className={styles.planPeriod}>{plan.period}</span>}
                  </div>
                  <Link
                    href={plan.href}
                    className={`${styles.btn} ${plan.popular ? styles.btnPrimary : styles.btnSecondary} ${styles.btnBlock}`}
                  >
                    {plan.cta}
                  </Link>
                  <ul className={styles.planFeatures}>
                    {plan.features.map(f => (
                      f.endsWith(':')
                        ? <li key={f} className={styles.planFeatureNote}>{f}</li>
                        : <li key={f}><CheckIcon className={styles.planCheck} />{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={styles.section}>
          <div className={`container ${styles.faqLayout}`}>
            <SectionHeader
              eyebrow="FAQ"
              title="Frequently asked questions."
              sub="Key technical details regarding our autonomous AI security platform, target architectures, and remediation deliverables."
            />
            <Faq />
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <div className={styles.ctaBox}>
              <h2 className={styles.ctaTitle}>Discover what an attacker would exploit — before they do.</h2>
              <p className={styles.ctaSub}>Launch your first autonomous scan in seconds. Get verified proof of concepts and downloadable code patches immediately.</p>
              <div className={styles.ctaActions}>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`} onClick={launchScan}>
                  Start a scan <ArrowRightIcon />
                </button>
                <Link href="/auth" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnLg}`}>
                  Sign in to workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <Logo />
              <p>Autonomous AI penetration testing with sandbox-verified proof of concepts and surgical code patches.</p>
              <p className={styles.footerStudio}>A product of <strong>NextAI Studios</strong></p>
            </div>
            <div className={styles.footerCols}>
              <div className={styles.footerCol}>
                <h4>Product</h4>
                <a href="#how-it-works">How it works</a>
                <a href="#platform">Platform</a>
                <a href="#engine">AI engine</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Resources</h4>
                <a href="#coverage">Target architectures</a>
                <a href="#deliverables">Remediation guides</a>
                <a href="#faq">FAQ</a>
                <Link href="/dashboard" onClick={launchScan}>Dashboard</Link>
              </div>
              <div className={styles.footerCol}>
                <h4>Legal &amp; Trust</h4>
                <a href="#">Responsible disclosure</a>
                <a href="#">Privacy policy</a>
                <a href="#">Terms of service</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} NextAI Studios. All rights reserved.</p>
            <p>For authorized security testing only. Scan only assets within your legal authorization.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
