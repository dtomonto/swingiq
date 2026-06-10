// ============================================================
// Theme Lab — publishing-center (#3 step 3). Brings the PublishingOS GOVERNANCE
// pattern (durable record + risk + status workflow + rollback + audit-ready) to
// themes, WITHOUT touching lib/publishing — it's a self-contained, local-first
// theme-publish layer. A "publish" record declares WHO should get a theme
// (all / segment / % / sport / page); it's draft until an operator publishes it,
// and can always be rolled back. PURE + SSR-safe; writes broadcast.
//
// Validation honesty: only a LIVE, registry-active theme is safe to publish
// broadly — those passed the build-time AA contrast gate. A draft/generated
// theme (not yet committed) is high-risk to publish until it's promoted.
// ============================================================

import type { ThemeId } from '@/lib/theme/themes';
import { isThemeActive, type ThemeLabEntry } from './registry';

export const THEME_PUBLISH_STORAGE_KEY = 'swingiq-theme-publish';
export const THEME_PUBLISH_CHANGE_EVENT = 'swingiq-theme-publish-change';

export type PublishScope = 'all' | 'segment' | 'percent' | 'sport' | 'page';
export type PublishStatus = 'draft' | 'published' | 'rolled-back';
export type PublishRisk = 'low' | 'medium' | 'high';

export interface ThemePublishRecord {
  id: string;
  themeId: ThemeId;
  scope: PublishScope;
  /** Segment key / sport id / page path; empty for scope 'all' or 'percent'. */
  target: string;
  /** Only for scope 'percent' (0–100). */
  rolloutPercent?: number;
  status: PublishStatus;
  risk: PublishRisk;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

/**
 * Risk of publishing `themeId` at `scope`. A non-active theme (draft/generated/
 * retired — not contrast-gated in the build) is always high. Otherwise risk
 * scales with blast radius: all > broad % > narrow segment/sport/page.
 */
export function assessPublishRisk(
  themeId: ThemeId,
  scope: PublishScope,
  rolloutPercent: number | undefined,
  registry?: ThemeLabEntry[],
): PublishRisk {
  if (!isThemeActive(themeId, registry)) return 'high';
  if (scope === 'all') return 'medium';
  if (scope === 'percent') return (rolloutPercent ?? 100) >= 50 ? 'medium' : 'low';
  return 'low'; // segment / sport / page
}

function broadcast(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event(THEME_PUBLISH_CHANGE_EVENT));
    } catch {
      /* ignore */
    }
  }
}

export function readPublishRecords(): ThemePublishRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(THEME_PUBLISH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ThemePublishRecord[]) : [];
  } catch {
    return [];
  }
}

function write(records: ThemePublishRecord[]): ThemePublishRecord[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_PUBLISH_STORAGE_KEY, JSON.stringify(records));
      broadcast();
    } catch {
      /* storage unavailable */
    }
  }
  return records;
}

export interface CreatePublishInput {
  themeId: ThemeId;
  scope: PublishScope;
  target?: string;
  rolloutPercent?: number;
  note?: string;
  registry?: ThemeLabEntry[];
}

/** Create a DRAFT publish record (nothing goes live until `publish()`). */
export function createPublishDraft(input: CreatePublishInput): ThemePublishRecord {
  const now = new Date().toISOString();
  const record: ThemePublishRecord = {
    id: `pub-${input.themeId}-${input.scope}-${Date.now().toString(36)}`,
    themeId: input.themeId,
    scope: input.scope,
    target: input.target ?? '',
    rolloutPercent: input.scope === 'percent' ? (input.rolloutPercent ?? 100) : undefined,
    status: 'draft',
    risk: assessPublishRisk(input.themeId, input.scope, input.rolloutPercent, input.registry),
    createdAt: now,
    updatedAt: now,
    note: input.note,
  };
  write([...readPublishRecords(), record]);
  return record;
}

function setStatus(id: string, status: PublishStatus): ThemePublishRecord[] {
  return write(
    readPublishRecords().map((r) =>
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r,
    ),
  );
}

/** Promote a draft to published. */
export function publishRecord(id: string): ThemePublishRecord[] {
  return setStatus(id, 'published');
}

/** Roll a published record back (reversible governance — never destructive). */
export function rollbackRecord(id: string): ThemePublishRecord[] {
  return setStatus(id, 'rolled-back');
}

export function removePublishRecord(id: string): ThemePublishRecord[] {
  return write(readPublishRecords().filter((r) => r.id !== id));
}

/** The records that are currently live (published, not rolled back). */
export function activePublishRecords(
  records: ThemePublishRecord[] = readPublishRecords(),
): ThemePublishRecord[] {
  return records.filter((r) => r.status === 'published');
}
