// ============================================================
// SwingVantage — Persona Paths (content config, DEVELOPER-ONLY)
//
// The five (+ tennis) intent-first entry points used by the
// homepage PersonaPathCards. Each maps a pain point to a sport and
// a destination. Prominence (card vs. secondary link vs. hidden)
// is controlled separately by sportStrategy.ts.
//
// Slow-pitch / fast-pitch route to their dedicated hubs (added in
// Phase 2); the generic softball card routes to the chooser.
// See docs/FIVE_PERSONA_MASTER_PLAN.md §4–§6.
// ============================================================

import type { PersonaId } from './sportStrategy';

export interface PersonaPath {
  id: PersonaId;
  /** Engine sport id, or 'softball' for the slow/fast chooser. */
  sport: string;
  emoji: string;
  /** Short sport label shown as the card heading. */
  title: string;
  /** The "what are you trying to fix?" line. */
  painLine: string;
  /** Action-oriented CTA shown on the card. */
  ctaLabel: string;
  /** Destination for the card (hub, intent-aware). */
  href: string;
  /** Optional no-account analyze path (used by deeper CTAs later). */
  startHref?: string;
}

export const PERSONA_PATHS: Record<PersonaId, PersonaPath> = {
  golf: {
    id: 'golf',
    sport: 'golf',
    emoji: '⛳',
    title: 'Golf',
    painLine: 'Fix my slice or improve contact',
    ctaLabel: 'Fix my slice — free',
    href: '/golf-swing-analysis?intent=slice',
    startHref: '/start?sport=golf',
  },
  baseball: {
    id: 'baseball',
    sport: 'baseball',
    emoji: '⚾',
    title: 'Baseball',
    painLine: 'Hit harder and shorten my swing',
    ctaLabel: 'Shorten my swing — free',
    href: '/baseball-swing-analysis?intent=rollover',
    startHref: '/start?sport=baseball',
  },
  'slow-pitch': {
    id: 'slow-pitch',
    sport: 'softball_slow',
    emoji: '🥎',
    title: 'Slow Pitch Softball',
    painLine: 'Stop popping up and hit line drives',
    ctaLabel: 'Stop popping up — free',
    href: '/softball-swing-analysis/slow-pitch',
    startHref: '/start?sport=softball_slow',
  },
  'fast-pitch': {
    id: 'fast-pitch',
    sport: 'softball_fast',
    emoji: '🥎',
    title: 'Fast Pitch Softball',
    painLine: 'Catch up to speed and improve contact point',
    ctaLabel: 'Catch up to speed — free',
    href: '/softball-swing-analysis/fast-pitch',
    startHref: '/start?sport=softball_fast',
  },
  softball: {
    id: 'softball',
    sport: 'softball',
    emoji: '🥎',
    title: 'Not sure which softball?',
    painLine: 'Choose the right softball swing path',
    ctaLabel: 'Find my swing path',
    href: '/softball-swing-analysis',
  },
  tennis: {
    id: 'tennis',
    sport: 'tennis',
    emoji: '🎾',
    title: 'Tennis',
    painLine: 'Sharpen your forehand, backhand & serve',
    ctaLabel: 'Analyze my strokes',
    href: '/tennis-swing-analysis',
    startHref: '/start?sport=tennis',
  },
};

export function getPersona(id: PersonaId): PersonaPath {
  return PERSONA_PATHS[id];
}
