'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';
import Logo from '../components/Logo';
import { ArrowRightIcon, CheckIcon, GlobeIcon, LayersIcon } from '../components/icons';
import {
  loadSignupDraft,
  clearSignupDraft,
  saveProfile,
  generateOrgId,
  setAuthed,
  type Profile,
} from '../lib/profile';

function normalizeWebsite(value: string): string {
  const v = value.trim();
  if (!v) return v;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const draft = loadSignupDraft();
    if (!draft) return;
    // Hydration-safe read of the client-only signup draft after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(draft.name || '');
    setEmail(draft.email || '');
    setCompany(draft.company || '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const profile: Profile = {
      name: name.trim() || 'New user',
      email: email.trim(),
      company: company.trim(),
      website: normalizeWebsite(website),
      orgId: generateOrgId(),
      plan: 'Pro',
      role: 'admin',
      twoFactor: false,
      createdAt: new Date().toISOString(),
    };

    saveProfile(profile);
    setAuthed(true);
    clearSignupDraft();

    await new Promise(r => setTimeout(r, 600));
    router.push('/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />
      <main className={styles.card}>
        <header className={styles.header}>
          <Logo />
          <span className={styles.step}>Step 1 of 1</span>
        </header>

        <h1 className={styles.title}>Set up your workspace</h1>
        <p className={styles.subtitle}>
          Tell us about your organization. We&apos;ll create your account and take you to the dashboard.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {(name || email) && (
            <div className={styles.identity}>
              <div className={styles.identityAvatar}>
                {(name || email).trim().charAt(0).toUpperCase() || 'R'}
              </div>
              <div className={styles.identityText}>
                <span className={styles.identityName}>{name || 'Your account'}</span>
                {email && <span className={styles.identityEmail}>{email}</span>}
              </div>
              <span className={styles.identityBadge}><CheckIcon size={13} /> Account created</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="company" className={styles.label}>
              <LayersIcon size={15} /> Company name
            </label>
            <input
              id="company"
              type="text"
              className={styles.input}
              placeholder="NextAI Studios"
              value={company}
              onChange={e => setCompany(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="website" className={styles.label}>
              <GlobeIcon size={15} /> Company website
            </label>
            <input
              id="website"
              type="text"
              inputMode="url"
              className={styles.input}
              placeholder="nextaistudios.com"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              required
            />
            <span className={styles.hint}>We’ll suggest this as your first scan target.</span>
          </div>

          <button type="submit" className={`btn-primary ${styles.submit}`} disabled={saving}>
            {saving ? (
              <><span className={styles.spinner} aria-hidden="true" /> Creating your account…</>
            ) : (
              <>Create account &amp; continue <ArrowRightIcon /></>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
