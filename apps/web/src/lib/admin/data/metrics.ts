// ============================================================
// SwingVantage Admin — platform metrics (SERVER-ONLY)
// ------------------------------------------------------------
// Real cross-user counts for the Command Center, read with the
// service-role client (bypasses RLS). Every query is guarded
// independently so one failure never blanks the whole page.
//
// HONESTY: we only report what the schema actually stores. There is
// no "failed analysis" column and videos are never uploaded, so we
// do NOT invent those numbers — the UI shows "not tracked" instead.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin/context';
import type { SupabaseClient } from '@supabase/supabase-js';

// Defense-in-depth (F4): re-assert admin authz before any service-role read.
const UNAUTHORIZED_REASON = 'Unauthorized — admin authorization required.';

const SPORTS = [
  'golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast',
] as const;

export interface SportUsage { sport: string; sessions: number }

export interface RecentAnalysis {
  id: string;
  sport: string;
  file_name: string;
  overall_score: number;
  created_at: string;
}

export interface PlatformMetrics {
  connected: boolean;
  /** Present only when not connected — why the data is empty. */
  reason?: string;
  counts: {
    golfProfiles: number | null;
    sportProfiles: number | null;
    sessions: number | null;
    analyses: number | null;
    community: number | null;
    authUsers: number | null;
  };
  /** True when authUsers hit the page cap and is a floor, not exact. */
  authUsersCapped: boolean;
  sportUsage: SportUsage[];
  recentAnalyses: RecentAnalysis[];
}

/** Count rows in a table, returning null on any error (never throws). */
async function countRows(
  client: SupabaseClient,
  table: string,
  filter?: { col: string; val: string },
): Promise<number | null> {
  try {
    let q = client.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = q.eq(filter.col, filter.val);
    const { count, error } = await q;
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

/** Real auth user total via the admin API, capped at one page. */
async function countAuthUsers(client: SupabaseClient): Promise<{ count: number | null; capped: boolean }> {
  try {
    const perPage = 1000;
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage });
    if (error || !data) return { count: null, capped: false };
    const len = data.users.length;
    return { count: len, capped: len >= perPage };
  } catch {
    return { count: null, capped: false };
  }
}

const EMPTY: PlatformMetrics = {
  connected: false,
  counts: {
    golfProfiles: null, sportProfiles: null, sessions: null,
    analyses: null, community: null, authUsers: null,
  },
  authUsersCapped: false,
  sportUsage: [],
  recentAnalyses: [],
};

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  if (!(await requireAdmin()).ok) {
    return { ...EMPTY, reason: UNAUTHORIZED_REASON };
  }
  const client = createSupabaseAdminClient();
  if (!client) {
    return {
      ...EMPTY,
      reason:
        'Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY (and the public Supabase keys) to see live cross-user data.',
    };
  }

  const [
    golfProfiles, sportProfiles, sessions, analyses, community, authUsers,
    sportCounts, recent,
  ] = await Promise.all([
    countRows(client, 'golfer_profiles'),
    countRows(client, 'sport_profiles'),
    countRows(client, 'sessions'),
    countRows(client, 'video_analyses'),
    countRows(client, 'community_state'),
    countAuthUsers(client),
    Promise.all(SPORTS.map((s) => countRows(client, 'sessions', { col: 'sport', val: s }))),
    fetchRecentAnalyses(client),
  ]);

  const sportUsage: SportUsage[] = SPORTS
    .map((sport, i) => ({ sport, sessions: sportCounts[i] ?? 0 }))
    .filter((s) => s.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions);

  return {
    connected: true,
    counts: {
      golfProfiles, sportProfiles, sessions, analyses, community,
      authUsers: authUsers.count,
    },
    authUsersCapped: authUsers.capped,
    sportUsage,
    recentAnalyses: recent,
  };
}

async function fetchRecentAnalyses(client: SupabaseClient): Promise<RecentAnalysis[]> {
  try {
    const { data, error } = await client
      .from('video_analyses')
      .select('id, sport, file_name, overall_score, created_at')
      .order('created_at', { ascending: false })
      .limit(8);
    if (error || !data) return [];
    return data as RecentAnalysis[];
  } catch {
    return [];
  }
}
