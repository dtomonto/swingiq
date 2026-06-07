// ============================================================
// SwingVantage Admin — Setup hub: Command Center nudge (SERVER-ONLY)
// ------------------------------------------------------------
// A tiny, honest summary for the Command Center so "what to set up next" is
// visible the moment the owner logs in. It counts ONLY auto-detectable tasks
// (keys, connected integrations, derived checks) — never manual ones, whose
// done-state lives in the owner's browser and can't be known server-side.
// That keeps the dashboard from nagging about a database file you already ran.
// ============================================================

import 'server-only';
import { loadAllSetupTasks } from './index';
import { resolveAll } from './registry';
import { getSetupSignal } from './status';
import type { SetupTask } from './types';

const AUTO_KINDS = new Set(['capability', 'env', 'derived']);
const isAuto = (t: SetupTask) => AUTO_KINDS.has(t.detect.kind);

export interface SetupNudge {
  /** Required, auto-detectable steps not yet satisfied. */
  requiredOutstanding: number;
  /** Required + recommended, auto-detectable steps not yet satisfied. */
  essentialsOutstanding: number;
  /** A few titles to show in the alert detail. */
  examples: string[];
}

export function getSetupNudge(): SetupNudge {
  const tasks = loadAllSetupTasks();
  const signal = getSetupSignal(tasks);
  // Empty ack set: the server only trusts live signals, so manual tasks are
  // ignored below regardless of their resolved status.
  const resolved = resolveAll(tasks, signal, new Set());

  const outstanding = resolved.filter((t) => isAuto(t) && t.status === 'action-needed');
  return {
    requiredOutstanding: outstanding.filter((t) => t.priority === 'required').length,
    essentialsOutstanding: outstanding.length,
    examples: outstanding.slice(0, 3).map((t) => t.title),
  };
}
