// ============================================================
// SwingVantage — First-Party Intelligence OS · persistence (SERVER-ONLY)
// ------------------------------------------------------------
// Reuses the shared `growth_records` JSONB table (the same store
// CentralIntelligenceOS + GrowthOS use) via the service-role admin client.
// Keyless-first: with no Supabase configured it degrades to an in-process
// store seeded EMPTY (we never fabricate AI activity — the admin sees honest
// empty states until real features instrument the router).
//
// SECURITY: service-role client bypasses RLS — safe because every caller is
// already behind the requireAdmin() guard.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { KINDS, DEFAULT_SETTINGS, INTELLIGENCE_SETTINGS_ID } from './config';
import type {
  AIActivityEvent, KnowledgeItem, CanonicalAnswer, PatternMemory,
  AnswerCacheEntry, EvaluationRecord, TokenSavingsEntry, IntelligenceSettings,
  ActionTask, ActionReport,
} from './types';

const TABLE = 'growth_records';
const GLOBAL_KEY = '__intelligence_os_mem_store__';

function globalStore(): Map<string, Map<string, { id: string }>> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY] as Map<string, Map<string, { id: string }>>;
}

export interface Repository<T extends { id: string }> {
  kind: string;
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | undefined>;
  remove(id: string): Promise<boolean>;
  isPersistent(): boolean;
}

class MemoryStore<T extends { id: string }> {
  private map: Map<string, T>;
  constructor(kind: string) {
    const gs = globalStore();
    let m = gs.get(kind) as Map<string, T> | undefined;
    if (!m) { m = new Map<string, T>(); gs.set(kind, m as Map<string, { id: string }>); }
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
  clear(): void { this.map.clear(); }
}

function makeRepo<T extends { id: string }>(kind: string): Repository<T> {
  const mem = new MemoryStore<T>(kind);
  const admin = () => createSupabaseAdminClient();
  return {
    kind,
    isPersistent() { return admin() !== null; },
    async list() {
      const c = admin();
      if (!c) return mem.list();
      try {
        const { data, error } = await c.from(TABLE).select('data').eq('kind', kind);
        if (error || !data) return mem.list();
        return (data as Array<{ data: T }>).map((r) => r.data);
      } catch { return mem.list(); }
    },
    async get(id) {
      const c = admin();
      if (!c) return mem.get(id);
      try {
        const { data, error } = await c.from(TABLE).select('data').eq('kind', kind).eq('id', id).maybeSingle();
        if (error || !data) return mem.get(id);
        return (data as { data: T }).data;
      } catch { return mem.get(id); }
    },
    async create(item) {
      const c = admin();
      if (!c) return mem.create(item);
      const now = new Date().toISOString();
      const { error } = await c.from(TABLE).upsert(
        { id: item.id, kind, data: item, created_at: now, updated_at: now }, { onConflict: 'id' },
      );
      if (error) return mem.create(item);
      return item;
    },
    async update(id, patch) {
      const c = admin();
      if (!c) return mem.update(id, patch);
      const existing = await this.get(id);
      if (!existing) return mem.update(id, patch);
      const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() } as T;
      const { error } = await c.from(TABLE).update({ data: merged, updated_at: new Date().toISOString() }).eq('id', id).eq('kind', kind);
      if (error) return mem.update(id, patch);
      return merged;
    },
    async remove(id) {
      const c = admin();
      if (!c) return mem.remove(id);
      const { error } = await c.from(TABLE).delete().eq('id', id).eq('kind', kind);
      if (error) return mem.remove(id);
      return true;
    },
  };
}

// ── Typed repository singletons ───────────────────────────────
export const activityRepo = makeRepo<AIActivityEvent>(KINDS.activity);
export const knowledgeRepo = makeRepo<KnowledgeItem>(KINDS.knowledge);
export const canonicalRepo = makeRepo<CanonicalAnswer>(KINDS.canonical);
export const patternRepo = makeRepo<PatternMemory>(KINDS.pattern);
export const cacheRepo = makeRepo<AnswerCacheEntry>(KINDS.cache);
export const evaluationRepo = makeRepo<EvaluationRecord>(KINDS.evaluation);
export const savingsRepo = makeRepo<TokenSavingsEntry>(KINDS.savings);
export const taskRepo = makeRepo<ActionTask>(KINDS.task);
export const reportRepo = makeRepo<ActionReport>(KINDS.report);

/** True when the Intelligence OS is backed by a real database. */
export function isIntelligencePersistent(): boolean {
  return activityRepo.isPersistent();
}

// ── Settings singleton ────────────────────────────────────────
const settingsRepo = makeRepo<IntelligenceSettings>(KINDS.settings);

export async function getSettings(): Promise<IntelligenceSettings> {
  const found = await settingsRepo.get(INTELLIGENCE_SETTINGS_ID);
  return found ? { ...DEFAULT_SETTINGS, ...found } : { ...DEFAULT_SETTINGS };
}

export async function saveSettings(patch: Partial<IntelligenceSettings>, updatedBy: string | null): Promise<IntelligenceSettings> {
  const current = await getSettings();
  const next: IntelligenceSettings = {
    ...current, ...patch,
    id: INTELLIGENCE_SETTINGS_ID,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await settingsRepo.create(next); // upsert by id
  return next;
}

// ── Test-only reset (mirrors __resetFoundingStoreForTests) ────
// Clears each inner map IN PLACE — the repo singletons captured references to
// these maps at construction, so replacing the global key would not affect them.
export function __resetIntelligenceStoreForTests(): void {
  for (const m of globalStore().values()) m.clear();
}
