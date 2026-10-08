// Client-side user/organization profile store.
//
// There is no backend session yet, so the account a new user creates during
// onboarding is persisted in localStorage and read back by the dashboard and
// settings. This is a UI stand-in, not real auth — swap these helpers for API
// calls when a backend lands.

export interface Profile {
  name: string;
  email: string;
  company: string;
  website: string;
  orgId: string;
  plan: string;
  role: string;
  twoFactor: boolean;
  createdAt: string;
}

export interface SignupDraft {
  name: string;
  email: string;
  company: string;
}

const PROFILE_KEY = 'rs_profile';
const DRAFT_KEY = 'rs_signup_draft';
const AUTH_KEY = 'rs_authed';

const ORG_ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32

export function generateOrgId(): string {
  let id = '';
  const bytes =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(26))
      : Array.from({ length: 26 }, () => Math.floor(Math.random() * 256));
  for (let i = 0; i < 26; i++) {
    id += ORG_ID_ALPHABET[bytes[i] % ORG_ID_ALPHABET.length];
  }
  return `org_${id}`;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function loadProfile(): Profile | null {
  return read<Profile>(PROFILE_KEY);
}

export function saveProfile(profile: Profile): void {
  write(PROFILE_KEY, profile);
}

export function updateProfile(patch: Partial<Profile>): Profile | null {
  const current = loadProfile();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveProfile(next);
  return next;
}

export function loadSignupDraft(): SignupDraft | null {
  return read<SignupDraft>(DRAFT_KEY);
}

export function saveSignupDraft(draft: SignupDraft): void {
  write(DRAFT_KEY, draft);
}

export function clearSignupDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
}

export function setAuthed(value: boolean): void {
  try {
    if (value) localStorage.setItem(AUTH_KEY, '1');
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    /* noop */
  }
}

export function isAuthed(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function signOut(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
