// Client-side integration-connection store.
//
// Like the profile store, this is a localStorage stand-in for a real backend:
// it remembers which integrations the user has "connected" so the settings
// page and the findings "Push the fix" actions stay in sync. Swap these helpers
// for API calls when a backend lands.

export type IntegrationCategory = 'code' | 'notify' | 'issues' | 'infra';

export interface IntegrationDef {
  name: string;
  category: IntegrationCategory;
}

// The single source of truth for which provider belongs to which category.
export const INTEGRATIONS: IntegrationDef[] = [
  { name: 'GitHub', category: 'code' },
  { name: 'GitLab', category: 'code' },
  { name: 'Bitbucket', category: 'code' },
  { name: 'Slack', category: 'notify' },
  { name: 'Jira', category: 'issues' },
  { name: 'Linear', category: 'issues' },
  { name: 'AWS', category: 'infra' },
  { name: 'Vercel', category: 'infra' },
  { name: 'Supabase', category: 'infra' },
  { name: 'Cloudflare', category: 'infra' },
  { name: 'Google Cloud', category: 'infra' },
  { name: 'Railway', category: 'infra' },
];

const KEY = 'rs_integrations';

export function loadIntegrations(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function save(names: string[]): string[] {
  try {
    localStorage.setItem(KEY, JSON.stringify(names));
  } catch {
    /* storage unavailable — connection state just won't persist */
  }
  return names;
}

export function isConnected(name: string, connected?: string[]): boolean {
  return (connected ?? loadIntegrations()).includes(name);
}

// Connect or disconnect one integration; returns the new connected list.
export function setConnected(name: string, value: boolean): string[] {
  const current = loadIntegrations().filter(n => n !== name);
  return save(value ? [...current, name] : current);
}

// The connected providers for a category (e.g. the code providers you can
// open a pull request on). `connected` lets callers pass a cached list.
export function connectedIn(category: IntegrationCategory, connected?: string[]): string[] {
  const set = connected ?? loadIntegrations();
  return INTEGRATIONS.filter(i => i.category === category && set.includes(i.name)).map(i => i.name);
}
