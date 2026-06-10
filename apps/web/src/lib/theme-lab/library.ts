// ============================================================
// Theme Lab — theme library (#3 step 3 + 8). A unified catalog of every theme:
// the LIVE published themes (derived from the engine registry) PLUS local-first
// DRAFT / GENERATED candidates (from the token builder or periodic generation).
// Drafts never auto-publish — they live here until an operator promotes one
// (export its CSS + commit it as a real `[data-theme]` theme). PURE + SSR-safe;
// writes broadcast so the admin library re-renders live.
// ============================================================

import type { ThemeId, ThemeCategory, ThemeSwatches } from '@/lib/theme/themes';
import { THEMES, getTheme } from '@/lib/theme/themes';
import { THEME_LAB_REGISTRY, type ThemeLabEntry } from './registry';

export const THEME_LIBRARY_STORAGE_KEY = 'swingiq-theme-library';
export const THEME_LIBRARY_CHANGE_EVENT = 'swingiq-theme-library-change';

/** Where a catalog entry comes from. */
export type LibrarySource = 'published' | 'draft' | 'generated';
/** Lifecycle of a catalog entry. */
export type LibraryStatus = 'live' | 'draft' | 'retired';

export interface LibraryTheme {
  /** Engine ThemeId for published themes; a generated slug for drafts. */
  id: string;
  name: string;
  source: LibrarySource;
  status: LibraryStatus;
  category: ThemeCategory;
  /** Preview swatches (always present). */
  swatches: ThemeSwatches;
  /** The theme this was derived from (drafts/generated only). */
  baseThemeId?: ThemeId;
  version: number;
  createdAt: string;
  note?: string;
}

function broadcast(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event(THEME_LIBRARY_CHANGE_EVENT));
    } catch {
      /* ignore */
    }
  }
}

/** The locally-stored draft/generated themes (NOT the published ones). */
export function readDrafts(): LibraryTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(THEME_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LibraryTheme[]) : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts: LibraryTheme[]): LibraryTheme[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_LIBRARY_STORAGE_KEY, JSON.stringify(drafts));
      broadcast();
    } catch {
      /* storage unavailable */
    }
  }
  return drafts;
}

/** A published theme (engine registry entry) as a library catalog row. */
export function publishedToLibrary(entry: ThemeLabEntry): LibraryTheme {
  const def = getTheme(entry.themeId);
  return {
    id: entry.themeId,
    name: entry.name,
    source: 'published',
    status: entry.status === 'retired' ? 'retired' : 'live',
    category: def.category,
    swatches: def.swatches,
    version: entry.version,
    createdAt: '',
  };
}

/**
 * The full catalog: every published theme first (engine order), then the local
 * draft/generated candidates. De-duplicated by id (a draft can't shadow a
 * published id).
 */
export function getLibraryCatalog(
  registry: ThemeLabEntry[] = THEME_LAB_REGISTRY,
  drafts: LibraryTheme[] = readDrafts(),
): LibraryTheme[] {
  const published = registry.map(publishedToLibrary);
  const publishedIds = new Set(published.map((t) => t.id));
  const extras = drafts.filter((d) => !publishedIds.has(d.id));
  return [...published, ...extras];
}

/** Create or replace a draft/generated theme by id. */
export function upsertDraft(theme: LibraryTheme): LibraryTheme[] {
  const drafts = readDrafts();
  const idx = drafts.findIndex((d) => d.id === theme.id);
  const next = idx >= 0 ? drafts.map((d) => (d.id === theme.id ? theme : d)) : [...drafts, theme];
  return writeDrafts(next);
}

/** Add several generated drafts at once (skips ids that already exist). */
export function addDrafts(themes: LibraryTheme[]): LibraryTheme[] {
  const drafts = readDrafts();
  const have = new Set(drafts.map((d) => d.id));
  const fresh = themes.filter((t) => !have.has(t.id));
  return writeDrafts([...drafts, ...fresh]);
}

export function removeDraft(id: string): LibraryTheme[] {
  return writeDrafts(readDrafts().filter((d) => d.id !== id));
}

export function setDraftStatus(id: string, status: LibraryStatus): LibraryTheme[] {
  return writeDrafts(readDrafts().map((d) => (d.id === id ? { ...d, status } : d)));
}

/** Catalog roll-up for the admin library header. */
export function libraryStats(catalog: LibraryTheme[] = getLibraryCatalog()) {
  return {
    total: catalog.length,
    live: catalog.filter((t) => t.status === 'live').length,
    draft: catalog.filter((t) => t.status === 'draft').length,
    retired: catalog.filter((t) => t.status === 'retired').length,
    generated: catalog.filter((t) => t.source === 'generated').length,
    published: catalog.filter((t) => t.source === 'published').length,
  };
}

// Re-export for convenience so callers can build published-only catalogs.
export { THEMES };
