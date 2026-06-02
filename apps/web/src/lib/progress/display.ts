// SwingIQ — Progress Intelligence: small UI display helpers.
import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';

/** Sport id → emoji, derived from the core sport registry. */
export const SPORT_EMOJI: Record<string, string> = Object.fromEntries(
  ALL_SPORTS_INCLUDING_GOLF.map((s) => [s.id, s.emoji]),
);
