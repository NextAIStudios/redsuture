'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

const THREATS = ['SQL Injection', 'XSS Attacks', 'CSRF Vulnerabilities', 'Auth Bypass', 'SSRF Exploits', 'API Misconfigs', 'RCE Vectors', 'JWT Attacks'];

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
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span>RedSuture</span>
        </Link>
        <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>
        <div className={styles.navActions}>
          <Link href="/auth" className="btn-ghost">Sign In</Link>
          <Link href="/auth?mode=signup" className="btn-primary">
            Start Free Trial
            <span>→</span>
          </Link>
        </div>
        <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}

function HeroTerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const [threatIdx, setThreatIdx] = useState(0);
  const terminalLines = [
    '> redsuture scan --target https://myapp.com --mode quick',
    '  Initializing AI pentest agents...',
    '  [●] Recon & Surface Mapping Agent — active',
    '  [●] Exploitation Agent — active',
    '  [●] Validation Agent — active',
    '  Scanning endpoints... 47 found',
    '  ⚠ CVE-2024-1234: SQL Injection in /api/users',
    '  ⚠ High: Auth bypass via JWT manipulation',
    '  ✓ Generating PoC exploits...',
    '  ✓ Patch recommendations ready',
    '  ─────────────────────────────',
    '  Scan complete. 3 critical, 5 high, 2 medium',
    '  Report saved → /results/myapp_scan_2024.pdf',
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < terminalLines.length) {
        setLines(prev => [...prev, terminalLines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => { setLines([]); i = 0; }, 3000);
      }
    }, 280);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setThreatIdx(prev => (prev + 1) % THREATS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalHeader}>
        <div className={styles.termDot} style={{ background: '#ff5f56' }} />
        <div className={styles.termDot} style={{ background: '#ffbd2e' }} />
        <div className={styles.termDot} style={{ background: '#27c93f' }} />
        <span className={styles.termTitle}>redsuture — ai-pentest-agent</span>
      </div>
      <div className={styles.terminalBody}>
        {lines.filter(Boolean).map((line, i) => (
          <div
            key={i}
            className={`${styles.termLine} ${line?.includes('⚠') ? styles.termWarn : line?.includes('✓') ? styles.termSuccess : line?.startsWith('>') ? styles.termCmd : ''}`}
          >
            {line}
          </div>
        ))}
        <span className={styles.termCursor}>█</span>
      </div>
    </div>
  );
}

const features = [
  {
    icon: '🤖',
    title: 'Multi-Agent AI Pentest',
    desc: 'Teams of specialized AI agents — recon, exploitation, validation — work in parallel like a real red team, finding vulnerabilities humans miss.',
  },
  {
    icon: '⚡',
    title: 'Real Exploit Validation',
    desc: 'Not just alerts — working proof-of-concept exploits for every finding. Zero false positives. Every vulnerability is confirmed before you see it.',
  },
  {
    icon: '🔍',
    title: 'Full Attack Surface Coverage',
    desc: 'Web apps, REST APIs, GraphQL, mobile backends, and cloud infrastructure. Covers all OWASP Top 10 and beyond.',
  },
  {
    icon: '🩹',
    title: 'One-Click Auto-Fix',
    desc: 'AI generates surgical code patches for every vulnerability found. Review and merge — no manual remediation required.',
  },
  {
    icon: '🔁',
    title: 'CI/CD Integration',
    desc: 'Scan on every pull request. Block vulnerable code before it reaches production with GitHub Actions, GitLab CI, and more.',
  },
  {
    icon: '📄',
    title: 'Compliance Reports',
    desc: 'Automatic pentest reports ready for SOC 2, ISO 27001, and PCI DSS audits. Impress your enterprise customers.',
  },
];

