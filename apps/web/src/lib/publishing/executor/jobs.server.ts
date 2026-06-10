// ============================================================
// PublishingOS executor — PublishJob persistence (SERVER-ONLY)
// ------------------------------------------------------------
// Durable record of every deploy-backed publish attempt (queued → running →
// succeeded/failed, with branch / commit / PR url). Reuses the publishing_records
// table with kind='job' and the same Supabase-or-memory fallback as the rest of
// PublishingOS. Kept in its own module (not the shared store) to stay clear of
// concurrent edits to lib/publishing/store.ts.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { PublishJob } from '../types';

const TABLE = 'publishing_records';
const KIND = 'job';
const GLOBAL_KEY = '__publishingos_jobs_mem__';

function mem(): Map<string, PublishJob> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map<string, PublishJob>();
  return g[GLOBAL_KEY] as Map<string, PublishJob>;
}

const admin = () => createSupabaseAdminClient();

export async function upsertJob(job: PublishJob): Promise<PublishJob> {
  const c = admin();
  if (!c) {
    mem().set(job.id, job);
    return job;
  }
  const now = new Date().toISOString();
  const { error } = await c
    .from(TABLE)
    .upsert({ id: `${KIND}:${job.id}`, kind: KIND, data: job, created_at: now, updated_at: now }, { onConflict: 'id' });
  if (error) mem().set(job.id, job);
  return job;
}

export async function listJobs(entityId?: string): Promise<PublishJob[]> {
  const c = admin();
  let all: PublishJob[];
  if (!c) {
    all = Array.from(mem().values());
  } else {
    try {
      const { data, error } = await c.from(TABLE).select('data').eq('kind', KIND);
      all = error || !data ? Array.from(mem().values()) : (data as Array<{ data: PublishJob }>).map((r) => r.data);
    } catch {
      all = Array.from(mem().values());
    }
  }
  return all
    .filter((j) => !entityId || j.publishableEntityId === entityId)
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
}

export async function getJob(id: string): Promise<PublishJob | undefined> {
  return (await listJobs()).find((j) => j.id === id);
}

/** TEST-ONLY: clear the in-process job store. */
export function __resetJobStore(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g[GLOBAL_KEY];
}
