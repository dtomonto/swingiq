// ============================================================
// SwingVantage — Golf Bag Auto-Detection (Phase 4)
// ------------------------------------------------------------
// Infer the player's bag from the shots they've already imported, so
// they don't have to hand-build it. Pure + framework-free:
//
//   detectBagFromSessions(sessions) → DetectedClub[]   (per-club stats)
//   reconcileBag(existingClubs, detected) → suggestions (add / update)
//
// SOURCE-OF-TRUTH HIERARCHY (the brief's rule):
//   user-confirmed equipment  >  imported usage  >  inferred
// So reconcileBag only ever SUGGESTS — it flags new clubs to add and
// baseline updates to consider, and never silently overrides a carry the
// user set by hand. The UI applies changes on the user's say-so.
// ============================================================

/** Bag categories (mirrors store LocalClub['category']). */
export type BagCategory = 'driver' | 'wood' | 'hybrid' | 'iron' | 'wedge' | 'putter' | 'other';

export type DetectionConfidence = 'high' | 'medium' | 'low';

/** Minimal shot shape this module needs (satisfied by core Shot + NormalizedShot). */
export interface BagShot {
  club_name: string;
  ball_data: { carry_distance: number | null; total_distance: number | null };
}
export interface BagSession {
  shots: BagShot[];
}

export interface DetectedClub {
  /** Canonical display name (the most common spelling seen). */
  name: string;
  category: BagCategory;
  /** Robust typical carry (trimmed mean), or null when no carry data. */
  carryAvg: number | null;
  /** Robust typical total, or null. */
  totalAvg: number | null;
  /** Number of shots backing the averages. */
  shotCount: number;
  confidence: DetectionConfidence;
}

/** Normalize a club name for grouping (case/space/punct-insensitive). */
function normName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/** Infer the bag category from a club name string. */
export function inferBagCategory(clubName: string): BagCategory {
  const n = clubName.toLowerCase();
  if (n.includes('driver') || n === 'dr' || n === '1w' || n === '1 wood') return 'driver';
  if (n.includes('wood') || /\b[2-9]\s?w\b/.test(n) || /\b[2-9]w\b/.test(n)) return 'wood';
  if (n.includes('hybrid') || n.includes('rescue') || /\b[1-9]\s?h\b/.test(n) || /\b[1-9]h\b/.test(n)) return 'hybrid';
  if (
    n.includes('wedge') || /\b(pw|gw|aw|sw|lw)\b/.test(n) ||
    n.includes('pitching') || n.includes('gap') || n.includes('sand') || n.includes('lob') ||
    /\b(46|48|50|52|54|56|58|60|62)\b\s*°?/.test(n)
  ) return 'wedge';
  if (n.includes('putter') || n === 'pt' || n === 'putt') return 'putter';
  if (n.includes('iron') || /\b[1-9]\s?i\b/.test(n) || /\b[1-9]i\b/.test(n) || /\b[1-9]-iron\b/.test(n)) return 'iron';
  // A bare number ("7", "9") on a golf shot is almost always an iron.
  if (/^\d{1,2}$/.test(n.trim())) return 'iron';
  return 'other';
}

function confidenceFor(shotCount: number): DetectionConfidence {
  if (shotCount >= 8) return 'high';
  if (shotCount >= 3) return 'medium';
  return 'low';
}

/**
 * Robust "typical" value: with ≥4 samples drop the single highest and lowest
 * (mishits / flukes) then mean; otherwise plain mean. Rounded to a whole yard.
 */
function robustTypical(values: number[]): number | null {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v) && v > 0);
  if (nums.length === 0) return null;
  let pool = nums;
  if (nums.length >= 4) {
    const sorted = [...nums].sort((a, b) => a - b);
    pool = sorted.slice(1, -1); // drop min + max
  }
  const mean = pool.reduce((a, b) => a + b, 0) / pool.length;
  return Math.round(mean);
}

/**
 * Aggregate every imported shot into a per-club picture of the bag.
 * Clubs are returned sorted by carry (longest first); putters last.
 */
