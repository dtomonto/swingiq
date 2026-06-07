// ============================================================
// SwingVantage — Padel Benchmarks
// Evidence-informed target windows for padel stroke analysis,
// segmented by skill level (beginner → competitive).
//
// Sources (consulted, summaries only stored):
//  • FIP / FEP coaching education material
//  • Published padel coaching methodology on the bandeja, víbora,
//    glass play, and net control
//  • General paddle-sport biomechanics literature
//
// Note: padel biomechanics data is sparsely published. Values are
// evidence-informed ESTIMATES and video quality scores framed as
// target windows. Confidence: MEDIUM-LOW. Padel rewards control
// and positioning over raw speed — metrics reflect that.
// ============================================================

import type { SportBenchmarks } from '../types';

export const PADEL_BENCHMARKS: SportBenchmarks = {
  sport_id: 'padel',
  version: '1.0.0',
  notes:
    'Padel benchmarks cover the overhead family (bandeja, víbora, smash), volleys, lobs, and glass play for ' +
    'beginner to competitive players. Values are evidence-informed estimates and video quality scores, not ' +
    'radar measurements. Padel prioritises control and net positioning over power. Confidence: medium-low.',
  segmented: {
    beginner: {
      bandeja_control_score: {
        min: 0.3,
        target: 0.55,
        max: 0.85,
        unit: 'score (0-1, higher = better)',
        description: 'Control and depth of the bandeja (the net-holding overhead)',
        confidence_note: 'Visual quality score from video, not a measurement.',
      },
      lob_depth_score: {
        min: 0.3,
        target: 0.55,
        max: 0.85,
        unit: 'score (0-1, higher = deeper/safer)',
        description: 'Depth and safety of the defensive lob over net players',
        confidence_note: 'Estimated quality score; deep lobs land near the back glass.',
      },
      wall_read_score: {
        min: 0.25,
        target: 0.5,
        max: 0.8,
        unit: 'score (0-1, higher = better)',
        description: 'Quality of reading and playing balls off the back/side glass',
        confidence_note: 'Visual quality score; the wall read has no tennis equivalent.',
      },
      net_hold_pct: {
        min: 20,
        target: 40,
        max: 60,
        unit: '%',
        description: 'Share of net points where the team keeps the net after an overhead',
        confidence_note: 'Self-charted estimate; beginners surrender the net often.',
      },
    },
    intermediate: {
      bandeja_control_score: {
        min: 0.5,
        target: 0.72,
        max: 0.9,
        unit: 'score (0-1, higher = better)',
        description: 'Repeatable bandeja that holds the net under pressure',
        confidence_note: 'Visual quality score from video.',
      },
      lob_depth_score: {
        min: 0.5,
        target: 0.72,
        max: 0.9,
        unit: 'score (0-1, higher = deeper/safer)',
        description: 'Consistent deep lobs that push opponents off the net',
        confidence_note: 'Estimated quality score.',
      },
      wall_read_score: {
        min: 0.45,
        target: 0.68,
        max: 0.9,
        unit: 'score (0-1, higher = better)',
        description: 'Reliable back-glass play with space and balance',
        confidence_note: 'Visual quality score.',
      },
      net_hold_pct: {
        min: 40,
        target: 58,
        max: 75,
        unit: '%',
        description: 'Holding the net through bandeja exchanges',
        confidence_note: 'Self-charted estimate for club players.',
      },
      smash_decision_score: {
        min: 0.45,
        target: 0.65,
        max: 0.85,
        unit: 'score (0-1, higher = better choices)',
        description: 'Choosing bandeja vs. víbora vs. flat smash appropriately',
        confidence_note: 'Estimated decision-quality score from video.',
      },
    },
    advanced: {
      bandeja_control_score: {
        min: 0.65,
        target: 0.85,
        max: 0.97,
        unit: 'score (0-1, higher = better)',
        description: 'High-control bandeja and víbora with spin and placement',
        confidence_note: 'Visual quality score from video.',
      },
      lob_depth_score: {
        min: 0.65,
        target: 0.84,
        max: 0.97,
        unit: 'score (0-1, higher = deeper/safer)',
        description: 'Precise offensive and defensive lobs to the back glass',
        confidence_note: 'Estimated quality score.',
      },
      wall_read_score: {
        min: 0.65,
        target: 0.85,
        max: 0.97,
        unit: 'score (0-1, higher = better)',
        description: 'Confident double-wall recovery and counterattack off the glass',
        confidence_note: 'Visual quality score.',
      },
      net_hold_pct: {
        min: 58,
        target: 74,
        max: 88,
        unit: '%',
        description: 'Sustained net control across long overhead exchanges',
        confidence_note: 'Self-charted estimate for competitive club players.',
      },
      smash_decision_score: {
        min: 0.62,
        target: 0.8,
        max: 0.94,
        unit: 'score (0-1, higher = better choices)',
        description: 'Strong shot selection — finishing only the right balls (por tres / por cuatro)',
        confidence_note: 'Estimated decision-quality score.',
      },
    },
    elite: {
      bandeja_control_score: {
        min: 0.8,
        target: 0.93,
        max: 1.0,
        unit: 'score (0-1, higher = better)',
        description: 'Pro-caliber overhead control, spin variety, and disguise',
        confidence_note: 'Visual quality score from video.',
      },
      lob_depth_score: {
        min: 0.8,
        target: 0.92,
        max: 1.0,
        unit: 'score (0-1, higher = deeper/safer)',
        description: 'Elite lobs that flip points and pin opponents to the glass',
        confidence_note: 'Estimated quality score.',
      },
      wall_read_score: {
        min: 0.8,
        target: 0.93,
        max: 1.0,
        unit: 'score (0-1, higher = better)',
        description: 'Elite glass defense — turns defense into offense off any wall',
        confidence_note: 'Visual quality score.',
      },
      net_hold_pct: {
        min: 72,
        target: 86,
        max: 96,
        unit: '%',
        description: 'Near-relentless net control at the highest level',
        confidence_note: 'Estimated for pro / elite-amateur players.',
      },
      smash_decision_score: {
        min: 0.78,
        target: 0.91,
        max: 1.0,
        unit: 'score (0-1, higher = better choices)',
        description: 'Elite point construction and shot selection under pressure',
        confidence_note: 'Estimated decision-quality score.',
      },
    },
  },
};
