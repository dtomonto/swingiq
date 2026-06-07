'use client';

// ============================================================
// SwingVantage — AdsOS: React hook
// ------------------------------------------------------------
// Resolves the decision for one placement, wiring the live rules: minor
// status (from the store), ad-network config (capabilities), and the
// user's house-ad dismissals (ads store).
// ============================================================

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSwingVantageStore } from '@/store';
import { isAdsConfigured } from '@/lib/capabilities';
import * as store from './store';
import { decideAd, daySeed } from './engine';
import type { AdDecision, AdPlacementId } from './types';

const MINOR_CATEGORIES = new Set(['minor_13_17', 'minor_under_13']);

export interface UseAds {
  decision: AdDecision;
  dismissHouse: (id: string) => void;
}

/**
 * @param placementId  Which slot to resolve.
 * @param isMember     Pass true to suppress ads for a paying user. Defaults
 *                     to false (the pre-revenue norm); membership is resolved
 *                     server-side via billing entitlements.
 */
export function useAds(placementId: AdPlacementId, isMember = false): UseAds {
  const state = useSyncExternalStore(store.subscribe, store.read, store.read);
  const usageCategory = useSwingVantageStore((s) => s.settings.usage_category);

  const decision = useMemo<AdDecision>(() => {
    const isMinor = MINOR_CATEGORIES.has(usageCategory ?? '');
    return decideAd(
      { placementId, isMinor, isMember, adsConfigured: isAdsConfigured },
      state,
      daySeed(),
    );
  }, [placementId, usageCategory, isMember, state]);

  const dismissHouse = useCallback((id: string) => store.dismissHouse(id), []);

  return { decision, dismissHouse };
}
