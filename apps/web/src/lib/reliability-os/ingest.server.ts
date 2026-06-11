// ============================================================
// ReliabilityOS — optional durable ingest (SERVER-ONLY)
// ------------------------------------------------------------
// Cross-user runtime capture, reusing the existing `growth_records` JSONB table
// (kind 'operational-event') via the service-role admin client — the same
// no-migration reuse Founding Members uses. When Supabase isn't configured the
// admin client is null and every call is a safe no-op (the dashboard then shows
// admin-session + signal-derived health only, and says so).
//
// Only sanitized OperationalEvents are stored. Never throws.
// ============================================================

import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { OperationalEvent } from './types';

const TABLE = 'growth_records';
const KIND = 'operational-event';

/** Whether durable cross-user capture is active. */
export function isIngestEnabled(): boolean {
  return createSupabaseAdminClient() !== null;
}

/** Persist one sanitized event. No-op + false when keyless or on error. */
export async function ingestOperationalEvent(event: OperationalEvent): Promise<boolean> {
  const c = createSupabaseAdminClient();
  if (!c) return false;
  try {
    const now = new Date().toISOString();
    const { error } = await c
      .from(TABLE)
      .upsert({ id: event.id, kind: KIND, data: event, created_at: event.at || now, updated_at: now }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/** Read the most recent ingested events (admin read path). Empty when keyless. */
export async function listIngestedEvents(limit = 1000): Promise<OperationalEvent[]> {
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
    return (data as Array<{ data: OperationalEvent }>).map((r) => r.data).filter(Boolean);
  } catch {
    return [];
  }
}
