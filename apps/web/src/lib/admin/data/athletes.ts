// ============================================================
// SwingVantage Admin — athletes adapter (SERVER-ONLY)
// ------------------------------------------------------------
// One row per (user, sport) profile: golfer_profiles for golf and
// sport_profiles (loose jsonb) for the other six sports. The detail
// view reuses getAdminUser() from ./users so a user's whole athletic
// footprint shows on one page.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AthleteRow {
  userId: string;
  sport: string;
  name: string | null;
  email: string | null;
  skill: string | null;
  goal: string | null;
  updatedAt: string;
}

export interface AthletesResult {
  connected: boolean;
  reason?: string;
  rows: AthleteRow[];
  bySport: Record<string, number>;
}

const REASON =
  'Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY to review athlete profiles.';

/** Pull a human skill label out of a loose per-sport profile document. */
function skillFromData(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  for (const key of ['skill_level', 'skill', 'level', 'rating', 'dupr', 'utr', 'ntrp']) {
    const v = data[key];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function goalFromData(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  for (const key of ['primary_goal', 'goal', 'objective']) {
    const v = data[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

async function emailMap(client: SupabaseClient): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  try {
    const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) map.set(u.id, u.email ?? null);
  } catch {
    /* empty */
  }
  return map;
}

export async function listAthletes(): Promise<AthletesResult> {
  const client = createSupabaseAdminClient();
  if (!client) return { connected: false, reason: REASON, rows: [], bySport: {} };

  const safeSelect = async <T>(table: string, columns: string): Promise<T[]> => {
    try {
      const { data, error } = await client.from(table).select(columns);
      return error || !data ? [] : (data as unknown as T[]);
    } catch {
      return [];
    }
  };

  const [emails, golf, sportRows] = await Promise.all([
    emailMap(client),
    safeSelect<{ user_id: string; name: string; skill_level: string; primary_goal: string; updated_at: string }>(
      'golfer_profiles', 'user_id, name, skill_level, primary_goal, updated_at',
    ),
    safeSelect<{ user_id: string; sport: string; data: Record<string, unknown>; updated_at: string }>(
      'sport_profiles', 'user_id, sport, data, updated_at',
    ),
  ]);

  const rows: AthleteRow[] = [];

  for (const g of golf) {
    rows.push({
      userId: g.user_id,
      sport: 'golf',
      name: g.name || null,
      email: emails.get(g.user_id) ?? null,
      skill: g.skill_level || null,
      goal: g.primary_goal || null,
      updatedAt: g.updated_at ?? '',
    });
  }

  for (const s of sportRows) {
    rows.push({
      userId: s.user_id,
      sport: s.sport,
      name: (typeof s.data?.name === 'string' ? (s.data.name as string) : null),
      email: emails.get(s.user_id) ?? null,
      skill: skillFromData(s.data),
      goal: goalFromData(s.data),
      updatedAt: s.updated_at ?? '',
    });
  }

  rows.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));

  const bySport = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.sport] = (acc[r.sport] ?? 0) + 1;
    return acc;
  }, {});

  return { connected: true, rows, bySport };
}
