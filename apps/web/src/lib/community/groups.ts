// ============================================================
// SwingIQ Community — Groups / Clubs
// Static group definitions and helpers.
// ============================================================

import type { GroupDefinition } from './types';

export const GROUPS: GroupDefinition[] = [
  {
    id: 'golf_improvement',
    name: 'Golf Improvement Club',
    description: 'A data-driven community for golfers using launch monitor data to improve their swing, contact quality, and course performance.',
    sport: 'golf',
    privacy: 'public',
    icon: '⛳',
    memberCount: 0,
    challengeIds: ['golf_consistency_week', 'backup_champion'],
    tags: ['launch monitor', 'data', 'improvement'],
  },
  {
    id: 'tennis_serve_lab',
    name: 'Tennis Serve Lab',
    description: 'Tennis players focused on serve mechanics, footwork consistency, and point-ending technique.',
    sport: 'tennis',
    privacy: 'public',
    icon: '🎾',
    memberCount: 0,
    challengeIds: ['tennis_serve_lab'],
    tags: ['serve', 'mechanics', 'technique'],
  },
  {
    id: 'baseball_hitting_lab',
    name: 'Baseball Hitting Lab',
    description: 'Serious baseball hitters using video analysis to improve bat path, contact point, and exit velocity.',
    sport: 'baseball',
    privacy: 'public',
    icon: '⚾',
    memberCount: 0,
    challengeIds: ['baseball_contact_week'],
    tags: ['hitting', 'bat path', 'exit velocity'],
  },
  {
    id: 'slow_pitch_power',
    name: 'Slow Pitch Power & Contact',
    description: 'Slow pitch softball players training for consistency, power, and improved launch conditions.',
    sport: 'softball_slow',
    privacy: 'public',
    icon: '🥎',
    memberCount: 0,
    challengeIds: [],
    tags: ['slow pitch', 'power', 'contact'],
  },
  {
    id: 'fast_pitch_development',
    name: 'Fast Pitch Swing Development',
    description: 'Fast pitch players developing elite swing mechanics and improving timing consistency.',
    sport: 'softball_fast',
    privacy: 'public',
    icon: '🏃',
    memberCount: 0,
    challengeIds: [],
    tags: ['fast pitch', 'timing', 'development'],
  },
  {
    id: 'data_driven_athletes',
    name: 'Data-Driven Athletes',
    description: 'Athletes across all sports who believe in tracking, exporting, and protecting their training data for long-term improvement.',
    sport: 'all',
    privacy: 'public',
    icon: '📊',
    memberCount: 0,
    challengeIds: ['backup_champion', 'progress_protector_challenge'],
    tags: ['data', 'analytics', 'all sports'],
  },
  {
    id: 'weekend_warriors',
    name: 'Weekend Warriors',
    description: 'Recreational athletes who train on weekends and use SwingIQ to maximize limited practice time.',
    sport: 'all',
    privacy: 'public',
    icon: '🎯',
    memberCount: 0,
    challengeIds: ['weekly_5_sessions'],
    tags: ['recreational', 'weekend', 'efficiency'],
  },
  {
    id: 'junior_athletes',
    name: 'Junior Athletes',
    description: 'Youth athletes (with parent/coach oversight) building fundamentals and tracking long-term development.',
    sport: 'all',
    privacy: 'private',
    icon: '⭐',
    memberCount: 0,
    challengeIds: ['beginner_first_session'],
    tags: ['youth', 'development', 'fundamentals'],
  },
  {
    id: 'multi_sport_athletes',
    name: 'Multi-Sport Athletes',
    description: 'Athletes competing across golf, tennis, baseball, and softball who use SwingIQ to track all their sports in one place.',
    sport: 'all',
    privacy: 'public',
    icon: '🏟️',
    memberCount: 0,
    challengeIds: ['multi_sport_week'],
    tags: ['multi-sport', 'versatility', 'all sports'],
  },
];

export function getGroupById(id: string): GroupDefinition | undefined {
  return GROUPS.find(g => g.id === id);
}

export function getGroupsBySport(sport: string): GroupDefinition[] {
  return GROUPS.filter(g => g.sport === sport || g.sport === 'all');
}

export function getPublicGroups(): GroupDefinition[] {
  return GROUPS.filter(g => g.privacy === 'public');
}
