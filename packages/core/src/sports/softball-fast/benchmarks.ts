// ============================================================
// SwingVantage — Fast Pitch Softball Benchmarks
// Evidence-informed target windows for fast pitch swing analysis.
//
// Sources (consulted, summaries only stored):
//  • USA Softball / ASA player development benchmarks
//  • NFCA (National Fastpitch Coaches Association) resources
//  • Published research on fast pitch hitting reaction time and bat speed
//  • NCAA softball statistical aggregates (public data)
//  • Sports biomechanics literature on rising pitch adjustment
//
// Confidence: MEDIUM — more published research than slow pitch, but
// less than baseball at the elite level. Collegiate and Olympic data
// available; recreational ranges are extrapolated.
// ============================================================

import type { SportBenchmarks } from '../types';

export const FAST_PITCH_BENCHMARKS: SportBenchmarks = {
  sport_id: 'softball_fast',
  version: '1.0.0',
  notes:
    'Fast pitch softball benchmarks cover recreational to collegiate/competitive players. ' +
    'The compact swing required for faster reaction time means bat speed benchmarks are ' +
    'slightly lower than baseball equivalents. Confidence: medium.',
  segmented: {
    beginner: {
      bat_speed_mph: {
        min: 30,
        target: 48,
        max: 60,
        unit: 'mph',
        description: 'Bat speed at contact for youth/beginner fast pitch players',
        confidence_note: 'Estimated from youth development program standards.',
      },
      exit_velocity_mph: {
        min: 40,
        target: 58,
        max: 72,
        unit: 'mph',
        description: 'Ball exit velocity from bat — fast pitch contact',
        confidence_note: 'From youth fast pitch coaching resources.',
      },
      reaction_time_ms: {
        min: 350,
        target: 500,
        max: 650,
        unit: 'ms',
        description: 'Time from pitch release to swing initiation decision',
        confidence_note: 'Based on sports science literature on fast pitch reaction requirements.',
      },
      stride_length_inches: {
        min: 3,
        target: 5,
        max: 8,
        unit: 'inches',
        description: 'Short stride is ideal for fast pitch timing and balance',
        confidence_note: 'Consistent guideline across fast pitch coaching literature.',
      },
    },
    intermediate: {
      bat_speed_mph: {
        min: 50,
        target: 62,
        max: 72,
        unit: 'mph',
        description: 'Bat speed for high school / competitive fast pitch players',
        confidence_note: 'Published high school and competitive fast pitch research.',
      },
      exit_velocity_mph: {
        min: 62,
        target: 75,
        max: 88,
        unit: 'mph',
        description: 'Exit velocity for intermediate competitive fast pitch',
        confidence_note: 'Published competitive fast pitch benchmarks.',
      },
      reaction_time_ms: {
        min: 280,
        target: 400,
        max: 520,
        unit: 'ms',
        description: 'Faster reaction at intermediate level — faster pitches require it',
        confidence_note: 'Based on competitive fast pitch timing research.',
      },
      stride_length_inches: {
        min: 3,
        target: 5,
        max: 7,
        unit: 'inches',
        description: 'Compact stride is non-negotiable at competitive speeds',
        confidence_note: 'Standard coaching guideline.',
      },
      hip_rotation_degrees: {
        min: 35,
        target: 55,
        max: 80,
        unit: 'degrees',
        description: 'Hip rotation contribution to swing power',
        confidence_note: 'From biomechanics literature on rotational sports.',
      },
    },
    advanced: {
      bat_speed_mph: {
        min: 62,
        target: 72,
        max: 82,
        unit: 'mph',
        description: 'Bat speed for advanced / college-level fast pitch players',
        confidence_note: 'Published NCAA and international player data.',
      },
      exit_velocity_mph: {
        min: 76,
        target: 88,
        max: 100,
        unit: 'mph',
        description: 'Advanced competitive fast pitch exit velocity',
        confidence_note: 'NCAA and international fast pitch research.',
      },
      reaction_time_ms: {
        min: 230,
        target: 340,
        max: 440,
        unit: 'ms',
        description: 'Advanced players process pitch recognition faster',
        confidence_note: 'Published reaction research on collegiate fast pitch hitters.',
      },
      hip_rotation_degrees: {
        min: 50,
        target: 70,
        max: 90,
        unit: 'degrees',
        description: 'Advanced hip rotation for power and bat speed',
        confidence_note: 'From biomechanics studies on advanced fast pitch players.',
      },
    },
    elite: {
      bat_speed_mph: {
        min: 72,
        target: 80,
        max: 92,
        unit: 'mph',
        description: 'Elite / international / Olympic-level bat speed',
        confidence_note: 'Published international and Olympic fast pitch data.',
      },
      exit_velocity_mph: {
        min: 88,
        target: 98,
        max: 112,
        unit: 'mph',
        description: 'Elite fast pitch exit velocity',
        confidence_note: 'Published international competitive data — medium-high confidence.',
      },
      reaction_time_ms: {
        min: 180,
        target: 280,
        max: 360,
        unit: 'ms',
        description: 'Elite reaction window — Olympic pitchers throw 65-75 mph from 43 ft',
        confidence_note: 'Published sports science data on elite fast pitch reaction.',
      },
      hip_rotation_degrees: {
        min: 60,
        target: 80,
        max: 100,
        unit: 'degrees',
        description: 'Elite hip rotation — full kinetic chain at elite speed',
        confidence_note: 'From published biomechanics research.',
      },
    },
  },
};
