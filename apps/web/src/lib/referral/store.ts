// ============================================================
// SwingVantage — ReferralOS: self-contained local-first store
//
// Own localStorage key (swingiq-referral-v1), like bodysync / retest /
// motion-lab. Never touches the main Zustand store. SSR-safe, never
// throws. The document-sync layer can mirror this key to the account.
// React hook lives in ./useReferral.
// ============================================================

import type {
  ReferralState, ShareEvent, ShareChannel, CreditedSignup, ReferralSettings,
} from './types';
import { generateCode } from './engine';

export const REFERRAL_KEY = 'swingiq-referral-v1';
const KEY = REFERRAL_KEY;
const EVENT = 'swingvantage:referral-change';
/** Where a captured ?ref= code is parked until the referred user signs up. */
export const PENDING_REFERRAL_KEY = 'swingiq-pending-referral-v1';

const hasWindow = () => typeof window !== 'undefined';
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

function freshState(): ReferralState {
  return {
    version: 1,
    code: generateCode(),
    shares: [],
    credited: [],
    acknowledgedTiers: [],
    settings: { enabled: true },
    createdAt: new Date().toISOString(),
  };
}

let cache: { raw: string | null; value: ReferralState } | null = null;

export function read(): ReferralState {
  if (!hasWindow()) {
    // Stable SSR snapshot (no persistence, no random code churn).
    return { version: 1, code: 'SV-PREVIEW', shares: [], credited: [], acknowledgedTiers: [], settings: { enabled: true }, createdAt: '' };
  }
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { /* private mode */ }
  if (cache && cache.raw === raw) return cache.value;

  let value: ReferralState;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ReferralState>;
      value = {
        version: 1,
        code: typeof parsed.code === 'string' && parsed.code ? parsed.code : generateCode(),
        shares: Array.isArray(parsed.shares) ? parsed.shares : [],
        credited: Array.isArray(parsed.credited) ? parsed.credited : [],
        acknowledgedTiers: Array.isArray(parsed.acknowledgedTiers) ? parsed.acknowledgedTiers : [],
        settings: { enabled: true, ...parsed.settings },
        createdAt: parsed.createdAt || new Date().toISOString(),
      };
    } catch { value = freshState(); }
  } else {
    value = freshState();
    // Persist the freshly minted code so it's stable across reloads.
    try { window.localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* ignore */ }
  }
  cache = { raw, value };
  return value;
}

function write(next: ReferralState): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    cache = null;
    window.dispatchEvent(new Event(EVENT));
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
  } catch { /* quota / private mode */ }
}

export function subscribe(cb: () => void): () => void {
  if (!hasWindow()) return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

// ── mutations ────────────────────────────────────────────────
export function recordShare(channel: ShareChannel): ShareEvent {
  const state = read();
  const ev: ShareEvent = { id: newId('shr'), channel, at: new Date().toISOString() };
  write({ ...state, shares: [ev, ...state.shares].slice(0, 500) });
  return ev;
}

/** Credit a confirmed referred signup to this user. */
export function recordCreditedSignup(input: Partial<CreditedSignup> = {}): void {
  const state = read();
  const rec: CreditedSignup = {
    id: input.id ?? newId('sgn'),
    label: input.label,
    at: input.at ?? new Date().toISOString(),
    activated: input.activated ?? false,
  };
  write({ ...state, credited: [rec, ...state.credited].slice(0, 1000) });
}

export function markActivated(id: string): void {
  const state = read();
  write({
    ...state,
    credited: state.credited.map((c) => (c.id === id ? { ...c, activated: true } : c)),
  });
}

export function acknowledgeTiers(ids: string[]): void {
  const state = read();
  const merged = Array.from(new Set([...state.acknowledgedTiers, ...ids]));
  write({ ...state, acknowledgedTiers: merged });
}

export function setSettings(patch: Partial<ReferralSettings>): void {
  const state = read();
  write({ ...state, settings: { ...state.settings, ...patch } });
}

/** Regenerate the invite code (rarely needed; e.g. abuse). */
export function regenerateCode(): void {
  const state = read();
  write({ ...state, code: generateCode() });
}

// ── ?ref= capture (referred-visitor side) ────────────────────
/** Park an incoming ?ref code so we can attribute it after signup. */
export function capturePendingReferral(code: string): void {
  if (!hasWindow() || !code) return;
  try { window.localStorage.setItem(PENDING_REFERRAL_KEY, JSON.stringify({ code, at: new Date().toISOString() })); } catch { /* ignore */ }
}

export function getPendingReferral(): { code: string; at: string } | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(PENDING_REFERRAL_KEY);
    return raw ? (JSON.parse(raw) as { code: string; at: string }) : null;
  } catch { return null; }
}

export function clearPendingReferral(): void {
  if (!hasWindow()) return;
  try { window.localStorage.removeItem(PENDING_REFERRAL_KEY); } catch { /* ignore */ }
}
