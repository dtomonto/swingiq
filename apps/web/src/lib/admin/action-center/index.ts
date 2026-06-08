// ============================================================
// SwingVantage Admin — Action Center: public server surface
// ------------------------------------------------------------
// One import for the approvals page + the Command Center / Notifications
// alert. Runs every server adapter defensively (a thrown adapter degrades
// to []) and returns one severity-sorted inbox.
//
// Server-only (adapters import server data layers). The client-localStorage
// queues are merged in the page by the client island.
// ============================================================

import { SERVER_ADAPTERS } from './adapters.server';
import {
  compareActionItems,
  summarizeActions,
  type ActionItem,
  type ActionSummary,
} from './types';

export * from './types';
export { SERVER_ADAPTERS } from './adapters.server';

/** Collect every server adapter's pending items, severity-sorted. */
export async function collectServerActions(): Promise<ActionItem[]> {
  const lists = await Promise.all(
    SERVER_ADAPTERS.map(async (a) => {
      try {
        return await a.collect();
      } catch {
        return [] as ActionItem[];
      }
    }),
  );
  return lists.flat().sort(compareActionItems);
}

/** Roll-up of all server actions (items, total, hasCritical). */
export async function getActionSummary(): Promise<ActionSummary> {
  return summarizeActions(await collectServerActions());
}
