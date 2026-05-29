// ============================================================
// SwingIQ — Baseball Hitting Benchmarks
// Evidence-informed target windows for baseball swing analysis.
// Segmented by skill level.
//
// Sources (consulted, summaries only stored):
//  • MLB Statcast data (publicly released aggregate statistics)
//  • Driveline Baseball biomechanics research publications
//  • USA Baseball Coach Education resources
//  • Published research on bat speed and exit velocity relationships
//  • ABCA (American Baseball Coaches Association) resources
//
// Confidence: MEDIUM-HIGH for exit velocity / bat speed ranges
// (well-documented in public sources). Lower confidence for
// kinematic angles without direct measurement technology.
// ============================================================

import type { SportBenchmarks } from '../types';

export const BASEBALL_BENCHMARKS: SportBenchmarks = {
  sport_id: 'baseball',
  version: '1.0.0',
  notes:
    'Baseball benchmarks cover live game hitting mechanics for youth through amateur adult players. ' +
    'MLB professional benchmarks are shown at elite tier for reference only. ' +
    'Exit velocity and bat speed require measurement tools for accurate assessment.',
  segmented: {
    beginner: {
      bat_speed_mph: {
        min: 30,
        target: 50,
        max: 65,
        unit: 'mph',
        description: 'Bat speed at contact for youth/beginner players',
        confidence_note: 'Based on youth development program benchmarks — medium confidence.',
      },
      exit_velocity_mph: {
        min: 40,
        target: 60,
        max: 75,
        unit: 'mph',
        description: 'Ball exit velocity off the bat',
        confidence_note: 'Based on youth and recreational player ranges.',
      },
      launch_angle_deg: {
        min: -5,
        target: 12,
        max: 25,
        unit: 'degrees',
        description: 'Ideal launch angle for beginner players to achieve line drives',
        confidence_note: 'Based on published hitting instruction standards.',
      },
      hip_shoulder_separation_deg: {
        min: 15,
        target: 30,
        max: 50,
        unit: 'degrees',
        description: 'X-factor separation between hips and shoulders at maximum lag',
        confidence_note: 'Estimated range for beginner players based on coaching literature.',
      },
    },
    intermediate: {
      bat_speed_mph: {
        min: 55,
        target: 70,
        max: 82,
        unit: 'mph',
        description: 'Bat speed at contact — high school and competitive amateur',
        confidence_note: 'High school and collegiate research — medium-high confidence.',
      },
      exit_velocity_mph: {
        min: 70,
        target: 85,
        max: 95,
        unit: 'mph',
        description: 'Ball exit velocity for intermediate level players',
        confidence_note: 'Published collegiate and amateur benchmarks.',
      },
      launch_angle_deg: {
        min: 5,
        target: 18,
        max: 30,
        unit: 'degrees',
        description: 'Optimal launch angle for hard-contact outcomes at intermediate level',
        confidence_note: 'Consistent across coaching literature and Statcast-derived research.',
      },
      hip_shoulder_separation_deg: {
        min: 25,
        target: 40,
        max: 60,
        unit: 'degrees',
        description: 'Hip-to-shoulder separation — important power source',
        confidence_note: 'From published biomechanics research on amateur hitters.',
      },
      stride_length_inches: {
        min: 4,
        target: 8,
        max: 14,
        unit: 'inches',
        description: 'Forward stride length — controlled and purposeful',
        confidence_note: 'Standard coaching guideline range.',
      },
    },
    advanced: {
      bat_speed_mph: {
        min: 70,
        target: 82,
        max: 92,
        unit: 'mph',
        description: 'Bat speed at contact — advanced/college/minor league',
        confidence_note: 'Based on published research at collegiate and minor league levels.',
      },
      exit_velocity_mph: {
        min: 87,
        target: 96,
        max: 108,
        unit: 'mph',
        description: 'Exit velocity for advanced amateur to professional prospect players',
        confidence_note: 'Statcast and Draft-eligible prospect data — high confidence.',
      },
      launch_angle_deg: {
        min: 8,
        target: 20,
        max: 32,
        unit: 'degrees',
        description: 'Optimal launch angle for hard contact and extra-base hit production',
        confidence_note: 'Well-documented in Statcast literature.',
      },
      hip_shoulder_separation_deg: {
        min: 35,
        target: 50,
        max: 70,
        unit: 'degrees',
        description: 'Advanced hip-shoulder separation for power production',
        confidence_note: 'From collegiate and professional biomechanics studies.',
      },
    },
    elite: {
      bat_speed_mph: {
        min: 80,
        target: 90,
        max: 100,
        unit: 'mph',
        description: 'MLB-level bat speed — elite benchmark for reference',
        confidence_note: 'High confidence — MLB Statcast public data.',
      },
      exit_velocity_mph: {
        min: 95,
        target: 105,
        max: 122,
        unit: 'mph',
        description: 'MLB-level exit velocity benchmark',
        confidence_note: 'High confidence — directly from public MLB Statcast data.',
      },
      launch_angle_deg: {
        min: 10,
        target: 22,
        max: 35,
        unit: 'degrees',
        description: 'MLB optimal launch angle for extra-base hits',
        confidence_note: 'High confidence — Statcast data.',
      },
      hip_shoulder_separation_deg: {
        min: 45,
        target: 60,
        max: 80,
        unit: 'degrees',
        description: 'Elite hip-shoulder separation',
        confidence_note: 'Published research on MLB-level mechanics.',
      },
    },
  },
};
