// ============================================================
// SwingVantage — AGI: World Model builder
// ------------------------------------------------------------
// Fuses a normalized SignalBundle into a single AthleteWorldModel. The fusion
// is confidence-weighted (a high-confidence measurement counts more than a
// flat-depth estimate) and basis-conservative (a fused capability is reported
// at the LOWEST basis among its evidence — never more certain than its
// weakest input). This is the "general" representation every downstream
// reasoner reads from.
// ============================================================

import type { SportId } from '@swingiq/core';
import { CAPABILITIES } from './capabilities';
import { AGI_THRESHOLDS } from './config/thresholds';
import type {
  AthleteWorldModel,
  Basis,
  AGISnapshot,
  CapabilityId,
  CapabilitySignal,
  CapabilityState,
  CapabilityPerSport,
  CapabilityTrajectory,
  ScoreBand,
  SignalBundle,
} from './types';

const BASIS_RANK: Record<Basis, number> = {
  measured: 4,
  estimated: 3,
  ai_inferred: 2,
  user_entered: 1,
  placeholder: 0,
};

/** The most conservative (lowest-ranked) basis among a set. */
function weakestBasis(list: Basis[]): Basis {
  if (list.length === 0) return 'placeholder';
  return list.reduce((lo, b) => (BASIS_RANK[b] < BASIS_RANK[lo] ? b : lo), list[0]);
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round = (n: number, p = 0) => {
  const f = 10 ** p;
  return Math.round(n * f) / f;
};

/** Honest, non-clinical band for a 0–100 score. */
export function scoreBand(score: number): ScoreBand {
  const b = AGI_THRESHOLDS.band;
  if (score >= b.sharp) return 'sharp';
  if (score >= b.solid) return 'solid';
  if (score >= b.developing) return 'developing';
  return 'building';
}

/** Trend of a capability across snapshots (oldest → newest) + the current value. */
function computeTrajectory(
  capId: CapabilityId,
  currentScore: number | null,
  history: AGISnapshot[],
): CapabilityTrajectory | null {
  const points: number[] = [];
  for (const snap of history) {
    const s = snap.capabilities.find((c) => c.id === capId)?.score;
    if (typeof s === 'number') points.push(s);
  }
  if (currentScore !== null) points.push(currentScore);
  if (points.length < 2) return null;
  const deltaFromFirst = round(points[points.length - 1] - points[0]);
  const direction = deltaFromFirst > 3 ? 'up' : deltaFromFirst < -3 ? 'down' : 'flat';
  return { direction, deltaFromFirst, points };
}

/** Confidence-weighted mean of {score, confidence} rows. Returns null if empty. */
function weightedScore(rows: Array<{ score: number; confidence: number }>): number | null {
  if (rows.length === 0) return null;
  let wsum = 0;
  let w = 0;
  for (const r of rows) {
    const cw = Math.max(0.05, r.confidence); // never let a row count for nothing
    wsum += r.score * cw;
    w += cw;
  }
  return w > 0 ? wsum / w : null;
}

function buildCapabilityState(
  capId: CapabilityState['capability'],
  name: string,
  description: string,
  signals: CapabilitySignal[],
  history: AGISnapshot[],
): CapabilityState {
  const score = weightedScore(signals);
  const roundedScore = score === null ? null : round(score);
  // Aggregate confidence: mean confidence, lightly damped when only 1 sample.
  const meanConf =
    signals.length === 0 ? 0 : signals.reduce((s, x) => s + x.confidence, 0) / signals.length;
  const sampleDamp = signals.length >= 2 ? 1 : 0.85;
  const confidence = clamp01(meanConf * sampleDamp);

  const sports = Array.from(new Set(signals.map((s) => s.sport)));
  const perSport: CapabilityPerSport[] = sports.map((sport) => {
    const rows = signals.filter((s) => s.sport === sport);
    return {
      sport,
      score: round(weightedScore(rows) ?? 0),
      confidence: round(rows.reduce((s, x) => s + x.confidence, 0) / rows.length, 2),
      sampleCount: rows.length,
    };
  });

  const evidence = [...signals].sort((a, b) => b.confidence - a.confidence).slice(0, 6);

  return {
    capability: capId,
    name,
    description,
    score: roundedScore,
    band: roundedScore === null ? null : scoreBand(roundedScore),
    trajectory: computeTrajectory(capId, roundedScore, history),
    confidence: round(confidence, 2),
    basis: weakestBasis(signals.map((s) => s.basis)),
    sports,
    breadth: sports.length,
    sampleCount: signals.length,
    perSport,
    evidence,
  };
}

/** Build the unified athlete model from a normalized bundle. Never throws. */
export function buildWorldModel(bundle: SignalBundle): AthleteWorldModel {
  const allSports = Array.from(
    new Set([
      ...bundle.signals.map((s) => s.sport),
      ...bundle.sportSessions.map((s) => s.sport),
    ]),
  ) as SportId[];

  // Primary sport = the one with the most sessions (ties → most signals).
  const sessionCountBySport = new Map<SportId, number>();
  for (const s of bundle.sportSessions) {
    sessionCountBySport.set(s.sport, (sessionCountBySport.get(s.sport) ?? 0) + 1);
  }
  const signalCountBySport = new Map<SportId, number>();
  for (const s of bundle.signals) {
    signalCountBySport.set(s.sport, (signalCountBySport.get(s.sport) ?? 0) + 1);
  }
  const primarySport =
    allSports.length === 0
      ? bundle.identity?.primarySport ?? null
      : [...allSports].sort((a, b) => {
          const sd = (sessionCountBySport.get(b) ?? 0) - (sessionCountBySport.get(a) ?? 0);
          if (sd !== 0) return sd;
          return (signalCountBySport.get(b) ?? 0) - (signalCountBySport.get(a) ?? 0);
        })[0];

  const history = bundle.history ?? [];
  const capabilities = CAPABILITIES.map((def) =>
    buildCapabilityState(
      def.id,
      def.name,
      def.description,
      bundle.signals.filter((s) => s.capability === def.id),
      history,
    ),
  );

  const observed = capabilities.filter((c) => c.score !== null);
  const missing: string[] = [];
  if (bundle.sportSessions.length === 0) {
    missing.push('No analysed sessions yet — run a Motion Lab analysis to begin.');
  }
  for (const c of capabilities) {
    if (c.score === null) missing.push(`${c.name}: not yet observed in any session.`);
  }
  // Sports the athlete says they train but hasn't analysed yet.
  const dataSports = new Set(allSports);
  for (const s of bundle.identity?.declaredSports ?? []) {
    if (!dataSports.has(s)) {
      missing.push(`You train ${s} but haven't analysed it yet — capture a session to include it.`);
    }
  }

  // Coverage blends three things: capabilities observed, sports covered, and
  // sample depth. All honest, all bounded 0–1.
  const capCoverage = observed.length / CAPABILITIES.length;
  const depthCoverage = clamp01(bundle.sportSessions.length / 6); // ~6 sessions = a solid base
  const sportCoverage = clamp01(allSports.length / 2); // multi-sport sharpens the picture
  const coverage = clamp01(0.5 * capCoverage + 0.3 * depthCoverage + 0.2 * sportCoverage);

  return {
    sports: allSports,
    primarySport,
    crossSport: allSports.length >= 2,
    identity: bundle.identity ?? null,
    readiness: bundle.readiness ?? null,
    capabilities,
    coverage: round(coverage, 2),
    dataMap: {
      totalSessions: bundle.sportSessions.length,
      sportsWithData: allSports.length,
      capabilitiesObserved: observed.length,
      capabilitiesTotal: CAPABILITIES.length,
      missing,
    },
    generatedAt: new Date().toISOString(),
  };
}
