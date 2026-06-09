// ============================================================
// SwingVantage Admin — Video Library publishing store (SERVER-ONLY)
// ------------------------------------------------------------
// Controls which training videos appear on the PUBLIC /learn pages (the
// SEO/AEO/GEO surface). The in-app /library always shows every video; this
// only gates public exposure, so new videos roll out to search deliberately.
//
// Publish state lives in a committed OVERRIDES file:
//   • src/data/library-publish-overrides.json   (video id → public boolean)
// We only store an override when it DIFFERS from the seed's default `public`,
// so the file stays a minimal, readable git diff. getTrainingItems() reads the
// same file (static import) for the actual gating.
//
// Same honesty model as updates-store: /learn is statically generated, so a
// toggle writes the versioned file (a git diff you commit & push) and takes
// effect on the next build/deploy. Production's runtime FS is read-only, so
// there it's view-only. NEVER import this from a client component (node:fs).
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { getTrainingItems, trainingPublishDefault } from '@/lib/library/training-videos';
import { canWriteUpdates } from './updates-store';

const OVERRIDES_FILE = 'library-publish-overrides.json';

/** A single training video, flattened for the publishing table. */
export interface LibraryPublishRow {
  id: string;
  title: string;
  category: string;
  sport: string;
  /** A real recording exists (vs. written walkthrough only). */
  recorded: boolean;
  /** Currently listed on the public /learn pages. */
  published: boolean;
  /** True when published differs from the seed default (an explicit override). */
  overridden: boolean;
}

export interface LibraryPublishSnapshot {
  rows: LibraryPublishRow[];
  /** Whether this environment can persist toggles (local dev, writable FS). */
  writable: boolean;
}

/** Resolve a data file whether cwd is apps/web (turbo) or the repo root. */
function resolveDataFile(name: string): string {
  const candidates = [
    path.join(process.cwd(), 'src', 'data', name),
    path.join(process.cwd(), 'apps', 'web', 'src', 'data', name),
  ];
  return candidates.find((c) => existsSync(c)) ?? candidates[0];
}

/** Read every training video + its effective publish state for the admin table. */
export function readLibraryPublishSnapshot(): LibraryPublishSnapshot {
  const rows = getTrainingItems()
    .map((v): LibraryPublishRow => ({
      id: v.id,
      title: v.title,
      category: v.category,
      sport: v.sport,
      recorded: v.hasRecording,
      published: v.public,
      overridden: v.public !== trainingPublishDefault(v.id),
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  return { rows, writable: canWriteUpdates() };
}

export type SetLibraryPublishResult =
  | { ok: true; published: boolean }
  | { ok: false; reason: 'read-only' | 'not-found' | 'corrupt' | 'io-error' };

/**
 * Flip a single training video's public state, persisting to the overrides
 * file. Stores an override only when it deviates from the seed default; when a
 * toggle returns the video to its default the override key is removed, keeping
 * the committed file minimal. Idempotent and surgical.
 */
export function setLibraryPublishState(id: string, publish: boolean): SetLibraryPublishResult {
  if (!canWriteUpdates()) return { ok: false, reason: 'read-only' };

  // Reject unknown ids so the file can never accumulate dead keys.
  const known = getTrainingItems().some((v) => v.id === id);
  if (!known) return { ok: false, reason: 'not-found' };

  const file = resolveDataFile(OVERRIDES_FILE);
  let overrides: Record<string, boolean>;
  try {
    const raw = readFileSync(file, 'utf8').trim();
    overrides = raw ? JSON.parse(raw) : {};
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      return { ok: false, reason: 'corrupt' };
    }
  } catch {
    return { ok: false, reason: 'io-error' };
  }

  if (publish === trainingPublishDefault(id)) {
    delete overrides[id]; // back to default → no override needed
  } else {
    overrides[id] = publish;
  }

  // Stable key order keeps diffs clean regardless of toggle sequence.
  const sorted = Object.fromEntries(Object.keys(overrides).sort().map((k) => [k, overrides[k]]));
  try {
    writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
  } catch {
    return { ok: false, reason: 'io-error' };
  }
  return { ok: true, published: publish };
}
