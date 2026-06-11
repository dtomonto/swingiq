// ============================================================
// SwingVantage — RecordAssist: platform sport bridge
// ------------------------------------------------------------
// RecordAssist uses its own six-sport vocabulary (RecordAssistSport)
// to stay dependency-free in the engines. This module is the ONE place
// that bridges to the platform's @swingiq/core SportId so RecordAssist
// links cleanly into the existing sport selector, branding, and the
// downstream video/motion-lab analysis flows.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { RecordAssistSport } from './types';

/** Display metadata for each RecordAssist sport (mirrors motion-lab). */
export interface RecordAssistSportMeta {
  id: RecordAssistSport;
  name: string;
  emoji: string;
  /** CSS accent var name used by the sport-brand registry. */
  accentVar: string;
}

export const RECORD_ASSIST_SPORT_META: Record<RecordAssistSport, RecordAssistSportMeta> = {
  golf: { id: 'golf', name: 'Golf', emoji: '⛳', accentVar: '--sport-golf' },
  tennis: { id: 'tennis', name: 'Tennis', emoji: '🎾', accentVar: '--sport-tennis' },
  baseball: { id: 'baseball', name: 'Baseball', emoji: '⚾', accentVar: '--sport-baseball' },
  softball: { id: 'softball', name: 'Softball', emoji: '🥎', accentVar: '--sport-softball-slow' },
  pickleball: { id: 'pickleball', name: 'Pickleball', emoji: '🏓', accentVar: '--sport-pickleball' },
  padel: { id: 'padel', name: 'Padel', emoji: '🎾', accentVar: '--sport-padel' },
};

/**
 * Map a RecordAssist sport to the platform SportId used by the rest of
 * the app. Softball defaults to fast-pitch (the analyzed swing); slow-
 * pitch shares the same capture framing.
 */
export function toPlatformSport(sport: RecordAssistSport): SportId {
  switch (sport) {
    case 'softball':
      return 'softball_fast' as SportId;
    default:
      return sport as SportId;
  }
}

/** Best-effort reverse map; unknown platform sports fall back to golf. */
export function fromPlatformSport(sport: SportId): RecordAssistSport {
  const s = String(sport);
  if (s === 'softball_fast' || s === 'softball_slow') return 'softball';
  if (
    s === 'golf' ||
    s === 'tennis' ||
    s === 'baseball' ||
    s === 'pickleball' ||
    s === 'padel'
  ) {
    return s as RecordAssistSport;
  }
  return 'golf';
}
