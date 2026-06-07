// ============================================================
// Link Intelligence Agent — deterministic IDs
// ------------------------------------------------------------
// Records use STABLE ids derived from their content so re-running the agent
// UPSERTS the same logical item (the repository upserts by id) instead of
// creating duplicates every run. Pure, dependency-free.
// ============================================================

/** Lowercase, hyphenated, path-safe slug of arbitrary text (bounded length). */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'x';
}

/** Build a stable id from a prefix + parts. */
export function id(prefix: string, ...parts: string[]): string {
  return `${prefix}-${parts.map(slug).join('--')}`;
}
