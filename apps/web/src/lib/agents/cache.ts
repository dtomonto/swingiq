// ============================================================
// SwingIQ — Agent Layer: Cache / Memoization
// ------------------------------------------------------------
// Stores short, structured agent snapshots keyed by an input
// hash so stable guidance is not recomputed every render and
// expensive (optional) LLM calls are never repeated for the
// same inputs.
//
// LOCAL-FIRST: uses its own localStorage namespace. It does NOT
// touch the main app store or the backup file, so it is fully
// additive and cannot corrupt user data.
// ============================================================

import type { AgentContext, AgentMemorySnapshot } from './types';

const NAMESPACE = 'swingiq-agent-cache-v1';
const MAX_ENTRIES = 24;

interface CacheEntry<T> {
  hash: string;
  value: T;
  createdAt: string;
  expiresAt?: string;
}

type CacheFile = Record<string, CacheEntry<unknown>>;

// ── Stable hashing ────────────────────────────────────────────

/** Small, stable, non-cryptographic hash (djb2). Good enough for keys. */
export function stableHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  // >>> 0 forces unsigned 32-bit
  return (h >>> 0).toString(36);
}

/**
 * Builds a hash from the parts of the context that should invalidate a
 * cached result when they change: sport, profile presence, session count,
 * latest focus, plan status, and equipment completeness.
 */
export function contextHash(ctx: AgentContext, salt = ''): string {
  const parts = [
    salt,
    ctx.activeSport,
    ctx.profile.exists ? '1' : '0',
    ctx.profile.skillLevel ?? '-',
    String(ctx.sessionCount),
    ctx.latestSession?.id ?? '-',
    ctx.latestSession?.primaryFocus ?? '-',
    ctx.latestDiagnosedSession?.id ?? '-',
    ctx.planStatus,
    String(ctx.equipment.completeness),
    String(ctx.daysSinceLastActivity ?? -1),
    String(ctx.usageCategory ?? '-'),
  ];
  return stableHash(parts.join('|'));
}

// ── Storage (SSR-safe) ────────────────────────────────────────

function read(): CacheFile {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(NAMESPACE);
    return raw ? (JSON.parse(raw) as CacheFile) : {};
  } catch {
    return {};
  }
}

function write(file: CacheFile): void {
  if (typeof window === 'undefined') return;
  try {
    // Cap the number of entries (drop oldest by createdAt).
    const entries = Object.entries(file);
    if (entries.length > MAX_ENTRIES) {
      entries.sort((a, b) => a[1].createdAt.localeCompare(b[1].createdAt));
      const trimmed = entries.slice(entries.length - MAX_ENTRIES);
      file = Object.fromEntries(trimmed);
    }
    window.localStorage.setItem(NAMESPACE, JSON.stringify(file));
  } catch {
    // Quota or unavailable — caching is best-effort, never fatal.
  }
}

// ── Public API ────────────────────────────────────────────────

export function getCached<T>(key: string): T | null {
  const file = read();
  const entry = file[key];
  if (!entry) return null;
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    delete file[key];
    write(file);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs?: number): void {
  const file = read();
  file[key] = {
    hash: key,
    value,
    createdAt: new Date().toISOString(),
    expiresAt: ttlMs ? new Date(Date.now() + ttlMs).toISOString() : undefined,
  };
  write(file);
}

/** Memoize a deterministic computation by key. */
export function memoize<T>(key: string, compute: () => T, ttlMs?: number): T {
  const hit = getCached<T>(key);
  if (hit !== null) return hit;
  const value = compute();
  setCached(key, value, ttlMs);
  return value;
}

// ── Compact memory snapshots ──────────────────────────────────

const SNAPSHOT_KEY = 'snapshot:latest';

export function saveSnapshot(snapshot: AgentMemorySnapshot): void {
  setCached(SNAPSHOT_KEY, snapshot);
}

export function getLastSnapshot(): AgentMemorySnapshot | null {
  return getCached<AgentMemorySnapshot>(SNAPSHOT_KEY);
}

export function clearAgentCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(NAMESPACE);
  } catch {
    // ignore
  }
}