const steps = [
  { num: '01', title: 'Connect Your App', desc: 'Paste your URL, upload an API spec, or connect your repo. Takes 30 seconds.' },
  { num: '02', title: 'AI Agents Attack', desc: 'Autonomous AI hackers probe every endpoint, trying real exploits like a real attacker would.' },
  { num: '03', title: 'Get Instant Results', desc: 'Live dashboard shows findings as they\'re discovered. Every vuln includes a PoC and severity score.' },
  { num: '04', title: 'Fix & Verify', desc: 'Apply AI-generated patches, then re-scan to verify the fix. Ship with confidence.' },
];

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    desc: 'Perfect for indie developers and small teams.',
    features: ['10 scans / month', 'Quick scan mode', 'Web app testing', 'Email reports', '1 user seat', 'Community support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/month',
    desc: 'For growing startups shipping fast.',
    features: ['50 scans / month', 'Quick + Standard modes', 'Web, API & Mobile', 'PDF + SARIF reports', '5 user seats', 'CI/CD integration', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Business',
    price: '$499',
    period: '/month',
    desc: 'For security-conscious engineering teams.',
    features: ['200 scans / month', 'All scan modes', 'Unlimited app types', 'SOC 2, PCI DSS reports', '20 user seats', 'Slack + Jira integration', 'Dedicated support', 'Auto-fix PRs'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations with compliance needs.',
    features: ['Unlimited scans', 'White-label option', 'SSO (SAML/OIDC)', 'Custom compliance reports', 'Unlimited users', 'VPC / self-hosted deploy', 'SLA guarantee', 'Dedicated security team'],
    cta: 'Contact Sales',
    popular: false,
  },
];

const testimonials = [
  { name: 'Alex Chen', role: 'CTO at Nexus Labs', text: 'RedSuture found 3 critical vulnerabilities in our API that our internal team missed. The PoC exploits made it impossible to ignore.', avatar: 'AC' },
  { name: 'Sarah Okonkwo', role: 'Lead Engineer at Paystream', text: 'We integrated RedSuture into our CI pipeline. Now every PR gets automatically scanned. It\'s like having a security engineer on every commit.', avatar: 'SO' },
  { name: 'Marcus Rivera', role: 'Founder at AppForge', text: 'As a solo dev, I can\'t afford a pentesting firm. RedSuture gives me enterprise-level security testing at a price I can actually afford.', avatar: 'MR' },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <NavBar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroLeft}>
            <div className={`badge badge-red ${styles.heroBadge}`}>
              <span className={styles.pulseDot} />
              AI Pentest Agents — Live
            </div>
            <h1 className={styles.heroTitle}>
              Autonomous offense.<br />
              <span className={styles.heroTitleAccent}>Instant closure.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              RedSuture deploys AI hacker agents that attack your app the way real attackers do — finding, exploiting, and helping you fix vulnerabilities before they cost you everything.
            </p>
            <div className={styles.heroActions}>
              <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '14px 28px' }}>
                Start Free Scan →
              </Link>
              <a href="#how-it-works" className="btn-secondary">
                See How It Works
              </a>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>10K+</span>
                <span className={styles.heroStatLabel}>Vulns Found</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>500+</span>
                <span className={styles.heroStatLabel}>Apps Secured</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>0</span>
                <span className={styles.heroStatLabel}>False Positives</span>
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <HeroTerminal />
          </div>
        </div>
        <div className={styles.heroScroll}>
          <div className={styles.scrollDot} />
        </div>
      </section>

      {/* Threat ticker */}
      <div className={styles.ticker}>
        <div className={styles.tickerLabel}>THREATS DETECTED TODAY</div>
        <div className={styles.tickerTrack}>
          {[...THREATS, ...THREATS].map((t, i) => (
            <span key={i} className={styles.tickerItem}>
              <span className={styles.tickerDot} /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-red">Capabilities</span>
            <h2 className={styles.sectionTitle}>Hacker-grade tools.<br />Developer-friendly interface.</h2>
            <p className={styles.sectionSub}>Everything you need to find, validate, and fix security vulnerabilities — without a dedicated security team.</p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={styles.section} style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-red">Process</span>
            <h2 className={styles.sectionTitle}>From target to patched<br />in minutes, not weeks.</h2>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <div key={i} className={styles.stepCard}>
                <div className={styles.stepNum}>{s.num}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
                {i < steps.length - 1 && <div className={styles.stepArrow}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-red">Pricing</span>
            <h2 className={styles.sectionTitle}>Transparent pricing.<br />No surprises.</h2>
            <p className={styles.sectionSub}>14-day free trial on all plans. No credit card required.</p>
          </div>
          <div className={styles.pricingGrid}>
            {plans.map((p, i) => (
              <div key={i} className={`${styles.pricingCard} ${p.popular ? styles.pricingCardPopular : ''}`}>
                {p.popular && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.pricingHeader}>
                  <h3 className={styles.planName}>{p.name}</h3>
                  <div className={styles.planPrice}>
                    <span className={styles.planAmount}>{p.price}</span>
                    <span className={styles.planPeriod}>{p.period}</span>
                  </div>
                  <p className={styles.planDesc}>{p.desc}</p>
                </div>
                <ul className={styles.planFeatures}>
                  {p.features.map((f, j) => (
                    <li key={j} className={styles.planFeature}>
                      <span className={styles.checkmark}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.name === 'Enterprise' ? '#contact' : '/auth?mode=signup'}
                  className={p.popular ? 'btn-primary' : 'btn-secondary'}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.section} style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-red">Testimonials</span>
            <h2 className={styles.sectionTitle}>Trusted by builders<br />who ship fast.</h2>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <p className={styles.testimonialText}>"{t.text}"</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>{t.avatar}</div>
                  <div>
                    <div className={styles.testimonialName}>{t.name}</div>
                    <div className={styles.testimonialRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Start protecting your app today.</h2>
          <p className={styles.ctaSub}>14-day free trial. No credit card. No setup. Just security.</p>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 36px' }}>
            Launch Your First Scan →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.logo} style={{ fontSize: '1.3rem', marginBottom: '12px' }}>
                <span className={styles.logoIcon}>⬡</span> RedSuture
              </div>
              <p className={styles.footerTagline}>Autonomous offense. Instant closure.</p>
              <p className={styles.footerStudio}>
                A product of{' '}
                <span className={styles.studioName}>NextAI Studios</span>
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Product</div>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#how-it-works">How It Works</a>
                <Link href="/dashboard">Dashboard</Link>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Company</div>
                <a href="#">About NextAI Studios</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#contact">Contact</a>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Legal</div>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Security</a>
                <a href="#">Responsible Disclosure</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 RedSuture by NextAI Studios. All rights reserved.</p>
            <p className={styles.footerWarning}>⚠ Authorized use only. Only scan apps you own or have explicit permission to test.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
