// ============================================================
// SwingIQ — Slow Pitch Softball Benchmarks
// Evidence-informed target windows for slow pitch swing analysis.
// Segmented by skill level.
//
// Sources (consulted, summaries only stored):
//  • ASA/USA Softball coaching and player development resources
//  • Published research on recreational softball mechanics
//  • USSSA slow pitch tournament data (publicly available aggregates)
//  • Sports biomechanics literature on overhead arc hitting mechanics
//
// Confidence: MEDIUM — slow pitch softball has less published
// biomechanics research than baseball or tennis. Values derived
// from coaching literature and recreational player observation.
// ============================================================

import type { SportBenchmarks } from '../types';

export const SLOW_PITCH_BENCHMARKS: SportBenchmarks = {
  sport_id: 'softball_slow',
  version: '1.0.0',
  notes:
    'Slow pitch softball benchmarks target recreational to competitive co-ed and men\'s division ' +
    'players. The arc pitch (6-12 ft arc required) means contact mechanics differ significantly ' +
    'from baseball — slight uppercut is often productive. Confidence: medium.',
  segmented: {
    beginner: {
      bat_speed_mph: {
        min: 35,
        target: 52,
        max: 65,
        unit: 'mph',
        description: 'Estimated bat speed at contact for recreational slow pitch players',
        confidence_note: 'Estimated from coaching resources — limited direct measurement data.',
      },
      exit_velocity_mph: {
        min: 45,
        target: 65,
        max: 80,
        unit: 'mph',
        description: 'Ball exit velocity from bat',
        confidence_note: 'Based on recreational player observation and coaching benchmarks.',
      },
      contact_height_relative: {
        min: 0.6,
        target: 1.0,
        max: 1.5,
        unit: 'relative (waist = 1.0)',
        description: 'Optimal contact height — waist to shoulder for slow pitch arc',
        confidence_note: 'Based on arc pitch mechanics coaching literature.',
      },
      hip_rotation_degrees: {
        min: 25,
        target: 50,
        max: 75,
        unit: 'degrees',
        description: 'Hip rotation from load to contact',
        confidence_note: 'Estimated from recreational player analysis.',
      },
    },
    intermediate: {
      bat_speed_mph: {
        min: 55,
        target: 68,
        max: 78,
        unit: 'mph',
        description: 'Bat speed at contact — competitive recreational league players',
        confidence_note: 'Based on competitive recreational softball coaching data.',
      },
      exit_velocity_mph: {
        min: 68,
        target: 82,
        max: 95,
        unit: 'mph',
        description: 'Exit velocity for intermediate competitive slow pitch',
        confidence_note: 'Based on competitive recreational data.',
      },
      contact_height_relative: {
        min: 0.7,
        target: 1.1,
        max: 1.6,
        unit: 'relative (waist = 1.0)',
        description: 'Contact height — intermediate players adjust to arc better',
        confidence_note: 'From coaching literature on hitting the arc pitch.',
      },
      hip_rotation_degrees: {
        min: 40,
        target: 60,
        max: 85,
        unit: 'degrees',
        description: 'Hip rotation contribution at intermediate level',
        confidence_note: 'From recreational player studies.',
      },
      stride_length_inches: {
        min: 3,
        target: 6,
        max: 10,
        unit: 'inches',
        description: 'Shorter stride than baseball is appropriate for slow pitch timing',
        confidence_note: 'Coaching guideline range.',
      },
    },
    advanced: {
      bat_speed_mph: {
        min: 68,
        target: 80,
        max: 90,
        unit: 'mph',
        description: 'Bat speed for advanced / upper-division slow pitch players',
        confidence_note: 'Based on upper-division competitive slow pitch player ranges.',
      },
      exit_velocity_mph: {
        min: 85,
        target: 95,
        max: 108,
        unit: 'mph',
        description: 'Advanced slow pitch exit velocity',
        confidence_note: 'From upper-tier recreational and competitive division data.',
      },
      contact_height_relative: {
        min: 0.8,
        target: 1.1,
        max: 1.7,
        unit: 'relative (waist = 1.0)',
        description: 'Advanced players make contact at varied heights effectively',
        confidence_note: 'From advanced coaching resources.',
      },
      hip_rotation_degrees: {
        min: 55,
        target: 75,
        max: 95,
        unit: 'degrees',
        description: 'Full hip rotation for advanced power',
        confidence_note: 'Consistent with general rotational sports biomechanics.',
      },
    },
    elite: {
      bat_speed_mph: {
        min: 80,
        target: 92,
        max: 105,
        unit: 'mph',
        description: 'Elite/national-level slow pitch bat speed',
        confidence_note: 'Limited published data — estimated from elite player observation.',
      },
      exit_velocity_mph: {
        min: 98,
        target: 110,
        max: 125,
        unit: 'mph',
        description: 'Elite slow pitch exit velocity',
        confidence_note: 'Based on national tournament level player data.',
      },
      contact_height_relative: {
        min: 0.9,
        target: 1.2,
        max: 1.8,
        unit: 'relative',
        description: 'Elite players consistently strike the high-arc pitch optimally',
        confidence_note: 'Estimated from elite level observation.',
      },
      hip_rotation_degrees: {
        min: 65,
        target: 85,
        max: 105,
        unit: 'degrees',
        description: 'Elite hip rotation for maximum power output',
        confidence_note: 'From rotational sports biomechanics research.',
      },
    },
  },
};
