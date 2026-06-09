// ============================================================
// SwingVantage Admin — users adapter (SERVER-ONLY)
// ------------------------------------------------------------
// Cross-user account data via the service-role client (bypasses RLS).
// Returns { connected:false } honestly when the service role isn't set,
// so the UI shows a "connect" prompt instead of a fake list.
// Every query is guarded; partial data never throws.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin/context';
import type { SupabaseClient } from '@supabase/supabase-js';

// Defense-in-depth (F4): the service-role client below bypasses RLS, so every
// entry point re-asserts admin authz at the DATA boundary rather than trusting
// the layout guard alone (RSC pages run concurrently with the layout, so a
// layout redirect is not a hard data-fetch boundary).
const UNAUTHORIZED_REASON = 'Unauthorized — admin authorization required.';

export interface AdminUserRow {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  confirmed: boolean;
  name: string | null;
  sports: string[];
  skillLevel: string | null;
}

export interface AdminUsersResult {
  connected: boolean;
  reason?: string;
  users: AdminUserRow[];
  /** Number returned (a floor when capped). */
  total: number;
  capped: boolean;
}

const NOT_CONNECTED_REASON =
  'Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY to list and manage user accounts.';

/** Build a user_id → value map from a guarded select. */
async function mapBy<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  columns: string,
): Promise<T[]> {
  try {
    const { data, error } = await client.from(table).select(columns);
    if (error || !data) return [];
    return data as unknown as T[];
  } catch {
    return [];
  }
}

const SPORT_LABELS: Record<string, string> = {
  golf: 'Golf', tennis: 'Tennis', pickleball: 'Pickleball', padel: 'Padel',
  baseball: 'Baseball', softball_slow: 'Slow-pitch', softball_fast: 'Fast-pitch',
};

export function sportLabel(id: string): string {
  return SPORT_LABELS[id] ?? id;
}

export async function listAdminUsers(): Promise<AdminUsersResult> {
  if (!(await requireAdmin()).ok) {
    return { connected: false, reason: UNAUTHORIZED_REASON, users: [], total: 0, capped: false };
  }
  const client = createSupabaseAdminClient();
  if (!client) {
    return { connected: false, reason: NOT_CONNECTED_REASON, users: [], total: 0, capped: false };
  }

  // Auth users (one page; pre-revenue scale fits comfortably).
  const perPage = 1000;
  let authUsers: Array<{ id: string; email?: string | null; created_at?: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> }> = [];
  let capped = false;
  try {
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage });
    if (!error && data) {
      authUsers = data.users as typeof authUsers;
      capped = data.users.length >= perPage;
    }
  } catch {
    /* keep empty */
  }

  // Profiles to enrich each row.
  const [golf, sportRows] = await Promise.all([
    mapBy<{ user_id: string; name: string; skill_level: string }>(
      client, 'golfer_profiles', 'user_id, name, skill_level',
    ),
    mapBy<{ user_id: string; sport: string }>(client, 'sport_profiles', 'user_id, sport'),
  ]);

  const golfByUser = new Map(golf.map((g) => [g.user_id, g]));
  const sportsByUser = new Map<string, Set<string>>();
  for (const r of sportRows) {
    if (!sportsByUser.has(r.user_id)) sportsByUser.set(r.user_id, new Set());
    sportsByUser.get(r.user_id)!.add(r.sport);
  }

  const users: AdminUserRow[] = authUsers.map((u) => {
    const g = golfByUser.get(u.id);
    const sports = new Set(sportsByUser.get(u.id) ?? []);
    if (g) sports.add('golf');
    const metaName = typeof u.user_metadata?.name === 'string' ? (u.user_metadata.name as string) : null;
    return {
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: Boolean(u.email_confirmed_at),
      name: g?.name || metaName || null,
      sports: [...sports],
      skillLevel: g?.skill_level ?? null,
    };
  });

  // Newest first.
  users.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return { connected: true, users, total: users.length, capped };
}

// ── Single-user detail (the "full journey in 60s" view) ──────

export interface AdminUserDetail {
  connected: boolean;
  reason?: string;
  user: {
    id: string;
    email: string | null;
    createdAt: string | null;
    lastSignInAt: string | null;
    confirmed: boolean;
    provider: string | null;
    suspended: boolean;
  } | null;
  golfProfile: Record<string, unknown> | null;
  sportProfiles: { sport: string; data: Record<string, unknown>; updatedAt: string }[];
  sessions: Array<{ id: string; name: string; sport: string; date: string; shot_count: number; swing_score: number | null; created_at: string }>;
  analyses: Array<{ id: string; sport: string; file_name: string; overall_score: number; primary_issue: string | null; created_at: string }>;
  community: { xp_total: number } | null;
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  const empty: AdminUserDetail = {
    connected: false, reason: NOT_CONNECTED_REASON, user: null,
    golfProfile: null, sportProfiles: [], sessions: [], analyses: [], community: null,
  };
  if (!(await requireAdmin()).ok) return { ...empty, reason: UNAUTHORIZED_REASON };
  const client = createSupabaseAdminClient();
  if (!client) return empty;

  const safe = async <T>(p: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> => {
    try {
      const { data, error } = await p;
      return error || data == null ? fallback : data;
    } catch {
      return fallback;
    }
  };

  let authUser: AdminUserDetail['user'] = null;
  try {
    const { data } = await client.auth.admin.getUserById(id);
    if (data?.user) {
      const bannedUntil = (data.user as { banned_until?: string | null }).banned_until ?? null;
      authUser = {
        id: data.user.id,
        email: data.user.email ?? null,
        createdAt: data.user.created_at ?? null,
        lastSignInAt: data.user.last_sign_in_at ?? null,
        confirmed: Boolean(data.user.email_confirmed_at),
        provider: (data.user.app_metadata?.provider as string) ?? null,
        suspended: Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now()),
      };
    }
  } catch {
    /* leave null */
  }

  const [golfProfile, sportProfiles, sessions, analyses, community] = await Promise.all([
    safe<Record<string, unknown> | null>(
      client.from('golfer_profiles').select('*').eq('user_id', id).maybeSingle(), null,
    ),
    safe<Array<{ sport: string; data: Record<string, unknown>; updated_at: string }>>(
      client.from('sport_profiles').select('sport, data, updated_at').eq('user_id', id), [],
    ),
    safe<AdminUserDetail['sessions']>(
      client.from('sessions').select('id, name, sport, date, shot_count, swing_score, created_at')
        .eq('user_id', id).order('created_at', { ascending: false }).limit(50), [],
    ),
    safe<AdminUserDetail['analyses']>(
      client.from('video_analyses').select('id, sport, file_name, overall_score, primary_issue, created_at')
        .eq('user_id', id).order('created_at', { ascending: false }).limit(50), [],
    ),
    safe<{ xp_total: number } | null>(
      client.from('community_state').select('xp_total').eq('user_id', id).maybeSingle(), null,
    ),
  ]);

  return {
    connected: true,
    user: authUser,
    golfProfile,
    sportProfiles: (sportProfiles ?? []).map((s) => ({ sport: s.sport, data: s.data, updatedAt: s.updated_at })),
    sessions: sessions ?? [],
    analyses: analyses ?? [],
    community,
  };
}
