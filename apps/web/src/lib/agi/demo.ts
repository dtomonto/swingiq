// ============================================================
// SwingIQ — AGI: Demo athlete
// ------------------------------------------------------------
// A realistic, fully-populated SignalBundle for a two-sport athlete, so a
// first-time user with no data can see exactly what Athlete General Intelligence
// produces — the "wow" before they've captured anything. Clearly labelled as a
// sample in the UI; never persisted, never mixed with real data.
// ============================================================

import type {
  AGISnapshot,
  CapabilityId,
  CapabilitySignal,
  ProvenDrill,
  SignalBundle,
  SportId,
  SportSessionRef,
} from './types';

let seq = 0;
function sig(capability: CapabilityId, sport: SportId, score: number, at: string): CapabilitySignal {
  seq += 1;
  return {
    capability,
    sport,
    score,
    confidence: 0.78,
    basis: 'estimated',
    metricId: `demo_${capability}`,
    metricName: capability,
    at,
    sessionId: `demo_${seq}`,
  };
}

const GOLF: SportId = 'golf';
const TENNIS: SportId = 'tennis';

function ref(sport: SportId, label: string, overall: number, at: string, keyFault: string): SportSessionRef {
  seq += 1;
  return {
    sport,
    sportLabel: sport === 'golf' ? 'Golf' : 'Tennis',
    emoji: sport === 'golf' ? '⛳' : '🎾',
    motionLabel: label,
    sessionId: `demo_s_${seq}`,
    at,
    overall,
    confidence: 0.75,
    keyFault,
    drillHints: [
      { capability: 'rotation', fix: 'Hold your turn through contact', drillId: 'demo_rotation' },
    ],
  };
}

// Rotation is weak in BOTH sports → the keystone, and the same fault recurs across
// them → a recurring-fault insight. Balance is a cross-sport strength.
const signals: CapabilitySignal[] = [
  sig('rotation', GOLF, 46, '2026-06-20'),
  sig('rotation', TENNIS, 44, '2026-06-21'),
  sig('sequencing', GOLF, 58, '2026-06-20'),
  sig('balance', GOLF, 78, '2026-06-20'),
  sig('balance', TENNIS, 74, '2026-06-21'),
  sig('tempo', GOLF, 63, '2026-06-20'),
  sig('power', GOLF, 55, '2026-06-20'),
  sig('consistency', GOLF, 52, '2026-06-20'),
];

const sportSessions: SportSessionRef[] = [
  ref(GOLF, 'Driver swing', 61, '2026-06-08', 'Early shoulder rotation'),
  ref(GOLF, 'Driver swing', 64, '2026-06-14', 'Over the top'),
  ref(GOLF, 'Driver swing', 62, '2026-06-20', 'Early shoulder rotation'),
  ref(TENNIS, 'Forehand', 57, '2026-06-21', 'Early shoulder rotation'),
];

// Two prior snapshots so rotation shows an upward trajectory + progress note.
const history: AGISnapshot[] = [
  {
    at: '2026-06-01T08:00:00.000Z',
    coverage: 0.35,
    keystone: 'rotation',
    sports: [GOLF],
    capabilities: [
      { id: 'rotation', score: 38, basis: 'estimated' },
      { id: 'balance', score: 74, basis: 'estimated' },
    ],
  },
  {
    at: '2026-06-14T08:00:00.000Z',
    coverage: 0.45,
    keystone: 'rotation',
    sports: [GOLF, TENNIS],
    capabilities: [
      { id: 'rotation', score: 42, basis: 'estimated' },
      { id: 'balance', score: 76, basis: 'estimated' },
    ],
  },
];

const provenDrills: ProvenDrill[] = [
  { drillId: 'demo_rotation', drillName: 'Towel-under-arms turn drill', capability: 'rotation', sports: [GOLF], helpedCount: 2 },
];

/** A fully-populated sample athlete (golf + tennis). Read-only; never persisted. */
export const DEMO_BUNDLE: SignalBundle = {
  signals,
  sportSessions,
  identity: {
    declaredSports: [GOLF, TENNIS],
    primarySport: GOLF,
    skillLevel: 'intermediate',
    handedness: 'right',
    handicap: 14,
    primaryGoal: 'hit my driver farther and straighter',
    goalCapabilities: ['power', 'sequencing', 'rotation'],
  },
  readiness: {
    score: 72,
    band: 'solid',
    headline: 'Set up to train well today.',
    drivers: [
      { label: '4-day practice streak', contribution: 8 },
      { label: 'Well rested', contribution: 6 },
    ],
    caution: null,
    basis: 'Guidance from your recent activity, not a measurement.',
  },
  history,
  provenDrills,
};
