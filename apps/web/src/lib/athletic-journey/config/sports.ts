// ============================================================
// SwingVantage — Athletic Journey: sport availability
// ------------------------------------------------------------
// Single source of truth for which sports have a LIVE journey and
// which are visibly "In Development". In-development sports are
// represented (selector card + waitlist), never faked: no stage
// scoring is ever produced for them.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { SportAvailability } from '../types';

// Keyed by the seven sports the Athletic Journey models today (golf, tennis,
// pickleball, padel — live — plus baseball and fast/slow-pitch softball in
// development). Any core SportId not listed here falls back to a safe generic
// "in development" entry via getSportAvailability().
export const SPORT_AVAILABILITY: Partial<Record<SportId, SportAvailability>> = {
  golf: {
    sport: 'golf',
    status: 'available',
    displayName: 'Golf',
    emoji: '⛳',
    accentColor: '#22C55E',
    tagline: 'New golfer to professional-track',
    userFacingMessage: 'Your full Golf Athletic Journey is available now.',
    futurePromise:
      'Stages from New Golfer through Professional-Track, with handicap-aware scoring, ' +
      'ball-flight and short-game intelligence, and a stage-by-stage development pathway.',
    waitlistEnabled: false,
    basicProfileEnabled: true,
    journeyEnabled: true,
  },
  tennis: {
    sport: 'tennis',
    status: 'available',
    displayName: 'Tennis',
    emoji: '🎾',
    accentColor: '#EAB308',
    tagline: 'New player to professional',
    userFacingMessage: 'Your full Tennis Athletic Journey is available now.',
    futurePromise:
      'Stages from New Player through Professional, with optional UTR and USTA/NTRP ' +
      'alignment, stroke and serve intelligence, and a stage-by-stage development pathway.',
    waitlistEnabled: false,
    basicProfileEnabled: true,
    journeyEnabled: true,
  },
  pickleball: {
    sport: 'pickleball',
    status: 'available',
    displayName: 'Pickleball',
    emoji: '🏓',
    accentColor: '#84CC16',
    tagline: 'New player to professional-caliber',
    userFacingMessage: 'Your full Pickleball Athletic Journey is available now.',
    futurePromise:
      'Stages from New Player through Professional-Caliber, with optional DUPR and self-rating ' +
      'alignment, third-shot/dink/reset intelligence, and a stage-by-stage development pathway.',
    waitlistEnabled: false,
    basicProfileEnabled: true,
    journeyEnabled: true,
  },
  padel: {
    sport: 'padel',
    status: 'available',
    displayName: 'Padel',
    emoji: '🎾',
    accentColor: '#0EA5E9',
    tagline: 'New player to professional-caliber',
    userFacingMessage: 'Your full Padel Athletic Journey is available now.',
    futurePromise:
      'Stages from New Player through Professional-Caliber, with optional club/league rating ' +
      'context, bandeja and wall-play intelligence, and a stage-by-stage development pathway.',
    waitlistEnabled: false,
    basicProfileEnabled: true,
    journeyEnabled: true,
  },
  baseball: {
    sport: 'baseball',
    status: 'in_development',
    displayName: 'Baseball',
    emoji: '⚾',
    accentColor: '#EF4444',
    tagline: 'Athletic Journey in development',
    userFacingMessage:
      'Baseball Athletic Journey is in development. SwingVantage is building sport-specific ' +
      'stages, swing metrics, and development intelligence for baseball athletes.',
    futurePromise:
      'This sport will receive its own journey stages, hitting and throwing metrics, ' +
      'fielding and speed development, recruiting and showcase readiness, and coach ' +
      'evaluation as SwingVantage expands its performance intelligence.',
    waitlistEnabled: true,
    basicProfileEnabled: true,
    journeyEnabled: false,
  },
  softball_fast: {
    sport: 'softball_fast',
    status: 'in_development',
    displayName: 'Fast-Pitch Softball',
    emoji: '🥎',
    accentColor: '#EC4899',
    tagline: 'Athletic Journey in development',
    userFacingMessage:
      'Fast-Pitch Softball Athletic Journey is in development. SwingVantage is building ' +
      'sport-specific stages, swing metrics, and development intelligence for fast-pitch athletes.',
    futurePromise:
      'This sport will receive its own journey stages, hitting, throwing and pitching ' +
      'metrics, position-specific skills, recruiting and showcase readiness, and game ' +
      'performance as SwingVantage expands its performance intelligence.',
    waitlistEnabled: true,
    basicProfileEnabled: true,
    journeyEnabled: false,
  },
  softball_slow: {
    sport: 'softball_slow',
    status: 'in_development',
    displayName: 'Slow-Pitch Softball',
    emoji: '🥎',
    accentColor: '#F97316',
    tagline: 'Athletic Journey in development',
    userFacingMessage:
      'Slow-Pitch Softball Athletic Journey is in development. SwingVantage is building ' +
      'sport-specific stages, swing metrics, and development intelligence for slow-pitch athletes.',
    futurePromise:
      'This sport will receive its own journey stages, hitting consistency, bat path and ' +
      'exit-velocity metrics, position-specific defense, and league and tournament ' +
      'readiness as SwingVantage expands its performance intelligence.',
    waitlistEnabled: true,
    basicProfileEnabled: true,
    journeyEnabled: false,
  },
};

/** Sports with a live journey, in display order (Golf, Tennis, Pickleball, Padel). */
export const AVAILABLE_SPORTS: SportId[] = ['golf', 'tennis', 'pickleball', 'padel'];

/** Sports shown as "In Development", in display order. */
export const IN_DEVELOPMENT_SPORTS: SportId[] = ['baseball', 'softball_fast', 'softball_slow'];

/** Every sport surfaced in the Athletic Journey selector, in display order. */
export const JOURNEY_SPORTS: SportId[] = [...AVAILABLE_SPORTS, ...IN_DEVELOPMENT_SPORTS];

function genericInDevelopment(sport: SportId): SportAvailability {
  return {
    sport,
    status: 'in_development',
    displayName: sport.charAt(0).toUpperCase() + sport.slice(1),
    emoji: '🏅',
    accentColor: '#6366F1',
    tagline: 'Athletic Journey in development',
    userFacingMessage:
      'This sport\'s Athletic Journey is in development. SwingVantage is building its ' +
      'sport-specific stages and performance intelligence.',
    futurePromise:
      'This sport will receive its own journey stages, metrics, and development pathway as ' +
      'SwingVantage expands its performance intelligence.',
    waitlistEnabled: true,
    basicProfileEnabled: false,
    journeyEnabled: false,
  };
}

export function getSportAvailability(sport: SportId): SportAvailability {
  return SPORT_AVAILABILITY[sport] ?? genericInDevelopment(sport);
}

export function isJourneyLive(sport: SportId): boolean {
  return SPORT_AVAILABILITY[sport]?.journeyEnabled === true;
}

/** The cross-sport message the spec mandates near the selector. */
export const SPORT_AVAILABILITY_MESSAGE =
  'Golf, Tennis, Pickleball, and Padel Athletic Journeys are available now. Baseball, ' +
  'Fast-Pitch Softball, and Slow-Pitch Softball journeys are currently in development and ' +
  'will be added as SwingVantage expands its sport-specific performance intelligence.';
