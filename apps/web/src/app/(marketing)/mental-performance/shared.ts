// Shared display helpers for the public Mental Performance marketing pages.
// Non-route module (the App Router ignores files that aren't page/layout/route).

import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';
import type { MentalSport } from '@/lib/mental-performance/types';

export interface MentalSportCard {
  id: MentalSport;
  name: string;
  emoji: string;
  blurb: string;
}

const EMOJI: Record<string, string> = Object.fromEntries(
  ALL_SPORTS_INCLUDING_GOLF.map((s) => [s.id, s.emoji]),
);

export const MENTAL_SPORT_CARDS: MentalSportCard[] = [
  { id: 'golf', name: 'Golf', emoji: EMOJI.golf ?? '⛳', blurb: 'On-course meditation and resets for bad shots, three-putts, shanks and blow-up holes.' },
  { id: 'baseball', name: 'Baseball', emoji: EMOJI.baseball ?? '⚾', blurb: 'Recover after an error, want the next ball, and reset between pitches.' },
  { id: 'softball_fast', name: 'Fast-Pitch Softball', emoji: EMOJI.softball_fast ?? '🥎', blurb: 'Fielding confidence and fast error recovery for the next play.' },
  { id: 'softball_slow', name: 'Slow-Pitch Softball', emoji: EMOJI.softball_slow ?? '🥎', blurb: 'Stay composed after an error and reset for the next play.' },
  { id: 'tennis', name: 'Tennis', emoji: EMOJI.tennis ?? '🎾', blurb: 'Tell forced from unforced errors, and reset between every point.' },
  { id: 'pickleball', name: 'Pickleball', emoji: EMOJI.pickleball ?? '🏓', blurb: 'Doubles communication, dink composure, and between-point resets.' },
  { id: 'padel', name: 'Padel', emoji: EMOJI.padel ?? '🎾', blurb: 'Match focus, after-the-wall composure, and point-by-point resets.' },
  { id: 'universal', name: 'Any Sport', emoji: '🧠', blurb: 'Pre-game routines, confidence rebuilding, and a universal mistake reset.' },
];

export function sportDisplay(id: string): { name: string; emoji: string } {
  const card = MENTAL_SPORT_CARDS.find((c) => c.id === id);
  if (card) return { name: card.name, emoji: card.emoji };
  return { name: id, emoji: '🧠' };
}

export const MENTAL_SPORT_IDS: MentalSport[] = MENTAL_SPORT_CARDS.map((c) => c.id);
