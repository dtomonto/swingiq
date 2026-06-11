import type { SportId } from '@swingiq/core';

/**
 * CSS custom-property name for a sport's theme-agnostic identity accent.
 * Maps a SportId to the `--sport-<id>` token defined in globals.css
 * (underscores become dashes: `softball_slow` → `--sport-softball-slow`).
 *
 * Pure + JSX-free so it is unit-testable in the node test environment.
 */
export function sportAccentVar(sport: SportId): string {
  return `--sport-${sport.replace(/_/g, '-')}`;
}
