// ============================================================
// SignalRadar OS — optional durable webhook ingest (SERVER-ONLY)
// ------------------------------------------------------------
// Cross-session signal persistence, reusing the existing `growth_records`
// JSONB table (kind 'signal-radar-signal') via the service-role admin
// client — the same no-migration reuse ReliabilityOS + Founding Members
// use. When Supabase isn't configured the admin client is null and every
// call is a safe no-op (automated ingest is simply OFF, and the UI says
// so). The row id is the signal fingerprint, so re-POSTing the same
// mention upserts in place instead of duplicating. Never throws.
// ============================================================

import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { Signal } from './types';

const TABLE = 'growth_records';
const KIND = 'signal-radar-signal';

/** Whether durable webhook ingest is active (Supabase service role present). */
export function isSignalIngestEnabled(): boolean {
  return createSupabaseAdminClient() !== null;
}

/** Persist one processed signal (idempotent by fingerprint). No-op when keyless. */
export async function ingestSignal(signal: Signal): Promise<boolean> {
  const c = createSupabaseAdminClient();
  if (!c) return false;
  try {
    const now = new Date().toISOString();
    const { error } = await c
      .from(TABLE)
      .upsert(
        { id: `sr_${signal.fingerprint}`, kind: KIND, data: signal, created_at: signal.discoveredAt || now, updated_at: now },
        { onConflict: 'id' },
      );
    return !error;
  } catch {
    return false;
  }
}

/** Read the most recent ingested signals (admin read path). Empty when keyless. */
export async function listIngestedSignals(limit = 500): Promise<Signal[]> {
  const c = createSupabaseAdminClient();
  if (!c) return [];
  try {
    const { data, error } = await c
      .from(TABLE)
      .select('data')
      .eq('kind', KIND)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as Array<{ data: Signal }>)
      .map((r) => r.data)
      .filter((s): s is Signal => Boolean(s && s.id && s.fingerprint))
      .map((s) => ({ ...s, ingested: true }));
  } catch {
    return [];
  }
}
