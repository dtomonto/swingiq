// ============================================================
// SwingVantage — Shot-intent classifier (Phase 6)
// ------------------------------------------------------------
// Infers whether a shot was a chip / pitch / half / three-quarter /
// full / punch — or a mishit — WITHOUT asking the user, by comparing
// its carry to the club's full-shot baseline (baselines.ts) plus a few
// strike sanity checks. Returns a SwingType for the store + an outlier
// flag + a confidence the UI can show, so we only ask the user to
// confirm when confidence is low.
//
// Pure + deterministic. Thresholds are documented and unit-tested.
// ============================================================

import type { SwingType } from '@swingiq/core';
import type { ClubBaseline } from './baselines';

export type ShotIntent = 'chip' | 'pitch' | 'half' | 'three_quarter' | 'full' | 'punch' | 'mishit';

export interface ShotForIntent {
  carry: number | null;
  clubSpeed: number | null;
  ballSpeed: number | null;
  launchAngle: number | null;
  category: string;
}

export interface ShotIntentResult {
  intent: ShotIntent;
  /** Mapped to the store's SwingType (mishit keeps its best-guess swing + outlier). */
  swingType: SwingType;
  isOutlier: boolean;
  confidence: 'high' | 'medium' | 'low';
  /** carry / full-baseline, or null when not computable. */
  ratio: number | null;
  reason: string;
}

const INTENT_TO_SWING: Record<ShotIntent, SwingType> = {
  chip: 'chip', pitch: 'pitch', half: 'half', three_quarter: 'three_quarter',
  full: 'full', punch: 'punch', mishit: 'full',
};

/** Categories where short, partial-distance shots are a normal intent. */
const SHORT_GAME = new Set(['wedge', 'short_iron']);
/** Long clubs you essentially never deliberately half-swing on the range. */
const LONG_CLUBS = new Set(['driver', 'fairway_wood', 'hybrid', 'long_iron']);

/** Max launch angle (deg) below which a reduced-carry shot reads as a punch. */
const PUNCH_MAX_LAUNCH: Record<string, number> = {
  driver: 7, fairway_wood: 8, hybrid: 9, long_iron: 10, mid_iron: 12, short_iron: 16, wedge: 22,
};

function confFromSource(source: ClubBaseline['source']): 'high' | 'medium' | 'low' {
  return source === 'user' ? 'high' : source === 'bag' ? 'medium' : 'low';
}

/**
 * Classify a single shot's intent against its club baseline.
 */
export function classifyShotIntent(shot: ShotForIntent, baseline: ClubBaseline): ShotIntentResult {
  const full = baseline.fullCarry;
  const carry = shot.carry;

  // Not enough to compare → assume a full swing, low confidence (UI may ask).
  if (carry === null || full === null || full <= 0) {
    return {
      intent: 'full', swingType: 'full', isOutlier: false, confidence: 'low',
      ratio: null, reason: 'No carry or club baseline to compare against.',
    };
  }

  const ratio = carry / full;
  const cat = shot.category;
  const baseConf = confFromSource(baseline.source);
  const smash =
    shot.ballSpeed && shot.clubSpeed && shot.clubSpeed > 0 ? shot.ballSpeed / shot.clubSpeed : null;

  const mk = (intent: ShotIntent, reason: string, opts: { outlier?: boolean; conf?: 'high' | 'medium' | 'low' } = {}): ShotIntentResult => ({
    intent,
    swingType: INTENT_TO_SWING[intent],
    isOutlier: opts.outlier ?? false,
    confidence: opts.conf ?? baseConf,
    ratio: Math.round(ratio * 100) / 100,
    reason,
  });

  // ── Mishit: implausibly short for the club, or a clearly bad strike. ──
  if (LONG_CLUBS.has(cat) && ratio < 0.55) {
    return mk('mishit', `Only ${Math.round(ratio * 100)}% of full carry on a ${cat.replace('_', ' ')} — likely a mishit.`, { outlier: true });
  }
  if (!SHORT_GAME.has(cat) && ratio < 0.3) {
    return mk('mishit', 'Far below any normal partial swing for this club — likely a mishit.', { outlier: true });
  }
  // A very poor smash on a full-speed swing reads as a strike issue (outlier),
  // but we don't override a deliberate short-game shot.
  if (smash !== null && smash < 1.1 && ratio >= 0.6 && !SHORT_GAME.has(cat)) {
    return mk('mishit', 'Low energy transfer (smash) for a near-full swing — likely a mis-strike.', { outlier: true });
  }

  // ── Flier / over-carry outlier. ──
  if (ratio > 1.2) {
    return mk('full', `Carried ${Math.round(ratio * 100)}% of baseline — flier / outlier.`, { outlier: true });
  }

  // ── Punch / knockdown: reduced carry with a notably low launch. ──
  const punchMax = PUNCH_MAX_LAUNCH[cat];
  if (
    shot.launchAngle !== null && punchMax !== undefined &&
    shot.launchAngle < punchMax && ratio >= 0.55 && ratio <= 1.0
  ) {
    return mk('punch', `Lower launch (${shot.launchAngle}°) with reduced carry — a punch / knockdown.`);
  }

  // ── Distance buckets (baseline-relative). ──
  if (ratio < 0.35) return mk(SHORT_GAME.has(cat) ? 'chip' : 'half', 'Around a third of full carry.');
  if (ratio < 0.55) return mk(SHORT_GAME.has(cat) ? 'pitch' : 'half', 'Roughly half of full carry.');
  if (ratio < 0.78) return mk('three_quarter', 'About three-quarters of full carry.');
  return mk('full', 'At or near full carry.');
}
