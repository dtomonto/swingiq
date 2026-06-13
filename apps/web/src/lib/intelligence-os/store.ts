// ============================================================
// First-Party Intelligence OS — repository / storage seam
// ------------------------------------------------------------
// One async seam between the OS and storage. When Supabase is configured,
// records persist in a single `intelligence_os_records` JSONB table keyed by
// `kind` (migration: apps/web/supabase-intelligence-os.sql). When it isn't,
// the repo degrades to an in-process store seeded from ./seed so the whole
// system works keyless — identical pattern to lib/growth/repository.ts.
//
// SECURITY: uses the service-role admin client (BYPASSES RLS). Safe because
// every route + write API that reaches this layer is already behind the
// /admin guard (requireAdmin + RBAC). Never import from a public surface.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { RECORD_KINDS, type RecordKind } from './types';
import type {
  AiActivityEvent, KnowledgeItem, CanonicalAnswer, PatternMemory, AnswerCache,
  EvaluationRecord, TokenSavingsEntry, ActionTask, ActionReport, IntelligenceSettings,
} from './types';
import * as seed from './seed';

const TABLE = 'intelligence_os_records';

export interface Repository<T extends { id: string }> {
  kind: RecordKind;
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | undefined>;
  remove(id: string): Promise<boolean>;
  isPersistent(): boolean;
}

// ── In-process fallback store (globalThis singleton; survives HMR) ──
const GLOBAL_KEY = '__intelligence_os_mem_store__';
function globalStore(): Map<string, Map<string, { id: string }>> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map<string, Map<string, { id: string }>>();
  return g[GLOBAL_KEY] as Map<string, Map<string, { id: string }>>;
}

class MemoryStore<T extends { id: string }> {
  private map: Map<string, T>;
  constructor(kind: string, seedItems: T[]) {
    const gs = globalStore();
    let m = gs.get(kind) as Map<string, T> | undefined;
    if (!m) {
      m = new Map<string, T>();
      for (const item of seedItems) m.set(item.id, { ...item });
      gs.set(kind, m as Map<string, { id: string }>);
    }
    this.map = m;
  }
  list(): T[] { return Array.from(this.map.values()).map((i) => ({ ...i })); }
  get(id: string): T | undefined { const f = this.map.get(id); return f ? { ...f } : undefined; }
  create(item: T): T { this.map.set(item.id, { ...item }); return item; }
  update(id: string, patch: Partial<T>): T | undefined {
    const e = this.map.get(id);
    if (!e) return undefined;
    const merged = { ...e, ...patch } as T;
    this.map.set(id, merged);
    return { ...merged };
  }
  remove(id: string): boolean { return this.map.delete(id); }
}

function makeRepo<T extends { id: string }>(kind: RecordKind, seedItems: T[]): Repository<T> {
  const mem = new MemoryStore<T>(kind, seedItems);
  const admin = () => createSupabaseAdminClient();

  return {
    kind,
    isPersistent() { return admin() !== null; },

    async list(): Promise<T[]> {
      const c = admin();
      if (!c) return mem.list();
      try {
        const { data, error } = await c.from(TABLE).select('data').eq('kind', kind);
        if (error || !data) return mem.list();
        return (data as Array<{ data: T }>).map((r) => r.data);
      } catch {
        return mem.list();
      }
    },

    async get(id: string): Promise<T | undefined> {
      const c = admin();
      if (!c) return mem.get(id);
      try {
        const { data, error } = await c.from(TABLE).select('data').eq('kind', kind).eq('id', id).maybeSingle();
        if (error || !data) return mem.get(id);
        return (data as { data: T }).data;
      } catch {
        return mem.get(id);
      }
    },

    async create(item: T): Promise<T> {
      const c = admin();
      if (!c) return mem.create(item);
      const now = new Date().toISOString();
      const { error } = await c.from(TABLE).upsert(
        { id: item.id, kind, data: item, created_at: now, updated_at: now },
        { onConflict: 'id' },
      );
      if (error) return mem.create(item);
      return item;
    },

    async update(id: string, patch: Partial<T>): Promise<T | undefined> {
      const c = admin();
      if (!c) return mem.update(id, patch);
      const existing = await this.get(id);
      if (!existing) return mem.update(id, patch);
      const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() } as T;
      const { error } = await c.from(TABLE)
        .update({ data: merged, updated_at: new Date().toISOString() })
        .eq('id', id).eq('kind', kind);
      if (error) return mem.update(id, patch);
      return merged;
    },

    async remove(id: string): Promise<boolean> {
      const c = admin();
      if (!c) return mem.remove(id);
      const { error } = await c.from(TABLE).delete().eq('id', id).eq('kind', kind);
      if (error) return mem.remove(id);
      return true;
    },
  };
}

// ── Typed repository singletons ───────────────────────────────
export const aiEventsRepo = makeRepo<AiActivityEvent>(RECORD_KINDS.aiEvent, seed.AI_EVENTS);
export const knowledgeRepo = makeRepo<KnowledgeItem>(RECORD_KINDS.knowledge, seed.KNOWLEDGE);
export const canonicalRepo = makeRepo<CanonicalAnswer>(RECORD_KINDS.canonical, seed.CANONICAL);
export const patternsRepo = makeRepo<PatternMemory>(RECORD_KINDS.pattern, seed.PATTERNS);
export const cacheRepo = makeRepo<AnswerCache>(RECORD_KINDS.cache, seed.CACHE);
export const evaluationsRepo = makeRepo<EvaluationRecord>(RECORD_KINDS.evaluation, seed.EVALUATIONS);
export const tokenSavingsRepo = makeRepo<TokenSavingsEntry>(RECORD_KINDS.tokenSavings, seed.TOKEN_SAVINGS);
export const tasksRepo = makeRepo<ActionTask>(RECORD_KINDS.task, seed.TASKS);
export const reportsRepo = makeRepo<ActionReport>(RECORD_KINDS.report, seed.REPORTS);
export const settingsRepo = makeRepo<IntelligenceSettings>(RECORD_KINDS.settings, seed.SETTINGS);

/** Registry of writable repositories keyed by the API `kind`. */
export const RECORD_REPOS: Record<string, Repository<{ id: string }>> = {
  [RECORD_KINDS.aiEvent]: aiEventsRepo as Repository<{ id: string }>,
  [RECORD_KINDS.knowledge]: knowledgeRepo as Repository<{ id: string }>,
  [RECORD_KINDS.canonical]: canonicalRepo as Repository<{ id: string }>,
  [RECORD_KINDS.pattern]: patternsRepo as Repository<{ id: string }>,
  [RECORD_KINDS.cache]: cacheRepo as Repository<{ id: string }>,
  [RECORD_KINDS.evaluation]: evaluationsRepo as Repository<{ id: string }>,
  [RECORD_KINDS.tokenSavings]: tokenSavingsRepo as Repository<{ id: string }>,
  [RECORD_KINDS.task]: tasksRepo as Repository<{ id: string }>,
  [RECORD_KINDS.report]: reportsRepo as Repository<{ id: string }>,
  [RECORD_KINDS.settings]: settingsRepo as Repository<{ id: string }>,
};

/** True when the OS is DB-backed (Supabase configured). */
export function isIntelligencePersistent(): boolean {
  return aiEventsRepo.isPersistent();
}

/** Resolve effective settings (first record, or the seeded default). */
export async function getSettings(): Promise<IntelligenceSettings> {
  const all = await settingsRepo.list();
  return all[0] ?? seed.SETTINGS[0];
}
