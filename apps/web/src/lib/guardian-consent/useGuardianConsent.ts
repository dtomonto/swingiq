'use client';

// ============================================================
// SwingVantage — useGuardianConsent
// ------------------------------------------------------------
// Reactive, SSR-safe view of the stored consent record, plus a sensible
// default age band derived from the existing settings.usage_category. The
// rules live in policy.ts; persistence in store.ts.
// ============================================================
import { useSyncExternalStore } from 'react';
import { useSwingVantageStore } from '@/store';
import {
  loadGuardianConsent,
  subscribeGuardianConsent,
  getGuardianConsentVersion,
  saveGuardianConsent,
  clearGuardianConsent,
} from './store';
import { ageBandFromUsageCategory } from './policy';
import type { AgeBand, GuardianConsentRecord } from './types';

export interface GuardianConsentView {
  /** True once client localStorage has been read (post-hydration). */
  ready: boolean;
  record: GuardianConsentRecord | null;
  /** Age band suggested from the saved settings.usage_category. */
  defaultAgeBand: AgeBand;
  save: (record: GuardianConsentRecord) => void;
  clear: () => void;
}

// Stable snapshot cache keyed by store version (useSyncExternalStore needs a
// referentially-stable value between unrelated renders).
let cache: { v: number; value: GuardianConsentRecord | null } | null = null;
function getSnapshot(): GuardianConsentRecord | null {
  const v = getGuardianConsentVersion();
  if (cache && cache.v === v) return cache.value;
  const value = loadGuardianConsent();
  cache = { v, value };
  return value;
}
const getServerSnapshot = (): GuardianConsentRecord | null => null;

// A no-op subscription whose snapshot is true on the client, false on the
// server — a hydration-safe "are we mounted" flag.
const subscribeNoop = () => () => {};

export function useGuardianConsent(): GuardianConsentView {
  const record = useSyncExternalStore(subscribeGuardianConsent, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const usageCategory = useSwingVantageStore((s) => s.settings?.usage_category ?? null);

  return {
    ready,
    record,
    defaultAgeBand: ageBandFromUsageCategory(usageCategory),
    save: saveGuardianConsent,
    clear: clearGuardianConsent,
  };
}
