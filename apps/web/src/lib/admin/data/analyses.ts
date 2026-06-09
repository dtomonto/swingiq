// ============================================================
// SwingVantage Admin — analyses / media adapter (SERVER-ONLY)
// ------------------------------------------------------------
// Reads the video_analyses table (the ONLY swing-analysis record).
// Powers BOTH the Uploads (media lens) and AI Analyses (quality lens)
// sections.
//
// HONESTY: video_analyses stores METADATA ONLY. Swing videos are
// processed on-device and never uploaded, so there are no files to
// browse, and there is no processing-status or confidence column —
// we never invent those. "Needs review" is derived purely from the
// real overall_score.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin/context';
import type { SupabaseClient } from '@supabase/supabase-js';

// Defense-in-depth (F4): re-assert admin authz before any service-role read.
const UNAUTHORIZED_REASON = 'Unauthorized — admin authorization required.';

export interface AnalysisRow {
  id: string;
  userId: string;
  userEmail: string | null;
  sport: string;
  fileName: string;
  overallScore: number;
  issuesCount: number;
  primaryIssue: string | null;
  cameraAngle: string;
  phasesCount: number;
  createdAt: string;
}

export interface AnalysesResult {
  connected: boolean;
  reason?: string;
  rows: AnalysisRow[];
  total: number;
  /** Real, score-derived buckets (no fake "failed" state). */
  buckets: { needsReview: number; lowScore: number; strong: number };
}

const REASON =
  'Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY to review swing analyses and media metadata.';

/** Score thresholds for the honest review buckets. */
export const NEEDS_REVIEW_BELOW = 60;
export const STRONG_AT_OR_ABOVE = 85;

async function emailMap(client: SupabaseClient): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  try {
    const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) map.set(u.id, u.email ?? null);
  } catch {
    /* empty map is fine */
  }
  return map;
}

export async function listAnalyses(limit = 500): Promise<AnalysesResult> {
  if (!(await requireAdmin()).ok) {
    return { connected: false, reason: UNAUTHORIZED_REASON, rows: [], total: 0, buckets: { needsReview: 0, lowScore: 0, strong: 0 } };
  }
  const client = createSupabaseAdminClient();
  if (!client) {
    return { connected: false, reason: REASON, rows: [], total: 0, buckets: { needsReview: 0, lowScore: 0, strong: 0 } };
  }

  const [emails, data] = await Promise.all([
    emailMap(client),
    (async () => {
      try {
        const res = await client
          .from('video_analyses')
          .select('id, user_id, sport, file_name, overall_score, issues_count, primary_issue, camera_angle, phases_count, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);
        return res.error ? [] : res.data ?? [];
      } catch {
        return [];
      }
    })(),
  ]);

  const rows: AnalysisRow[] = (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    userEmail: emails.get(String(r.user_id)) ?? null,
    sport: String(r.sport ?? ''),
    fileName: String(r.file_name ?? ''),
    overallScore: Number(r.overall_score ?? 0),
    issuesCount: Number(r.issues_count ?? 0),
    primaryIssue: (r.primary_issue as string) ?? null,
    cameraAngle: String(r.camera_angle ?? ''),
    phasesCount: Number(r.phases_count ?? 0),
    createdAt: String(r.created_at ?? ''),
  }));

  const buckets = rows.reduce(
    (acc, r) => {
      if (r.overallScore < NEEDS_REVIEW_BELOW) acc.needsReview += 1;
      if (r.overallScore > 0 && r.overallScore < 40) acc.lowScore += 1;
      if (r.overallScore >= STRONG_AT_OR_ABOVE) acc.strong += 1;
      return acc;
    },
    { needsReview: 0, lowScore: 0, strong: 0 },
  );

  return { connected: true, rows, total: rows.length, buckets };
}

export interface AnalysisDetail {
  connected: boolean;
  reason?: string;
  row: AnalysisRow | null;
  session: { id: string; name: string; diagnoses: unknown[] } | null;
}

export async function getAnalysis(id: string): Promise<AnalysisDetail> {
  if (!(await requireAdmin()).ok) {
    return { connected: false, reason: UNAUTHORIZED_REASON, row: null, session: null };
  }
  const client = createSupabaseAdminClient();
  if (!client) return { connected: false, reason: REASON, row: null, session: null };

  let row: AnalysisRow | null = null;
  let sessionId: string | null = null;
  try {
    const { data } = await client
      .from('video_analyses')
      .select('id, user_id, session_id, sport, file_name, overall_score, issues_count, primary_issue, camera_angle, phases_count, created_at')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      const emails = await emailMap(client);
      sessionId = (data.session_id as string) ?? null;
      row = {
        id: String(data.id),
        userId: String(data.user_id),
        userEmail: emails.get(String(data.user_id)) ?? null,
        sport: String(data.sport ?? ''),
        fileName: String(data.file_name ?? ''),
        overallScore: Number(data.overall_score ?? 0),
        issuesCount: Number(data.issues_count ?? 0),
        primaryIssue: (data.primary_issue as string) ?? null,
        cameraAngle: String(data.camera_angle ?? ''),
        phasesCount: Number(data.phases_count ?? 0),
        createdAt: String(data.created_at ?? ''),
      };
    }
  } catch {
    /* leave null */
  }

  let session: AnalysisDetail['session'] = null;
  if (sessionId) {
    try {
      const { data } = await client.from('sessions').select('id, name, diagnoses').eq('id', sessionId).maybeSingle();
      if (data) session = { id: String(data.id), name: String(data.name ?? ''), diagnoses: (data.diagnoses as unknown[]) ?? [] };
    } catch {
      /* ignore */
    }
  }

  return { connected: true, row, session };
}
