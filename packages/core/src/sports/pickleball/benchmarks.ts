// ============================================================
// SwingVantage — Pickleball Benchmarks
// Evidence-informed target windows for pickleball stroke analysis,
// segmented by skill level (loosely aligned to self-rating / DUPR).
//
// Sources (consulted, summaries only stored):
//  • USA Pickleball + PPR coaching resources
//  • Published paddle-sport coaching material on the third-shot drop,
//    dinking, and non-volley-zone strategy
//  • DUPR rating-band descriptions (2.0–5.0+) for skill segmentation
//
// Note: pickleball biomechanics data is far less published than golf
// launch-monitor data. Values are evidence-informed ESTIMATES framed
// as target windows. Confidence: MEDIUM-LOW. Many "metrics" here are
// quality scores from video, not radar measurements.
// ============================================================

import type { SportBenchmarks } from '../types';

export const PICKLEBALL_BENCHMARKS: SportBenchmarks = {
  sport_id: 'pickleball',
  version: '1.0.0',
  notes:
    'Pickleball benchmarks cover the compact paddle stroke (dink, third-shot drop, drive, volley) for ' +
    'recreational (2.0) to advanced (5.0+ / competitive DUPR) players. Values are evidence-informed ' +
    'estimates and quality scores, not radar measurements. Confidence: medium-low.',
  segmented: {
    beginner: {
      paddle_speed_mph: {
        min: 12,
        target: 22,
        max: 35,
        unit: 'mph',
        description: 'Estimated paddle-head speed at contact on a drive (≈ DUPR 2.0–2.5)',
        confidence_note: 'Estimated; paddle speed is rarely radar-measured at recreational level.',
      },
      backswing_compactness: {
        min: 0.4,
        target: 0.65,
        max: 1.0,
        unit: 'score (0-1, higher = more compact)',
        description: 'How compact the take-back is — long tennis loops score low',
        confidence_note: 'Visual quality score from video, not a measurement.',
      },
      dink_net_clearance_inches: {
        min: 4,
        target: 9,
        max: 18,
        unit: 'inches above net',
        description: 'Target arc of a cross-court dink — low and unattackable is the goal',
        confidence_note: 'Estimated target window from coaching guidance on dink height.',
      },
      third_shot_drop_success_pct: {
        min: 20,
        target: 40,
        max: 60,
        unit: '%',
        description: 'Share of third-shot drops that land in the kitchen unattackable',
        confidence_note: 'Self-charted estimate; varies widely by opponent pace.',
      },
    },
    intermediate: {
      paddle_speed_mph: {
        min: 22,
        target: 35,
        max: 50,
        unit: 'mph',
        description: 'Paddle-head speed at contact on a drive (≈ DUPR 3.0–3.5)',
        confidence_note: 'Estimated for club-level players.',
      },
      backswing_compactness: {
        min: 0.6,
        target: 0.8,
        max: 1.0,
        unit: 'score (0-1, higher = more compact)',
        description: 'Compact, disguised preparation across dink/drop/drive',
        confidence_note: 'Visual quality score from video.',
      },
      dink_net_clearance_inches: {
        min: 3,
        target: 7,
        max: 14,
        unit: 'inches above net',
        description: 'Lower, more consistent dink arc that resists speed-ups',
        confidence_note: 'Estimated target window from coaching guidance.',
      },
      third_shot_drop_success_pct: {
        min: 45,
        target: 62,
        max: 78,
        unit: '%',
        description: 'Reliable third-shot drops landing soft in the NVZ',
        confidence_note: 'Self-charted estimate for 3.0–3.5 players.',
      },
      reset_success_pct: {
        min: 40,
        target: 58,
        max: 75,
        unit: '%',
        description: 'Share of hard balls reset softly into the kitchen from transition',
        confidence_note: 'Estimated from coaching benchmarks on transition-zone resets.',
      },
    },
    advanced: {
      paddle_speed_mph: {
        min: 35,
        target: 50,
        max: 65,
        unit: 'mph',
        description: 'Paddle-head speed on a put-away drive/roll (≈ DUPR 4.0–4.5)',
        confidence_note: 'Estimated for competitive club/tournament players.',
      },
      backswing_compactness: {
        min: 0.75,
        target: 0.9,
        max: 1.0,
        unit: 'score (0-1, higher = more compact)',
        description: 'Highly compact, fully disguised, repeatable preparation',
        confidence_note: 'Visual quality score from video.',
      },
      dink_net_clearance_inches: {
        min: 2,
        target: 5,
        max: 11,
        unit: 'inches above net',
        description: 'Low, weighted dinks that pull opponents off the line',
        confidence_note: 'Estimated target window; advanced dinks ride the net tape.',
      },
      third_shot_drop_success_pct: {
        min: 60,
        target: 75,
        max: 88,
        unit: '%',
        description: 'Consistent drops and drop-volleys getting the team to the line',
        confidence_note: 'Self-charted estimate for 4.0–4.5 players.',
      },
      reset_success_pct: {
        min: 58,
        target: 72,
        max: 86,
        unit: '%',
        description: 'Resets that neutralize attacks and earn the line back',
        confidence_note: 'Estimated from competitive coaching benchmarks.',
      },
    },
    elite: {
      paddle_speed_mph: {
        min: 45,
        target: 62,
        max: 80,
        unit: 'mph',
        description: 'Pro-caliber put-away and counter speed (≈ DUPR 5.0+)',
        confidence_note: 'Estimated from pro match observation; rarely radar-measured.',
      },
      backswing_compactness: {
        min: 0.85,
        target: 0.95,
        max: 1.0,
        unit: 'score (0-1, higher = more compact)',
        description: 'Elite disguise — identical prep for soft and hard, zero telegraph',
        confidence_note: 'Visual quality score from video.',
      },
      dink_net_clearance_inches: {
        min: 1,
        target: 4,
        max: 9,
        unit: 'inches above net',
        description: 'Net-skimming, spin-loaded dinks that force errors',
        confidence_note: 'Estimated target window for pro-level dinking.',
      },
      third_shot_drop_success_pct: {
        min: 72,
        target: 85,
        max: 95,
        unit: '%',
        description: 'Near-automatic drops, drives, and drop-volleys to the line',
        confidence_note: 'Estimated for 5.0+ / pro players.',
      },
      reset_success_pct: {
        min: 70,
        target: 84,
        max: 95,
        unit: '%',
        description: 'Elite hands — resets and counters under heavy pace',
        confidence_note: 'Estimated from pro-level transition defense.',
      },
    },
  },
};
