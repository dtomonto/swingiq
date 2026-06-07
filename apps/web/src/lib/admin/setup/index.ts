// ============================================================
// SwingVantage Admin — Setup & Next Steps: public surface
// ------------------------------------------------------------
// One import for everything the page/components need. The hand-written
// catalog comes FIRST so it wins de-duplication over any auto-discovered
// task with the same id.
// ============================================================

import type { SetupTask } from './types';
import { CATALOG } from './catalog';
import { loadGeneratedTasks } from './generated';

export * from './types';
export * from './registry';
export { CATALOG } from './catalog';
export { loadGeneratedTasks, GENERATED_AT } from './generated';

/** Catalog (essentials) + auto-discovered (schemas, trailers), catalog first. */
export function loadAllSetupTasks(): SetupTask[] {
  return [...CATALOG, ...loadGeneratedTasks()];
}
