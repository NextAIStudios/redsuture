'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './auth.module.css';
import Logo from '../components/Logo';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '../components/icons';
import { saveSignupDraft, setAuthed } from '../lib/profile';

type Mode = 'signin' | 'signup';

const PREVIEW_FINDINGS = [
  { level: 'critical', label: 'Critical', title: 'Broken object level authorization', where: 'GET /v2/orders/{id}' },
  { level: 'high', label: 'High', title: 'JWT accepts unsigned tokens', where: 'POST /auth/session' },
  { level: 'medium', label: 'Medium', title: 'SSRF via webhook callback URL', where: 'POST /v2/webhooks' },
];

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(() => (searchParams.get('mode') === 'signup' ? 'signup' : 'signin'));
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setAuthed(true);
    if (mode === 'signup') {
      // New users complete onboarding (company + website) before the dashboard.
      saveSignupDraft({ name: form.name, email: form.email, company: form.company });
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className={styles.page}>
      <div className={styles.formPanel}>
        <header className={styles.topBar}>
          <Link href="/" aria-label="RedSuture home"><Logo /></Link>
          <Link href="/" className={styles.backLink}>
            <ArrowLeftIcon size={14} /> Back to site
          </Link>
        </header>

        <main className={styles.formWrap}>
          <div className={styles.formInner}>
            <h1 className={styles.title}>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
            <p className={styles.subtitle}>
              {isSignup
                ? 'Start a 14-day free trial. No credit card required.'
                : 'Sign in to your RedSuture workspace.'}
            </p>

            <div className={styles.segmented} role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={!isSignup}
                className={`${styles.segment} ${!isSignup ? styles.segmentActive : ''}`}
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSignup}
                className={`${styles.segment} ${isSignup ? styles.segmentActive : ''}`}
                onClick={() => setMode('signup')}
              >
                Create account
              </button>
            </div>

            <div className={styles.socialBtns}>
              <button type="button" className={styles.socialBtn}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                Continue with GitHub
              </button>
              <button type="button" className={styles.socialBtn}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
            </div>

            <div className={styles.divider}><span>or with email</span></div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {isSignup && (
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="name" className={styles.label}>Full name</label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      className={styles.input}
                      placeholder="Alex Chen"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="company" className={styles.label}>
                      Company <span className={styles.optional}>Optional</span>
                    </label>
                    <input
                      id="company"
                      type="text"
                      autoComplete="organization"
                      className={styles.input}
                      placeholder="Acme Inc."
                      value={form.company}
                      onChange={e => setForm({ ...form, company: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Work email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={styles.input}
                  placeholder="alex@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  className={styles.input}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              {isSignup && (
                <p className={styles.terms}>
                  By creating an account you agree to our <a href="#">Terms of Service</a> and{' '}
                  <a href="#">Privacy Policy</a>, and confirm you will only scan assets you own or have
                  written permission to test.
                </p>
              )}

              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading ? (
                  <><span className={styles.spinner} aria-hidden="true" /> {isSignup ? 'Creating account…' : 'Signing in…'}</>
                ) : (
                  <>{isSignup ? 'Create account' : 'Sign in'} <ArrowRightIcon /></>
                )}
              </button>
            </form>

            <p className={styles.switchMode}>
              {isSignup ? 'Already have an account?' : 'New to RedSuture?'}{' '}
              <button type="button" className={styles.switchBtn} onClick={() => setMode(isSignup ? 'signin' : 'signup')}>
                {isSignup ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </main>

        <footer className={styles.footer}>
          <span>&copy; {new Date().getFullYear()} NextAI Studios</span>
          <span>For authorized security testing only.</span>
        </footer>
      </div>

      <aside className={styles.brandPanel} aria-hidden="true">
        <div className={styles.brandInner}>
          <p className={styles.brandEyebrow}>Autonomous offense. Instant closure.</p>
          <h2 className={styles.brandTitle}>Find what an attacker would — and ship the fix the same day.</h2>

          <div className={styles.preview}>
            <div className={styles.previewHead}>
              <span className={styles.previewTarget}>api.example.com</span>
              <span className={styles.previewStatus}><span className={styles.statusDot} /> Scan complete</span>
            </div>
            <ul className={styles.previewList}>
              {PREVIEW_FINDINGS.map(f => (
                <li key={f.title} className={styles.previewRow}>
                  <span className={`${styles.sev} ${styles[`sev_${f.level}`]}`}>{f.label}</span>
                  <span className={styles.previewText}>
                    <span className={styles.previewTitle}>{f.title}</span>
                    <code className={styles.previewWhere}>{f.where}</code>
                  </span>
                  <span className={styles.previewVerified}><CheckIcon size={13} /> Verified</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className={styles.brandPoints}>
            <li><CheckIcon /> Proof of concept for every finding</li>
            <li><CheckIcon /> Non-destructive by default</li>
            <li><CheckIcon /> Downloadable code patches and guides</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
