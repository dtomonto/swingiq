'use client';

import { useEffect, useState } from 'react';
import { designV2EnabledFromEnv, designV2EnabledClient } from './design-v2';

/**
 * React hook for the Design V2 flag — SSR-safe.
 *
 * The first render returns the ENV value (`NEXT_PUBLIC_DESIGN_V2`), which is
 * identical on the server and the client because Next inlines it at build
 * time → no hydration mismatch. After mount it upgrades to the full client
 * resolution, which layers the per-browser `sv_design_v2` cookie override on
 * top (the cohort-testing / staged-rollout seam). A cohort cookie therefore
 * flips the UI right after hydration; everyone else never re-renders.
 */
export function useDesignV2(): boolean {
  const [enabled, setEnabled] = useState<boolean>(designV2EnabledFromEnv());
  useEffect(() => {
    setEnabled(designV2EnabledClient());
  }, []);
  return enabled;
}
