'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';
import Logo from '../../components/Logo';
import {
  SettingsIcon, FileTextIcon, UsersIcon, CreditCardIcon, LifeBuoyIcon, GitIcon,
  LogOutIcon, TrashIcon, CopyIcon, CheckIcon, ArrowLeftIcon, MailIcon, PlusIcon,
  SearchIcon, ExternalLinkIcon, type IconProps,
} from '../../components/icons';
import {
  GitHubBrand, GitLabBrand, BitbucketBrand, SlackBrand, TeamsBrand, JiraBrand,
  LinearBrand, AwsBrand, VercelBrand, SupabaseBrand, CloudflareBrand, GoogleCloudBrand, RailwayBrand,
} from '../../components/brands';
import {
  loadProfile, updateProfile, signOut, initials, type Profile,
} from '../../lib/profile';

type Section = 'general' | 'members' | 'billing' | 'integrations' | 'audit' | 'help';

const NAV: { id: Section; label: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
  { id: 'integrations', label: 'Integrations', icon: GitIcon },
  { id: 'audit', label: 'Audit Logs', icon: FileTextIcon },
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

type Integration = { name: string; Brand: () => React.ReactElement; soon?: boolean };

const CODE_PROVIDERS: Integration[] = [
  { name: 'GitHub', Brand: GitHubBrand },
  { name: 'GitLab', Brand: GitLabBrand },
  { name: 'Bitbucket', Brand: BitbucketBrand },
];
const NOTIFICATIONS: Integration[] = [
  { name: 'Slack', Brand: SlackBrand },
  { name: 'Microsoft Teams', Brand: TeamsBrand, soon: true },
];
const ISSUE_TRACKERS: Integration[] = [
  { name: 'Jira', Brand: JiraBrand },
  { name: 'Linear', Brand: LinearBrand },
];
const INFRASTRUCTURE: Integration[] = [
  { name: 'AWS', Brand: AwsBrand },
  { name: 'Vercel', Brand: VercelBrand },
  { name: 'Supabase', Brand: SupabaseBrand },
  { name: 'Cloudflare', Brand: CloudflareBrand },
  { name: 'Google Cloud', Brand: GoogleCloudBrand },
  { name: 'Railway', Brand: RailwayBrand },
];

export default function SettingsPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('general');
  const [profile, setProfile] = useState<Profile>(FALLBACK);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [autoTopup, setAutoTopup] = useState(false);
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

  const handleSignOut = () => { signOut(); router.push('/'); };
  const handleDelete = () => { signOut(); router.push('/'); };

  const orgName = company.trim() || profile.company || 'your organization';
  const needsProvider = (what: string) => showToast(`${what} needs a connected provider`);

  const IntegrationRow = ({ item, action }: { item: Integration; action: string }) => (
    <div className={`${styles.integrationRow} ${item.soon ? styles.integrationSoon : ''}`}>
      <span className={styles.integrationBrand}><item.Brand /></span>
      <span className={styles.integrationName}>{item.name}</span>
      {item.soon ? (
        <span className={styles.comingSoon}><span className={styles.soonDot} /> Coming soon</span>
      ) : (
        <button className={styles.connectBtn} onClick={() => needsProvider(`Connecting ${item.name}`)}>{action}</button>
      )}
    </div>
  );

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
              <section className={styles.card}>
                <div className={styles.cardHeadRow}>
                  <h2 className={styles.cardTitle}>Account</h2>
                  <button className={styles.ghostBtn} onClick={handleSignOut}>
                    <LogOutIcon size={15} /> Sign out
                  </button>
                </div>
                <div className={styles.accountRow}>
                  <div className={styles.avatar}>{initials(name || profile.name)}</div>
                  <div className={styles.accountMeta}>
                    <span className={styles.accountName}>{name || profile.name}</span>
                    <span className={styles.accountEmail}>{profile.email || 'No email on file'}</span>
                  </div>
                </div>
                <div className={styles.divider} />
                <div className={styles.metaRow}>
                  <span className={styles.mutedLabel}>Plan</span>
                  <span className={styles.planValue}>{profile.plan}</span>
                  <button className={styles.secondaryBtn} onClick={() => setSection('billing')}>Manage billing</button>
                </div>
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
                <div className={styles.divider} />
                <div className={styles.metaRow}>
                  <span className={styles.mutedLabel}>Organization ID</span>
                  <code className={styles.orgId}>{profile.orgId}</code>
                  <button className={styles.linkBtn} onClick={copyOrgId}><CopyIcon size={14} /> Copy</button>
                </div>
                <div className={styles.divider} />
                <div className={styles.metaRow}>
                  <span className={styles.mutedLabel}>Your role</span>
                  <span className={styles.roleValue}>{profile.role}</span>
                </div>
              </section>

              <section className={`${styles.card} ${styles.danger}`}>
                <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>Danger zone</h2>
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

          {/* MEMBERS */}
          {section === 'members' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}>
                <div>
                  <h1 className={styles.pageTitle}>Members</h1>
                  <p className={styles.pageSub}>Who has access to {orgName}.</p>
                </div>
                <button className={styles.primaryBtn} onClick={() => needsProvider('Member invites')}>
                  <UsersIcon size={15} /> Invite member…
                </button>
              </header>

              <div>
                <h2 className={styles.listHeading}>Members <span className={styles.countTag}>1</span></h2>
                <div className={styles.table}>
                  <div className={`${styles.tableHead} ${styles.memberGrid}`}>
                    <span>Member</span><span>Role</span><span>Joined</span>
                  </div>
                  <div className={`${styles.tableRow} ${styles.memberGrid}`}>
                    <div className={styles.memberCell}>
                      <div className={styles.avatarSm}>{initials(profile.name)}</div>
                      <div className={styles.memberMeta}>
                        <span className={styles.accountName}>{profile.name} <span className={styles.youTag}>You</span></span>
                        <span className={styles.accountEmail}>{profile.email || 'No email on file'}</span>
                      </div>
                    </div>
                    <span className={styles.roleValue}>{profile.role}</span>
                    <span className={styles.mutedCell}>Just now</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className={styles.listHeading}>Pending invitations <span className={styles.countTag}>0</span></h2>
                <div className={styles.table}>
                  <div className={`${styles.tableHead} ${styles.inviteGrid}`}>
                    <span>Email</span><span>Role</span><span>Expires</span>
                  </div>
                  <div className={styles.empty}>
                    <MailIcon size={26} />
                    <h3>No pending invitations</h3>
                    <p>Invitations you send appear here until they are accepted.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BILLING */}
          {section === 'billing' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}><h1 className={styles.pageTitle}>Billing</h1></header>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Credits</h2>
                <div className={styles.rowBetween}>
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Balance</span>
                    <span className={styles.rowSub}>Each pentest spends whole credits. A chat spends part of a credit for each agent step.</span>
                  </div>
                  <span className={styles.metricValue}>0.00 <span className={styles.metricUnit}>credits</span></span>
                  <button className={styles.secondaryBtn} onClick={() => needsProvider('Topping up credits')}><PlusIcon size={15} /> Top up credits…</button>
                </div>
                <div className={styles.divider} />
                <div className={styles.rowBetween}>
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Active developers</span>
                    <span className={styles.rowSub}>{profile.plan} includes 50 PR reviews per active developer per month. Additional PR reviews cost $1 each.</span>
                  </div>
                  <span className={styles.metricValue}>0</span>
                  <button className={styles.secondaryBtn} onClick={() => showToast('No developer activity yet')}><UsersIcon size={15} /> View breakdown…</button>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeadRow}>
                  <h2 className={styles.cardTitle}>Payment method</h2>
                  <button className={styles.secondaryBtn} onClick={() => needsProvider('Adding a card')}><CreditCardIcon size={15} /> Add card</button>
                </div>
                <div className={styles.rowBetween}>
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>No card saved</span>
                    <span className={styles.rowSub}>Used for auto top-up and one-click top-ups.</span>
                  </div>
                  <span className={styles.missing}><span className={styles.missingDot} /> Missing</span>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Auto top-up</h2>
                <div className={styles.rowBetween}>
                  <div className={styles.rowText}>
                    <span className={styles.rowLabel}>Auto top-up</span>
                    <span className={styles.rowSub}>Charge the saved card when a pentest or Chat needs more credits.</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${autoTopup ? styles.toggleOn : ''}`}
                    onClick={() => { setAutoTopup(v => !v); needsProvider('Auto top-up'); }}
                    role="switch"
                    aria-checked={autoTopup}
                    aria-label="Auto top-up"
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Add a card to keep using Strix</h2>
                <div className={styles.rowBetween}>
                  <span className={styles.rowSub}>Keep full access to every feature. You are not charged until your trial ends.</span>
                  <button className={styles.primaryBtn} onClick={() => needsProvider('Adding a card')}>Add card</button>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Enterprise</h2>
                <div className={styles.rowBetween}>
                  <span className={styles.rowSub}>Dedicated support, custom integrations, SLA guarantees, and SSO for your team.</span>
                  <div className={styles.rowActions}>
                    <button className={styles.primaryBtn} onClick={() => showToast('Opening contact form')}>Talk to a human <ExternalLinkIcon /></button>
                    <button className={styles.linkBtn} onClick={() => setSection('billing')}>View plans <ExternalLinkIcon /></button>
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Startup program</h2>
                <div className={styles.rowBetween}>
                  <span className={styles.rowSub}>50% off your subscription for 6 months, for eligible early-stage startups.</span>
                  <button className={styles.secondaryBtn} onClick={() => showToast('Opening the startup application')}>Apply…</button>
                </div>
              </section>
            </div>
          )}

          {/* INTEGRATIONS */}
          {section === 'integrations' && (
            <div className={styles.stack}>
              <header className={styles.pageHead}><h1 className={styles.pageTitle}>Integrations</h1></header>

              <section className={styles.card}>
                <div className={styles.groupHead}>
                  <h2 className={styles.cardTitle}>Code providers</h2>
                  <p className={styles.cardDesc}>Connect repositories for source-aware pentests and PR reviews.</p>
                </div>
                {CODE_PROVIDERS.map(i => <IntegrationRow key={i.name} item={i} action="Connect" />)}
              </section>

              <section className={styles.card}>
                <div className={styles.groupHead}>
                  <h2 className={styles.cardTitle}>Notifications</h2>
                  <p className={styles.cardDesc}>Test results and new findings, posted where your team works.</p>
                </div>
                {NOTIFICATIONS.map(i => <IntegrationRow key={i.name} item={i} action="Connect" />)}
              </section>

              <section className={styles.card}>
                <div className={styles.groupHead}>
                  <h2 className={styles.cardTitle}>Issue tracking</h2>
                  <p className={styles.cardDesc}>Two-way sync of vulnerabilities and their status with your tracker.</p>
                </div>
                {ISSUE_TRACKERS.map(i => <IntegrationRow key={i.name} item={i} action="Connect" />)}
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeadRow}>
                  <div className={styles.groupHead}>
                    <h2 className={styles.cardTitle}>Infrastructure</h2>
                    <p className={styles.cardDesc}>Cloud accounts, hosting and databases, connected over MCP so a pentest can read how your app is deployed.</p>
                  </div>
                  <button className={styles.secondaryBtn} onClick={() => needsProvider('Adding an MCP server')}><PlusIcon size={15} /> Add an MCP server</button>
                </div>
                {INFRASTRUCTURE.map(i => <IntegrationRow key={i.name} item={i} action="Connect" />)}
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeadRow}>
                  <div className={styles.groupHead}>
                    <h2 className={styles.cardTitle}>Knowledge MCPs</h2>
                    <p className={styles.cardDesc}>Connect knowledge sources and pin important resources.</p>
                  </div>
                  <div className={styles.knowledgeActions}>
                    <div className={styles.search}>
                      <SearchIcon size={15} />
                      <input className={styles.searchInput} placeholder="Search sources…" />
                    </div>
                    <button className={styles.secondaryBtn} onClick={() => needsProvider('Adding an MCP server')}><PlusIcon size={15} /> Add an MCP server</button>
                  </div>
                </div>
                <div className={styles.empty}>
                  <p>No knowledge sources yet. Add one with “Add an MCP server”.</p>
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
