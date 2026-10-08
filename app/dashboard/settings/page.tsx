'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';
import Logo from '../../components/Logo';
import {
  SettingsIcon, FileTextIcon, UsersIcon, CreditCardIcon, LifeBuoyIcon,
  LogOutIcon, TrashIcon, CopyIcon, CheckIcon, ArrowLeftIcon, MailIcon,
  type IconProps,
} from '../../components/icons';
import {
  loadProfile, updateProfile, signOut, initials, type Profile,
} from '../../lib/profile';

type Section = 'general' | 'audit' | 'members' | 'billing' | 'help';

const NAV: { id: Section; label: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'audit', label: 'Audit Logs', icon: FileTextIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
  { id: 'help', label: 'Help & Support', icon: LifeBuoyIcon },
];

const FALLBACK: Profile = {
  name: 'New user',
  email: '',
  company: '',
  website: '',
  orgId: 'org_pending',
  plan: 'Pro',
  role: 'admin',
  twoFactor: false,
  createdAt: new Date().toISOString(),
};

export default function SettingsPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('general');
  const [profile, setProfile] = useState<Profile>(FALLBACK);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'org' | 'account' | null>(null);

  useEffect(() => {
    const p = loadProfile() || FALLBACK;
    // Hydration-safe read of the client-only profile after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    setProfile(p);
    setName(p.name);
    setCompany(p.company);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const saveAccount = () => {
    const next = updateProfile({ name: name.trim() || profile.name });
    if (next) setProfile(next);
    showToast('Account updated');
  };

  const saveOrg = () => {
    const next = updateProfile({ company: company.trim() });
    if (next) setProfile(next);
    showToast('Organization updated');
  };

  const toggle2fa = () => {
    const next = updateProfile({ twoFactor: !profile.twoFactor });
    if (next) {
      setProfile(next);
      showToast(next.twoFactor ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
    }
  };

  const copyOrgId = () => {
    navigator.clipboard?.writeText(profile.orgId);
    showToast('Organization ID copied');
  };

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  const handleDelete = () => {
    signOut();
    router.push('/');
  };

  const orgName = company.trim() || profile.company || 'Your organization';

  return (
    <div className={styles.page}>
      {toast && (
        <div className={styles.toast} role="status">
          <CheckIcon size={14} /> {toast}
        </div>
      )}

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" aria-label="RedSuture home"><Logo /></Link>
        </div>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeftIcon size={14} /> Back to dashboard
        </Link>
        <nav className={styles.nav} aria-label="Settings">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${section === item.id ? styles.navItemActive : ''}`}
              onClick={() => setSection(item.id)}
              aria-current={section === item.id ? 'page' : undefined}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          {/* GENERAL */}
          {section === 'general' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}>
                <h1 className={styles.pageTitle}>General</h1>
                <button className={styles.ghostBtn} onClick={handleSignOut}>
                  <LogOutIcon size={15} /> Sign out
                </button>
              </header>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Account</h2>
                <div className={styles.accountRow}>
                  <div className={styles.avatar}>{initials(name || profile.name)}</div>
                  <div className={styles.accountMeta}>
                    <span className={styles.accountName}>{name || profile.name}</span>
                    <span className={styles.accountEmail}>{profile.email || 'No email on file'}</span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="acc-name" className={styles.label}>Name</label>
                  <div className={styles.inlineField}>
                    <input id="acc-name" className={styles.input} value={name} onChange={e => setName(e.target.value)} />
                    <button className={styles.primaryBtn} onClick={saveAccount}>Save</button>
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeadRow}>
                  <div>
                    <h2 className={styles.cardTitle}>Plan</h2>
                    <p className={styles.cardDesc}>Your current subscription.</p>
                  </div>
                  <span className={styles.planBadge}>{profile.plan}</span>
                </div>
                <button className={styles.secondaryBtn} onClick={() => setSection('billing')}>
                  <CreditCardIcon size={15} /> Manage billing
                </button>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Security</h2>
                <div className={styles.rowBetween}>
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Two-factor authentication</span>
                    <span className={styles.rowSub}>
                      Protect your account with an authenticator app that generates one-time codes.
                    </span>
                  </div>
                  <button
                    className={`${styles.toggle} ${profile.twoFactor ? styles.toggleOn : ''}`}
                    onClick={toggle2fa}
                    role="switch"
                    aria-checked={profile.twoFactor}
                    aria-label="Two-factor authentication"
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeadRow}>
                  <h2 className={styles.cardTitle}>Organization</h2>
                  <button className={styles.primaryBtn} onClick={saveOrg}>Save</button>
                </div>
                <div className={styles.field}>
                  <label htmlFor="org-name" className={styles.label}>Name</label>
                  <input id="org-name" className={styles.input} value={company} onChange={e => setCompany(e.target.value)} placeholder="Your organization" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="org-id" className={styles.label}>Organization ID</label>
                  <div className={styles.inlineField}>
                    <input id="org-id" className={`${styles.input} ${styles.mono}`} value={profile.orgId} readOnly />
                    <button className={styles.secondaryBtn} onClick={copyOrgId}>
                      <CopyIcon size={14} /> Copy
                    </button>
                  </div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Your role</span>
                  <span className={styles.roleBadge}>{profile.role}</span>
                </div>
              </section>

              <section className={`${styles.card} ${styles.danger}`}>
                <h2 className={styles.cardTitle}>Danger zone</h2>
                <div className={styles.dangerRow}>
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Delete organization</span>
                    <span className={styles.rowSub}>
                      Deletes every scan, issue, asset and member of this organization and cancels any active subscription or trial.
                    </span>
                  </div>
                  <button className={styles.dangerBtn} onClick={() => setConfirm('org')}>
                    <TrashIcon size={14} /> Delete organization…
                  </button>
                </div>
                <div className={styles.dangerRow}>
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Delete account</span>
                    <span className={styles.rowSub}>
                      Deletes your account and every workspace you are the only member of, removes you from shared workspaces and takes your email off our mailing list.
                    </span>
                  </div>
                  <button className={styles.dangerBtn} onClick={() => setConfirm('account')}>
                    <TrashIcon size={14} /> Delete account…
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* AUDIT LOGS */}
          {section === 'audit' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}><h1 className={styles.pageTitle}>Audit Logs</h1></header>
              <section className={styles.card}>
                <div className={styles.empty}>
                  <FileTextIcon size={28} />
                  <h3>No audit events yet</h3>
                  <p>Sign-ins, scans, member changes and billing updates will appear here once there’s activity.</p>
                </div>
              </section>
            </div>
          )}

          {/* MEMBERS */}
          {section === 'members' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Members</h1>
                <button className={styles.primaryBtn} onClick={() => showToast('Member invites need a connected email provider')}>
                  <MailIcon size={15} /> Invite member
                </button>
              </header>
              <section className={styles.card}>
                <div className={styles.memberRow}>
                  <div className={styles.avatar}>{initials(profile.name)}</div>
                  <div className={styles.memberMeta}>
                    <span className={styles.accountName}>{profile.name} <span className={styles.youTag}>You</span></span>
                    <span className={styles.accountEmail}>{profile.email || 'No email on file'}</span>
                  </div>
                  <span className={styles.roleBadge}>{profile.role}</span>
                </div>
                <p className={styles.cardFootNote}>You’re the only member of {orgName}. Invite teammates to collaborate on scans and findings.</p>
              </section>
            </div>
          )}

          {/* BILLING */}
          {section === 'billing' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}><h1 className={styles.pageTitle}>Billing</h1></header>
              <section className={styles.card}>
                <div className={styles.cardHeadRow}>
                  <div>
                    <h2 className={styles.cardTitle}>Current plan</h2>
                    <p className={styles.cardDesc}>{orgName} is on the {profile.plan} plan.</p>
                  </div>
                  <span className={styles.planBadge}>{profile.plan}</span>
                </div>
                <ul className={styles.planFeatures}>
                  <li><CheckIcon size={15} /> 100 managed scans per month</li>
                  <li><CheckIcon size={15} /> Web, API, repository & white-box targets</li>
                  <li><CheckIcon size={15} /> PDF, SARIF & patch exports</li>
                  <li><CheckIcon size={15} /> Priority support</li>
                </ul>
                <div className={styles.billingActions}>
                  <button className={styles.primaryBtn} onClick={() => showToast('Billing portal needs a payment provider')}>Manage billing</button>
                  <button className={styles.secondaryBtn} onClick={() => showToast('Plan changes need a payment provider')}>Change plan</button>
                </div>
              </section>
            </div>
          )}

          {/* HELP */}
          {section === 'help' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}><h1 className={styles.pageTitle}>Help &amp; Support</h1></header>
              <section className={styles.card}>
                <a className={styles.helpRow} href="https://github.com/usestrix/strix" target="_blank" rel="noopener noreferrer">
                  <LifeBuoyIcon size={18} />
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Documentation</span>
                    <span className={styles.rowSub}>Guides for scans, targets and remediation.</span>
                  </div>
                </a>
                <a className={styles.helpRow} href="mailto:support@redsuture.com">
                  <MailIcon size={18} />
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Contact support</span>
                    <span className={styles.rowSub}>support@redsuture.com</span>
                  </div>
                </a>
              </section>
            </div>
          )}
        </div>
      </main>

      {confirm && (
        <div className={styles.modalOverlay} onClick={() => setConfirm(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {confirm === 'org' ? 'Delete organization?' : 'Delete account?'}
            </h3>
            <p className={styles.modalText}>
              {confirm === 'org'
                ? `This permanently deletes ${orgName} and all of its scans, issues, assets and members. This can’t be undone.`
                : 'This permanently deletes your account and any workspaces you solely own. This can’t be undone.'}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setConfirm(null)}>Cancel</button>
              <button className={styles.dangerBtn} onClick={handleDelete}>
                <TrashIcon size={14} /> {confirm === 'org' ? 'Delete organization' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