export function detectBagFromSessions(sessions: BagSession[]): DetectedClub[] {
  const groups = new Map<string, { display: Record<string, number>; carries: number[]; totals: number[] }>();

  for (const session of sessions) {
    for (const shot of session.shots ?? []) {
      const raw = (shot.club_name ?? '').trim();
      if (!raw || raw.toLowerCase() === 'unknown') continue;
      const key = normName(raw);
      if (!key) continue;
      let g = groups.get(key);
      if (!g) {
        g = { display: {}, carries: [], totals: [] };
        groups.set(key, g);
      }
      g.display[raw] = (g.display[raw] ?? 0) + 1;
      if (typeof shot.ball_data.carry_distance === 'number') g.carries.push(shot.ball_data.carry_distance);
      if (typeof shot.ball_data.total_distance === 'number') g.totals.push(shot.ball_data.total_distance);
    }
  }

  const detected: DetectedClub[] = [];
  for (const g of groups.values()) {
    // Most common original spelling becomes the display name.
    const name = Object.entries(g.display).sort((a, b) => b[1] - a[1])[0]![0];
    const shotCount = Object.values(g.display).reduce((a, b) => a + b, 0);
    detected.push({
      name,
      category: inferBagCategory(name),
      carryAvg: robustTypical(g.carries),
      totalAvg: robustTypical(g.totals),
      shotCount,
      confidence: confidenceFor(shotCount),
    });
  }

  // Sort: by carry desc, putters always last, unknown carry after known.
  return detected.sort((a, b) => {
    if (a.category === 'putter' && b.category !== 'putter') return 1;
    if (b.category === 'putter' && a.category !== 'putter') return -1;
    if (a.carryAvg === null && b.carryAvg !== null) return 1;
    if (b.carryAvg === null && a.carryAvg !== null) return -1;
    return (b.carryAvg ?? 0) - (a.carryAvg ?? 0);
  });
}

// ── Reconciliation against the existing bag ───────────────────

/** Minimal existing-club shape (satisfied by store LocalClub). */
export interface ExistingClub {
  id: string;
  name: string;
  typical_carry: number | null;
  source_of_truth?: 'user' | 'imported' | 'inferred';
}

export interface BaselineUpdate {
  clubId: string;
  name: string;
  currentCarry: number | null;
  importedCarry: number;
  shotCount: number;
  /** True when the current value was set by the user (treat with care). */
  userConfirmed: boolean;
}

export interface BagReconciliation {
  /** Detected clubs not present in the bag — candidates to add. */
  newClubs: DetectedClub[];
  /** Existing clubs whose imported carry meaningfully differs — candidates to update. */
  baselineUpdates: BaselineUpdate[];
}

/** Yards of carry difference before we bother suggesting a baseline update. */
const CARRY_DELTA_THRESHOLD = 5;

/**
 * Compare detected clubs to the existing bag. Returns suggestions only —
 * NEW clubs to add and baseline UPDATES to consider — never mutating anything.
 * User-confirmed carries are still surfaced (flagged) so the user stays in
 * control of the source-of-truth hierarchy.
 */
export function reconcileBag(existing: ExistingClub[], detected: DetectedClub[]): BagReconciliation {
  const byName = new Map(existing.map((c) => [normName(c.name), c]));
  const newClubs: DetectedClub[] = [];
  const baselineUpdates: BaselineUpdate[] = [];

  for (const d of detected) {
    const match = byName.get(normName(d.name));
    if (!match) {
      newClubs.push(d);
      continue;
    }
    if (
      d.carryAvg !== null &&
      (match.typical_carry === null || Math.abs(match.typical_carry - d.carryAvg) >= CARRY_DELTA_THRESHOLD)
    ) {
      baselineUpdates.push({
        clubId: match.id,
        name: match.name,
        currentCarry: match.typical_carry,
        importedCarry: d.carryAvg,
        shotCount: d.shotCount,
        userConfirmed: match.source_of_truth === 'user',
      });
    }
  }

  return { newClubs, baselineUpdates };
}
