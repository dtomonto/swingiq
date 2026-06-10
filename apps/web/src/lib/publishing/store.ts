// ============================================================
// PublishingOS — durable store (SERVER-ONLY)
// ------------------------------------------------------------
// The production-safe persistence layer. It NEVER touches the filesystem, so it
// works on Vercel's read-only/ephemeral runtime. It reuses the exact pattern
// proven by lib/growth/repository.ts:
//
//   • When Supabase is configured → rows persist in `publishing_records`
//     (a single JSONB table keyed by `kind`), written via the service-role
//     admin client (bypasses RLS; only reachable behind requireAdmin()).
//   • When it isn't (keyless/dev) → a globalThis-backed in-process store keeps
//     the whole flow working so the UI never hard-fails. Every Supabase path
//     falls back to memory on error (e.g. table not migrated yet).
//
// Three record kinds share the table: 'entity' (PublishableEntity),
// 'event' (PublishEvent audit trail) and 'override' (durable publish-state).
//
// Run apps/web/supabase-publishing.sql once to enable durable persistence.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { PublishableEntity, PublishEvent, PublishOverride, PublishEntityType } from './types';

const TABLE = 'publishing_records';

type Kind = 'entity' | 'event' | 'override';

// ── In-process fallback (shared across module instances in one process) ──
const GLOBAL_KEY = '__publishingos_mem_store__';

function mem(): Map<Kind, Map<string, unknown>> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map<Kind, Map<string, unknown>>([
      ['entity', new Map()],
      ['event', new Map()],
      ['override', new Map()],
    ]);
  }
  return g[GLOBAL_KEY] as Map<Kind, Map<string, unknown>>;
}

const admin = () => createSupabaseAdminClient();

/** True when durable (DB) persistence is active. */
export function isPublishingPersistent(): boolean {
  return admin() !== null;
}

async function upsert(kind: Kind, id: string, data: unknown): Promise<void> {
  const c = admin();
  if (!c) {
    mem().get(kind)!.set(id, data);
    return;
  }
  const now = new Date().toISOString();
  const { error } = await c
    .from(TABLE)
    .upsert({ id: `${kind}:${id}`, kind, data, created_at: now, updated_at: now }, { onConflict: 'id' });
  if (error) mem().get(kind)!.set(id, data); // graceful fallback
}

async function listAll<T>(kind: Kind): Promise<T[]> {
  const c = admin();
  if (!c) return Array.from(mem().get(kind)!.values()) as T[];
  try {
    const { data, error } = await c.from(TABLE).select('data').eq('kind', kind);
    if (error || !data) return Array.from(mem().get(kind)!.values()) as T[];
    return (data as Array<{ data: T }>).map((r) => r.data);
  } catch {
    return Array.from(mem().get(kind)!.values()) as T[];
  }
}

// ── Publish-state overrides (the production-safe publish toggle) ──────────

/** Persist a publish/draft decision durably. Returns the stored override. */
export async function setPublishOverride(
  entityType: PublishEntityType,
  entityId: string,
  published: boolean,
  actorEmail?: string,
): Promise<PublishOverride> {
  const override: PublishOverride = {
    id: `${entityType}:${entityId}`,
    entityType,
    entityId,
    published,
    actorEmail,
    updatedAt: new Date().toISOString(),
  };
  await upsert('override', override.id, override);
  return override;
}

/** All overrides for one surface, as a `{ entityId → published }` map. */
export async function getPublishOverrides(
  entityType: PublishEntityType,
): Promise<Record<string, boolean>> {
  const all = await listAll<PublishOverride>('override');
  const map: Record<string, boolean> = {};
  for (const o of all) {
    if (o.entityType === entityType) map[o.entityId] = o.published;
  }
  return map;
}

/** Every override across all surfaces (for the admin queue). */
export async function listPublishOverrides(): Promise<PublishOverride[]> {
  return listAll<PublishOverride>('override');
}

// ── Entities ─────────────────────────────────────────────────────────────

export async function upsertEntity(entity: PublishableEntity): Promise<PublishableEntity> {
  await upsert('entity', entity.id, entity);
  return entity;
}

export async function getEntity(id: string): Promise<PublishableEntity | undefined> {
  const all = await listAll<PublishableEntity>('entity');
  return all.find((e) => e.id === id);
}

export async function listEntities(): Promise<PublishableEntity[]> {
  return listAll<PublishableEntity>('entity');
}

// ── Events (immutable audit trail) ───────────────────────────────────────

export async function appendEvent(event: PublishEvent): Promise<PublishEvent> {
  await upsert('event', event.id, event);
  return event;
}

/** Events newest-first, optionally filtered to one entity. */
export async function listEvents(entityId?: string): Promise<PublishEvent[]> {
  const all = await listAll<PublishEvent>('event');
  return all
    .filter((e) => !entityId || e.publishableEntityId === entityId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** TEST-ONLY: clear the in-process store between unit tests. */
export function __resetMemoryStore(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g[GLOBAL_KEY];
}
