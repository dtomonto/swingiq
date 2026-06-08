// ============================================================
// SwingVantage — Guardian Consent: local-first store
// ------------------------------------------------------------
// One self-contained localStorage record in its OWN key. Mirrors
// lib/retest/store.ts: it does NOT touch the Zustand store, backup schema, or
// export/import, so existing data flows are unaffected. Safe to be missing or
// corrupt; never throws.
// ============================================================
import type { GuardianConsentRecord } from './types';

const KEY = 'swingiq-guardian-consent-v1';

const listeners = new Set<() => void>();
let storeVersion = 0;

export function getGuardianConsentVersion(): number {
  return storeVersion;
}

function notifyChange(): void {
  storeVersion++;
  for (const listener of listeners) listener();
}

/** Subscribe to consent-store changes (same-tab + cross-tab). */
export function subscribeGuardianConsent(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notifyChange();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function isValid(value: unknown): value is GuardianConsentRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<GuardianConsentRecord>;
  return (
    r.version === 1 &&
    typeof r.ageBand === 'string' &&
    typeof r.guardianAffirmed === 'boolean' &&
    typeof r.guardianName === 'string' &&
    typeof r.guardianEmail === 'string' &&
    typeof r.acknowledgedNotMedical === 'boolean' &&
    typeof r.agreesToSupervise === 'boolean' &&
    typeof r.injuryLimitations === 'string' &&
    (r.consentedAt === null || typeof r.consentedAt === 'string') &&
    typeof r.termsVersion === 'string'
  );
}

/** Read the stored consent. Never throws; returns null when absent/invalid. */
export function loadGuardianConsent(): GuardianConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist a consent record. Never throws. */
export function saveGuardianConsent(record: GuardianConsentRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
    notifyChange();
  } catch {
    // storage full / unavailable — non-critical
  }
}

/** Withdraw consent (clear the record). Never throws. */
export function clearGuardianConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    notifyChange();
  } catch {
    // ignore
  }
}
