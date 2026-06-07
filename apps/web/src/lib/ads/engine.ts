// ============================================================
// SwingVantage — AdsOS: decision engine (pure)
// ------------------------------------------------------------
// Decides what (if anything) a slot renders, enforcing every rule in one
// place: youth-safety, member experience, placement on/off, sensitive
// surfaces, and the keyless house-ad fallback. Deterministic, never throws.
// ============================================================

import { getPlacement } from './placements';
import { HOUSE_ADS } from './houseAds';
import type { AdContext, AdDecision, AdState, HouseAd } from './types';

/**
 * Pick a house ad deterministically by weight, skipping any the user
 * dismissed. `seed` (e.g. a day number) rotates the selection over time.
 */
export function pickHouseAd(state: AdState, seed = 0): HouseAd | null {
  const pool = HOUSE_ADS.filter((a) => !state.dismissedHouse.includes(a.id));
  if (pool.length === 0) return null;
  const expanded: HouseAd[] = [];
  for (const ad of pool) for (let i = 0; i < Math.max(1, ad.weight); i += 1) expanded.push(ad);
  return expanded[Math.abs(seed) % expanded.length];
}

/** The single rule-set for whether/what a placement shows. */
export function decideAd(ctx: AdContext, state: AdState, seed = 0): AdDecision {
  const placement = getPlacement(ctx.placementId);
  if (!placement || !placement.enabled) return { kind: 'none' };

  // Paying members get a clean, ad-free experience.
  if (ctx.isMember) return { kind: 'none' };

  // Paid ads: only with a configured network, never to minors, never on
  // sensitive surfaces.
  const paidEligible = ctx.adsConfigured && !ctx.isMinor && !placement.sensitive;
  if (paidEligible) return { kind: 'paid', placement };

  // Keyless fallback: house promotions (safe for everyone, including minors).
  if (placement.allowHouse) {
    const ad = pickHouseAd(state, seed);
    if (ad) return { kind: 'house', ad };
  }
  return { kind: 'none' };
}

/** A day-based seed so house-ad rotation changes daily but is stable per day. */
export function daySeed(d = new Date()): number {
  return Math.floor(d.getTime() / 86_400_000);
}
