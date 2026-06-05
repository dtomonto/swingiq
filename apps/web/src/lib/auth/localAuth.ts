// ============================================================
// SwingVantage — Local Account Store (keyless auth fallback)
//
// When Supabase is NOT configured, SwingVantage still offers a real
// sign-up / sign-in experience backed entirely by this browser.
// Accounts live in localStorage on THIS device only. Passwords are
// never stored in plain text — they are PBKDF2-SHA-256 hashed with a
// per-account random salt (Web Crypto, no external dependencies).
//
// This is intentionally honest about its limits: a device-only
// profile is not cloud sync and not a security boundary against
// someone with access to the device. When Supabase keys are added,
// `useAuth` switches to real cloud auth and ignores this store.
// ============================================================

const ACCOUNTS_KEY = 'swingiq.localAccounts.v1';
const SESSION_KEY = 'swingiq.localSession.v1';
const AUTH_EVENT = 'swingiq:local-auth-change';
const PBKDF2_ITERATIONS = 100_000;

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface StoredAccount extends LocalUser {
  /** base64 random salt */
  salt: string;
  /** base64 PBKDF2-SHA-256 hash of the password */
  hash: string;
}

export class LocalAuthError extends Error {}

// ── low-level helpers ───────────────────────────────────────

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return bytesToB64(new Uint8Array(bits));
}

/** Constant-time-ish comparison of two base64 strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readAccounts(): StoredAccount[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function publicUser(a: StoredAccount): LocalUser {
  return { id: a.id, email: a.email, name: a.name, createdAt: a.createdAt };
}

function setSession(userId: string | null): void {
  if (!hasWindow()) return;
  if (userId) window.localStorage.setItem(SESSION_KEY, userId);
  else window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// ── public API ──────────────────────────────────────────────

export function getLocalUser(): LocalUser | null {
  if (!hasWindow()) return null;
  const id = window.localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const account = readAccounts().find((a) => a.id === id);
  return account ? publicUser(account) : null;
}

export function localAccountCount(): number {
  return readAccounts().length;
}

export async function signUpLocal(
  email: string,
  password: string,
  name: string,
): Promise<LocalUser> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new LocalAuthError('Please enter a valid email address.');
  }
  if (password.length < 8) {
    throw new LocalAuthError('Password must be at least 8 characters.');
  }
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === cleanEmail)) {
    throw new LocalAuthError('An account with this email already exists on this device. Try signing in.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  const account: StoredAccount = {
    id: (crypto.randomUUID && crypto.randomUUID()) || `local_${Date.now()}`,
    email: cleanEmail,
    name: name.trim() || cleanEmail.split('@')[0],
    createdAt: new Date().toISOString(),
    salt: bytesToB64(salt),
    hash,
  };
  writeAccounts([...accounts, account]);
  setSession(account.id);
  return publicUser(account);
}

export async function signInLocal(email: string, password: string): Promise<LocalUser> {
  const cleanEmail = normalizeEmail(email);
  const account = readAccounts().find((a) => a.email === cleanEmail);
  // Run the derivation even when the account is missing to avoid leaking
  // (via timing) whether the email exists.
  const salt = account ? b64ToBytes(account.salt) : crypto.getRandomValues(new Uint8Array(16));
  const candidate = await derive(password, salt);
  if (!account || !safeEqual(candidate, account.hash)) {
    throw new LocalAuthError('Incorrect email or password.');
  }
  setSession(account.id);
  return publicUser(account);
}

export function signOutLocal(): void {
  setSession(null);
}

/** Device-local password reset (no email round-trip exists in keyless mode). */
export async function resetLocalPassword(email: string, newPassword: string): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  if (newPassword.length < 8) {
    throw new LocalAuthError('Password must be at least 8 characters.');
  }
  const accounts = readAccounts();
  const idx = accounts.findIndex((a) => a.email === cleanEmail);
  if (idx === -1) {
    throw new LocalAuthError('No account with this email exists on this device.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  accounts[idx] = { ...accounts[idx], salt: bytesToB64(salt), hash: await derive(newPassword, salt) };
  writeAccounts(accounts);
}

/** Subscribe to local auth changes (same-tab events + cross-tab storage). */
export function onLocalAuthChange(callback: () => void): () => void {
  if (!hasWindow()) return () => {};
  const handleStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY || e.key === ACCOUNTS_KEY) callback();
  };
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', handleStorage);
  };
}
