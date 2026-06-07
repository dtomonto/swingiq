// ============================================================
// Player Recruiting Hub — sport display metadata (pure, no React)
// ------------------------------------------------------------
// A tiny static map so the engines stay framework-free and unit
// testable. Mirrors SPORT_DISPLAY in contexts/SportContext (which is
// a client module and must not be imported by the pure engines).
// ============================================================

import type { SportId } from '@swingiq/core';

export interface SportMeta {
  name: string;
  emoji: string;
  accentColor: string;
}

export const SPORT_META: Record<SportId, SportMeta> = {
  golf: { name: 'Golf', emoji: '⛳', accentColor: '#22C55E' },
  tennis: { name: 'Tennis', emoji: '🎾', accentColor: '#EAB308' },
  pickleball: { name: 'Pickleball', emoji: '🏓', accentColor: '#84CC16' },
  padel: { name: 'Padel', emoji: '🎾', accentColor: '#06B6D4' },
  baseball: { name: 'Baseball', emoji: '⚾', accentColor: '#EF4444' },
  softball_slow: { name: 'Slow Pitch Softball', emoji: '🥎', accentColor: '#F97316' },
  softball_fast: { name: 'Fast Pitch Softball', emoji: '🥎', accentColor: '#EC4899' },
};

export function sportName(sport: SportId): string {
  return SPORT_META[sport].name;
}
