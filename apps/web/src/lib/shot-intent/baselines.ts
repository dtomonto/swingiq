// ============================================================
// SwingVantage — Per-club carry baselines (Phase 6)
// ------------------------------------------------------------
// Shot-intent classification is BASELINE-RELATIVE: a 90-yard PW is a
// half shot for one player and near-full for another. This module
// resolves each club's "full-shot" carry from the player's OWN data
// first, then their bag, then a generic provisional benchmark — so
// classification is personal as soon as there's data and still works
// from the very first import.
// ============================================================

/** Generic provisional full-carry by club category (yds). NOT user-specific —
 *  a neutral mid-level fallback used only until the player has their own data. */
export const PROVISIONAL_FULL_CARRY: Record<string, number> = {
  driver: 245,
  fairway_wood: 215,
  hybrid: 195,
  long_iron: 185,
  mid_iron: 165,
  short_iron: 140,
  wedge: 105,
  putter: 0,
};

export type BaselineSource = 'user' | 'bag' | 'provisional';

export interface ClubBaseline {
  /** The club's full-shot carry (yds), or null when unknown. */
  fullCarry: number | null;
  source: BaselineSource;
  /** Shots backing a 'user' baseline. */
  sampleSize: number;
}

export interface BaselineShot {
  club_name: string;
  club_category: string;
  ball_data: { carry_distance: number | null };
}
export interface BaselineSession {
  shots: BaselineShot[];
}

/** Minimum same-club shots before we trust a user-derived baseline. */
const MIN_USER_SHOTS = 4;

function normName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/** Percentile (0..1) of a numeric array (linear interpolation). */
export function percentile(values: number[], p: number): number | null {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v) && v > 0).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0]!;
  const idx = p * (nums.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return nums[lo]!;
  return nums[lo]! + (nums[hi]! - nums[lo]!) * (idx - lo);
}

/**
 * Resolver: given a club name + category, return its full-carry baseline.
 * Precomputes user percentiles per club from session shots; falls back to a
 * provided bag carry (by club name), then the provisional benchmark.
 *
 * The "full" carry is estimated as the 80th percentile of that club's carries —
 * most range shots are full, and the upper end approximates a stock full swing
 * while staying robust to the occasional flier.
 */
export function buildBaselineResolver(
  sessions: BaselineSession[],
  bagCarryByName: Record<string, number | null> = {},
): (clubName: string, category: string) => ClubBaseline {
  const carriesByClub = new Map<string, number[]>();
  for (const s of sessions) {
    for (const shot of s.shots ?? []) {
      const key = normName(shot.club_name ?? '');
      if (!key) continue;
      const c = shot.ball_data.carry_distance;
      if (typeof c === 'number' && c > 0) {
        const arr = carriesByClub.get(key) ?? [];
        arr.push(c);
        carriesByClub.set(key, arr);
      }
    }
  }

  const bagByNorm = new Map<string, number | null>();
  for (const [name, carry] of Object.entries(bagCarryByName)) {
    bagByNorm.set(normName(name), carry);
  }

  return (clubName: string, category: string): ClubBaseline => {
    const key = normName(clubName);
    const carries = carriesByClub.get(key) ?? [];
    if (carries.length >= MIN_USER_SHOTS) {
      return { fullCarry: Math.round(percentile(carries, 0.8) ?? 0) || null, source: 'user', sampleSize: carries.length };
    }
    const bag = bagByNorm.get(key);
    if (typeof bag === 'number' && bag > 0) {
      return { fullCarry: bag, source: 'bag', sampleSize: carries.length };
    }
    const provisional = PROVISIONAL_FULL_CARRY[category];
    return {
      fullCarry: typeof provisional === 'number' && provisional > 0 ? provisional : null,
      source: 'provisional',
      sampleSize: carries.length,
    };
  };
}
