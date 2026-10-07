'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Logo from './components/Logo';
import {
  ShieldIcon, CodeIcon, GitIcon, GaugeIcon, FileCheckIcon, GlobeIcon, LayersIcon,
  FolderIcon, ApiIcon, ListIcon, CheckIcon, ArrowRightIcon, PlusIcon,
} from './components/icons';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#platform', label: 'Platform' },
  { href: '#coverage', label: 'Coverage' },
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
          <Link href="/auth?mode=signup" className={`${styles.btn} ${styles.btnPrimary}`}>
            Start a scan
          </Link>
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
            <Link href="/auth?mode=signup" className={`${styles.btn} ${styles.btnPrimary}`} onClick={close}>Start a scan</Link>
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
  { level: 'critical', title: 'Broken object level authorization', where: 'GET /v2/orders/{id}' },
  { level: 'high', title: 'SQL injection in search filter', where: 'POST /v2/search' },
  { level: 'high', title: 'JWT accepts unsigned tokens', where: 'POST /auth/session' },
  { level: 'medium', title: 'SSRF via webhook callback URL', where: 'POST /v2/webhooks' },
];

function HeroReport() {
  return (
    <div className={styles.window} aria-label="Example RedSuture scan report">
      <div className={styles.windowBar}>
        <span className={styles.windowDots}><i /><i /><i /></span>
        <span className={styles.windowUrl}>app.redsuture.com/scans/api.example.com</span>
      </div>

      <div className={styles.reportHead}>
        <div>
          <div className={styles.reportTarget}>api.example.com</div>
          <div className={styles.reportMeta}>
            <span className={styles.statusDot} /> Scan complete · Web + API · 38 min
          </div>
        </div>
        <span className={styles.reportBadge}>9 verified findings</span>
      </div>

      <div className={styles.reportStats}>
        {([['critical', 1], ['high', 3], ['medium', 2], ['low', 3]] as [Severity, number][]).map(([level, n]) => (
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
          <code>.patch</code><code>.pdf</code><code>.sarif</code>
        </span>
        <span className={styles.reportAction}>
          <GitIcon size={14} /> Open fix PR
        </span>
      </div>
    </div>
  );
}

const STANDARDS = ['SOC 2 Type II', 'ISO/IEC 27001', 'PCI DSS v4.0', 'HIPAA', 'OWASP Top 10', 'NIST CSF 2.0'];

const STEPS = [
  {
    title: 'Define the scope',
    desc: 'Point RedSuture at a live URL, an API, a Git repository, or all three for white-box testing. You decide what is in scope and how hard it is pushed.',
  },
  {
    title: 'Agents attack and validate',
    desc: 'Reconnaissance, exploitation and validation agents work in parallel. A finding is only reported once a proof of concept reproduces it in an isolated sandbox.',
  },
  {
    title: 'Review and ship the fix',
    desc: 'Every finding includes severity, evidence, root cause and a code fix. Download the patch or open a pull request straight from the dashboard.',
  },
];

const TARGETS = [
  { icon: <GlobeIcon />, title: 'Web applications', desc: 'SPAs, server-rendered apps and staging environments, tested black-box.' },
  { icon: <ApiIcon />, title: 'REST, GraphQL & gRPC APIs', desc: 'Auth flows, object-level access, token handling and schema exposure.' },
  { icon: <GitIcon />, title: 'Git repositories', desc: 'GitHub, GitLab and Bitbucket — taint analysis, secrets and logic flaws.' },
  { icon: <FolderIcon />, title: 'Local codebases', desc: 'Pre-deployment services and packages, before they reach production.' },
  { icon: <LayersIcon />, title: 'White-box hybrid', desc: 'Source code and live endpoints together for deeper, code-informed exploits.' },
  { icon: <ListIcon />, title: 'Bulk scope lists', desc: 'Portfolios of domains and microservices, prioritized automatically.' },
];

const VULN_CLASSES = [
  'Broken object level authorization',
  'SQL & NoSQL injection',
  'Server-side request forgery',
  'JWT & cryptographic flaws',
  'GraphQL introspection abuse',
  'Privilege escalation chains',
  'Remote code execution',
  'Cross-site scripting',
  'Rate-limit & business logic bypass',
  'Dependency & CI/CD poisoning',
];

const AGENTS = [
  { name: 'Recon', desc: 'Maps endpoints, auth flows and the reachable attack surface.' },
  { name: 'Exploitation', desc: 'Builds attack trees and executes multi-step exploit chains.' },
  { name: 'Validation', desc: 'Reproduces each exploit in a sandbox and scores it with CVSS.' },
  { name: 'SutureEngine', desc: 'Writes the root-cause analysis, guide and code patch.' },
];

const FORMATS = [
  { ext: '.patch', title: 'Code patch', desc: 'Ready-to-apply diff in your framework, or opened as a GitHub pull request.' },
  { ext: '.md', title: 'Developer guide', desc: 'Root cause, step-by-step fix and a test to confirm the issue is closed.' },
  { ext: '.pdf', title: 'Executive report', desc: 'CVSS-scored findings, risk summary and compliance mapping for leadership.' },
  { ext: '.sarif', title: 'SARIF 2.1.0', desc: 'Drops into GitHub code scanning, CI pipelines and your SIEM.' },
];

const PLANS = [
  {
    name: 'Team',
    price: '$199',
    period: '/month',
    desc: 'Continuous testing for product teams shipping web apps and APIs.',
    features: [
      '25 scans per month',
      'Web applications & REST APIs',
      'Proof of concept for every finding',
      'Remediation guides & code patches',
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
    desc: 'For growing companies with complex architectures and audits to pass.',
    features: [
      '100 scans per month',
      'Everything in Team, plus:',
      'GraphQL, gRPC & mobile backends',
      'Git repositories & white-box testing',
      'PDF, SARIF & patch exports',
      'SOC 2, ISO 27001 & PCI DSS reports',
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
    desc: 'For security teams that need private deployment and dedicated support.',
    features: [
      'Unlimited scans',
      'Self-hosted or private VPC runners',
      'Bring your own model',
      'SAML / OIDC single sign-on',
      'Custom payload rules & throttling',
      'Dedicated security architect',
      'Custom SLA & 24/7 escalation',
    ],
    cta: 'Contact sales',
    href: '/auth?mode=signup',
    popular: false,
  },
];

const FAQS = [
  {
    q: 'How is RedSuture different from a vulnerability scanner?',
    a: 'Scanners match signatures and report anything that looks suspicious. RedSuture’s agents reason through your application the way an attacker would — chaining requests, abusing business logic and escalating privileges — and only report a finding once it has been reproduced with a working proof of concept.',
  },
  {
    q: 'Is it safe to run against production?',
    a: 'Scans use non-destructive payloads and adaptive rate limiting by default, and you can tune throttling per target. Most teams start with staging or preview environments, then move to continuous testing in production.',
  },
  {
    q: 'What do we receive at the end of a scan?',
    a: 'Each finding includes severity, request and response evidence, root-cause analysis and a code fix. Results can be exported as a .patch file, a Markdown developer guide, an executive PDF report and SARIF 2.1.0 — or pushed to GitHub as a pull request.',
  },
  {
    q: 'Which AI models power RedSuture?',
    a: 'RedSuture orchestrates frontier reasoning models from Anthropic and OpenAI through the Strix agent framework. Enterprise customers can bring their own model or run inference privately.',
  },
  {
    q: 'Will the reports work for SOC 2, ISO 27001 or PCI DSS audits?',
    a: 'Reports are structured around the penetration testing requirements of SOC 2 Type II, ISO/IEC 27001, PCI DSS v4.0 and HIPAA, covering scope, methodology, CVSS-scored findings and remediation evidence. Confirm specific requirements with your auditor.',
  },
  {
    q: 'Do we need permission to test a target?',
    a: 'Yes. You may only scan applications and infrastructure you own or have explicit written authorization to test. Unauthorized testing is illegal and violates our terms of service.',
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
                <span className={styles.announceTag}>New</span>
                Push verified fixes straight to GitHub pull requests
                <ArrowRightIcon size={14} />
              </a>
              <h1 className={styles.heroTitle}>
                Autonomous offense.
                <span className={styles.heroTitleAccent}>Instant closure.</span>
              </h1>
              <p className={styles.heroSub}>
                RedSuture deploys AI agents that attack your web apps, APIs and code the way a real adversary would — then proves every finding with a working exploit and hands your team a ready-to-merge fix.
              </p>
              <div className={styles.heroActions}>
                <Link href="/auth?mode=signup" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}>
                  Start a scan <ArrowRightIcon />
                </Link>
                <a href="#deliverables" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnLg}`}>
                  See a sample report
                </a>
              </div>
              <ul className={styles.heroPoints}>
                <li><CheckIcon /> Proof of concept for every finding</li>
                <li><CheckIcon /> Non-destructive by default</li>
                <li><CheckIcon /> Fixes as patches or pull requests</li>
              </ul>
            </div>
            <div className={styles.heroVisual}>
              <HeroReport />
            </div>
          </div>
        </section>

        {/* Standards */}
        <section id="compliance" className={styles.standards} aria-label="Compliance frameworks">
          <div className="container">
            <p className={styles.standardsLabel}>Reports mapped to the frameworks your auditors use</p>
            <ul className={styles.standardsList}>
              {STANDARDS.map(s => <li key={s}>{s}</li>)}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className={styles.section}>
          <div className="container">
            <SectionHeader
              eyebrow="How it works"
              title="From scope to merged fix, without the six-week wait."
              sub="Traditional pentests are point-in-time and slow to act on. RedSuture runs whenever you ship and delivers results your engineers can act on the same day."
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

        {/* Platform */}
        <section id="platform" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <SectionHeader
              eyebrow="Platform"
              title="Findings you can trust. Fixes you can merge."
              sub="Every result is backed by evidence and paired with remediation written for your codebase — not a generic advisory."
            />
            <div className={styles.bento}>
              <article className={`${styles.card} ${styles.cardWide}`}>
                <div className={styles.cardIcon}><ShieldIcon /></div>
                <h3 className={styles.cardTitle}>Proof, not guesses</h3>
                <p className={styles.cardDesc}>
                  The validation agent replays each exploit in an isolated sandbox. If it can&apos;t be reproduced, it isn&apos;t reported — so your team stops triaging noise.
                </p>
                <div className={styles.evidence}>
                  <div className={styles.evidenceHead}>
                    <span>Evidence · BOLA on /v2/orders</span>
                    <span className={styles.evidenceOk}><CheckIcon size={13} /> Reproduced 3/3</span>
                  </div>
                  <pre className={styles.code}>
<span className={styles.tokMuted}># Request as user B for an order owned by user A</span>{'\n'}
<span className={styles.tokKey}>GET</span> /v2/orders/8812 HTTP/1.1{'\n'}
Authorization: Bearer <span className={styles.tokStr}>&lt;user_b_token&gt;</span>{'\n'}
{'\n'}
<span className={styles.tokOk}>HTTP/1.1 200 OK</span>{'\n'}
{'{ '}<span className={styles.tokStr}>&quot;order_id&quot;</span>: 8812, <span className={styles.tokStr}>&quot;owner&quot;</span>: <span className={styles.tokStr}>&quot;user_a&quot;</span>, <span className={styles.tokStr}>&quot;card_last4&quot;</span>: <span className={styles.tokStr}>&quot;4242&quot;</span>{' }'}
                  </pre>
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><CodeIcon /></div>
                <h3 className={styles.cardTitle}>Fixes in your stack</h3>
                <p className={styles.cardDesc}>SutureEngine writes framework-specific patches with the root cause explained line by line.</p>
                <pre className={`${styles.code} ${styles.codeSmall}`}>
<span className={styles.diffDel}>- const order = await db.orders.find(id);</span>{'\n'}
<span className={styles.diffAdd}>+ const order = await db.orders.find(</span>{'\n'}
<span className={styles.diffAdd}>+   {'{'} id, ownerId: req.user.id {'}'}</span>{'\n'}
<span className={styles.diffAdd}>+ );</span>{'\n'}
<span className={styles.diffAdd}>+ if (!order) throw new NotFound();</span>
                </pre>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><GitIcon /></div>
                <h3 className={styles.cardTitle}>Fits your workflow</h3>
                <p className={styles.cardDesc}>Scan on every pull request, send SARIF to GitHub code scanning, and route findings to Jira or Slack.</p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><GaugeIcon /></div>
                <h3 className={styles.cardTitle}>Safe by default</h3>
                <p className={styles.cardDesc}>Non-destructive payloads, adaptive rate limiting and strict scope allowlists keep production stable.</p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}><FileCheckIcon /></div>
                <h3 className={styles.cardTitle}>Audit-ready reporting</h3>
                <p className={styles.cardDesc}>Executive PDFs with CVSS scoring and mapping to SOC 2, ISO 27001, PCI DSS and HIPAA.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Agents */}
        <section id="engine" className={styles.section}>
          <div className="container">
            <SectionHeader
              eyebrow="AI engine"
              title="A coordinated red team of agents, not a rule list."
              sub="Built on frontier reasoning models from Anthropic and OpenAI, RedSuture’s agents work through authentication flows, business logic and multi-step exploit chains that signature-based tools miss."
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
              eyebrow="Coverage"
              title="Test the assets your business actually runs on."
              sub="Choose any combination of targets. Agents adapt their techniques to each one."
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
            <div className={styles.vulns}>
              <span className={styles.vulnsLabel}>Including</span>
              <ul className={styles.vulnList}>
                {VULN_CLASSES.map(v => <li key={v}>{v}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* Deliverables */}
        <section id="deliverables" className={styles.section}>
          <div className="container">
            <div className={styles.split}>
              <div>
                <SectionHeader
                  eyebrow="Deliverables"
                  title="Everything your team needs to close the issue."
                  sub="Each finding ships as a complete remediation package, in the format that fits how you work."
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
                  <span className={styles.windowUrl}>src/controllers/transactions.ts</span>
                  <span className={styles.windowTag}>CWE-89 · CWE-639</span>
                </div>
                <pre className={`${styles.code} ${styles.diff}`}>
<span className={styles.diffHunk}>@@ -12,8 +12,14 @@ transactions.ts</span>{'\n'}
<span className={styles.diffDel}>- export async function getTransactions(req: Request, res: Response) {'{'}</span>{'\n'}
<span className={styles.diffDel}>-   const {'{'} accountId {'}'} = req.body;</span>{'\n'}
<span className={styles.diffDel}>-   const sql = &quot;SELECT * FROM tx WHERE account_id = &apos;&quot; + accountId + &quot;&apos;&quot;;</span>{'\n'}
<span className={styles.diffDel}>-   const records = await db.raw(sql);</span>{'\n'}
<span className={styles.diffAdd}>+ export async function getTransactions(req: AuthedRequest, res: Response) {'{'}</span>{'\n'}
<span className={styles.diffAdd}>+   const {'{'} accountId {'}'} = req.params;</span>{'\n'}
<span className={styles.diffAdd}>+   const userId = req.user.id;</span>{'\n'}
<span className={styles.diffAdd}>+</span>{'\n'}
<span className={styles.diffAdd}>+   // Enforce tenant boundary before any data access</span>{'\n'}
<span className={styles.diffAdd}>+   await verifyAccountOwnership(userId, accountId);</span>{'\n'}
<span className={styles.diffAdd}>+</span>{'\n'}
<span className={styles.diffAdd}>+   // Parameterized query scoped to the caller</span>{'\n'}
<span className={styles.diffAdd}>+   const records = await db(&apos;transactions&apos;)</span>{'\n'}
<span className={styles.diffAdd}>+     .where({'{'} account_id: accountId, user_id: userId {'}'})</span>{'\n'}
<span className={styles.diffAdd}>+     .select(&apos;id&apos;, &apos;amount&apos;, &apos;timestamp&apos;, &apos;status&apos;);</span>{'\n'}
<span className={styles.diffCtx}>    return res.json(records);</span>{'\n'}
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
              title="Simple, predictable plans."
              sub="Continuous offensive testing for a fraction of a traditional consultancy retainer."
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
              title="Questions, answered."
              sub="Can’t find what you’re looking for? Our security team is happy to walk you through a scan."
            />
            <Faq />
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <div className={styles.ctaBox}>
              <h2 className={styles.ctaTitle}>See what an attacker would find — before they do.</h2>
              <p className={styles.ctaSub}>Launch your first scan in minutes. Verified findings and ready-to-merge fixes, delivered to your dashboard.</p>
              <div className={styles.ctaActions}>
                <Link href="/auth?mode=signup" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}>
                  Start a scan <ArrowRightIcon />
                </Link>
                <Link href="/auth" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnLg}`}>
                  Sign in to dashboard
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
              <p>AI-powered penetration testing with verified findings and ready-to-merge fixes.</p>
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
                <a href="#coverage">Coverage</a>
                <a href="#deliverables">Sample report</a>
                <a href="#faq">FAQ</a>
                <Link href="/dashboard">Dashboard</Link>
              </div>
              <div className={styles.footerCol}>
                <h4>Legal</h4>
                <a href="#">Responsible disclosure</a>
                <a href="#">Privacy policy</a>
                <a href="#">Terms of service</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} NextAI Studios. All rights reserved.</p>
            <p>For authorized security testing only. Scan only assets you own or have written permission to test.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
