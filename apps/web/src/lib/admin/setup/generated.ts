// ============================================================
// SwingVantage Admin — Setup & Next Steps: generated tasks loader
// ------------------------------------------------------------
// Reads the auto-discovered tasks (database schema files + `Setup:` commit
// trailers) that scripts/scan-setup.mjs writes into setup-registry.json.
// Kept tiny and defensive: a malformed or missing file degrades to an
// empty list rather than breaking the hub.
// ============================================================

import type { SetupTask } from './types';
import registry from '@/data/setup-registry.json';

interface GeneratedSnapshot {
  generatedAt?: string;
  tasks?: SetupTask[];
}

/** The auto-discovered setup tasks (may be empty). */
export function loadGeneratedTasks(): SetupTask[] {
  const snap = registry as GeneratedSnapshot;
  if (!snap || !Array.isArray(snap.tasks)) return [];
  // Trust the scanner's shape, but guard the essentials so a bad row can't
  // crash the page.
  return snap.tasks.filter(
    (t): t is SetupTask =>
      !!t && typeof t.id === 'string' && typeof t.title === 'string' && !!t.detect,
  );
}

export const GENERATED_AT: string =
  (registry as GeneratedSnapshot).generatedAt ?? '';
