// ============================================================
// SwingVantage Admin — data-pipeline / linkage health (SERVER-ONLY)
// ------------------------------------------------------------
// "Does the data link up?" — sessions → diagnosis → analyses. Two views:
//
//   • computeUserPipelineHealth(): PURE summary of ONE user's own records
//     (already loaded by getAdminUser), for the user-detail page.
//   • getSystemPipelineHealth(): fleet-wide counts via the service-role client.
//
// PRIVACY: this is derived only from the user's OWN data records (sessions /
// analyses), never from the anonymized ReliabilityOS failure events — so it
// does NOT attribute a failure to a person. Honest connected:false when the
// service role isn't set; every query is guarded and never throws.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin/context';

export interface PipelineHealth {
  sessions: { total: number; scored: number; empty: number; unscored: number };
  analyses: { total: number };
  /** Human-readable linkage gaps (data integrity, not failures). */
  gaps: string[];
  status: 'healthy' | 'attention';
}

const plural = (n: number) => (n === 1 ? '' : 's');

/**
 * PURE: per-user pipeline/data-linkage health from the records already loaded
 * for the user-detail view. No new query, no failure attribution.
 */
export function computeUserPipelineHealth(
  sessions: ReadonlyArray<{ shot_count: number; swing_score: number | null }>,
  analyses: ReadonlyArray<unknown>,
): PipelineHealth {
  const total = sessions.length;
  const empty = sessions.filter((s) => (s.shot_count ?? 0) === 0).length;
  const scored = sessions.filter((s) => s.swing_score != null).length;
  const unscored = sessions.filter((s) => (s.shot_count ?? 0) > 0 && s.swing_score == null).length;

  const gaps: string[] = [];
  if (empty > 0) gaps.push(`${empty} empty session${plural(empty)} (recorded with no shot data)`);
  if (unscored > 0) gaps.push(`${unscored} session${plural(unscored)} with shots but no diagnosis`);

  return {
    sessions: { total, scored, empty, unscored },
    analyses: { total: analyses.length },
    gaps,
    status: gaps.length ? 'attention' : 'healthy',
  };
}

export interface SystemPipelineHealth extends PipelineHealth {
  connected: boolean;
  reason?: string;
}

const NOT_CONNECTED =
  'Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY to read fleet-wide data health.';

/** Run a head-count query, returning 0 on any error (never throws). */
async function headCount(
  p: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await p;
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

/** Fleet-wide data-linkage health (every account). Service-role only. */
export async function getSystemPipelineHealth(): Promise<SystemPipelineHealth> {
  const empty: SystemPipelineHealth = {
    connected: false,
    reason: NOT_CONNECTED,
    sessions: { total: 0, scored: 0, empty: 0, unscored: 0 },
    analyses: { total: 0 },
    gaps: [],
    status: 'healthy',
  };
  if (!(await requireAdmin()).ok) {
    return { ...empty, reason: 'Unauthorized — admin authorization required.' };
  }
  const client = createSupabaseAdminClient();
  if (!client) return empty;

  const head = () => client.from('sessions').select('*', { count: 'exact', head: true });
  const [total, scored, sessEmpty, unscored, analysesTotal] = await Promise.all([
    headCount(head()),
    headCount(head().not('swing_score', 'is', null)),
    headCount(head().eq('shot_count', 0)),
    headCount(head().is('swing_score', null).gt('shot_count', 0)),
    headCount(client.from('video_analyses').select('*', { count: 'exact', head: true })),
  ]);

  const gaps: string[] = [];
  if (sessEmpty > 0) gaps.push(`${sessEmpty} empty session${plural(sessEmpty)} across all accounts`);
  if (unscored > 0) gaps.push(`${unscored} session${plural(unscored)} with shots but no diagnosis`);

  return {
    connected: true,
    sessions: { total, scored, empty: sessEmpty, unscored },
    analyses: { total: analysesTotal },
    gaps,
    status: gaps.length ? 'attention' : 'healthy',
  };
}
