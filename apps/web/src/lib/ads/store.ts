// ============================================================
// SwingVantage — AdsOS: self-contained local-first store
//
// Own localStorage key (swingiq-ads-v1). Holds only the user's house-ad
// dismissals (so a dismissed promo stays gone). SSR-safe, never throws.
// ============================================================

import type { AdState } from './types';

export const ADS_KEY = 'swingiq-ads-v1';
const KEY = ADS_KEY;
const EVENT = 'swingvantage:ads-change';

const hasWindow = () => typeof window !== 'undefined';
const DEFAULT_STATE: AdState = { version: 1, dismissedHouse: [] };

let cache: { raw: string | null; value: AdState } | null = null;

export function read(): AdState {
  if (!hasWindow()) return DEFAULT_STATE;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { /* private mode */ }
  if (cache && cache.raw === raw) return cache.value;

  let value: AdState = DEFAULT_STATE;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<AdState>;
      value = { version: 1, dismissedHouse: Array.isArray(parsed.dismissedHouse) ? parsed.dismissedHouse : [] };
    } catch { value = DEFAULT_STATE; }
  }
  cache = { raw, value };
  return value;
}

function write(next: AdState): void {
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

export function dismissHouse(id: string): void {
  const s = read();
  if (s.dismissedHouse.includes(id)) return;
  write({ ...s, dismissedHouse: [...s.dismissedHouse, id] });
}
