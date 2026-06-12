'use client';

// Client island for the Video Library Publishing screen. Rows come from props
// (server-read from the overrides file); each toggle calls the guarded API
// route, which writes the versioned overrides file. Optimistic per-row state
// with an honest read-only path for production.

import { useMemo, useState } from 'react';
import { Globe, Lock, Loader2, Film, FileText } from 'lucide-react';

interface Row {
  id: string;
  title: string;
  category: string;
  sport: string;
  recorded: boolean;
  published: boolean;
  overridden: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'feature-deepdive': 'Feature Deep-Dives',
  'launch-monitor-data': 'Launch Monitor & Data',
  'drills-technique': 'Drills & Technique',
  'coach-parent': 'Coaching & Parent Guides',
  'pro-film-study': 'Pro Swing & Film Study',
};
const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

const SPORT_LABELS: Record<string, string> = {
  all: 'All sports', golf: 'Golf', tennis: 'Tennis', pickleball: 'Pickleball',
  padel: 'Padel', baseball: 'Baseball', softball_slow: 'Softball (slow)', softball_fast: 'Softball (fast)',
};

export function LibraryPublishingClient({
  rows: initialRows,
  writable,
  actor,
}: {
  rows: Row[];
  writable: boolean;
  actor: string;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const publishedCount = rows.filter((r) => r.published).length;

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      items: rows.filter((r) => r.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [rows]);

  // Approve = publish to public /learn; Reject = push back to drafts (in-app only).
  // Both hit the same guarded API with an explicit action, so the result is
  // never ambiguous: the row's state pill and buttons update from the response.
  async function setPublish(row: Row, publish: boolean) {
    if (busy) return;
    if (row.published === publish) return; // already in the target state — no-op
    setError(null);
    setNotice(null);
    setBusy(row.id);
    try {
      const res = await fetch('/api/admin/library-publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id, action: publish ? 'publish' : 'unpublish' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || `Request failed (${res.status}).`);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, published: data.published } : r)));
      setNotice(
        publish
          ? `Approved — published to /learn: “${row.title}”. Commit & push the overrides file to deploy.`
          : `Rejected — moved back to drafts (in-app only): “${row.title}”. Commit & push the overrides file to deploy.`,
      );
    } catch {
      setError('Network error — could not reach the publishing API.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
        <span className="text-foreground">
          <strong className="text-white">{publishedCount}</strong> of {rows.length} videos public on{' '}
          <code className="text-muted-foreground">/learn</code>
        </span>
        <span className="text-xs text-muted-foreground">signed in as {actor}</span>
      </div>

      {!writable && (
        <div className="rounded-lg border border-primary/50 bg-primary/20 px-4 py-3 text-sm text-link">
          View-only here — production runs on a read-only filesystem. Toggle from your local dev
          environment, then commit &amp; push the overrides file.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-error/50 bg-error/20 px-4 py-3 text-sm text-error-text">{error}</div>
      )}
      {notice && (
        <div className="rounded-lg border border-success/50 bg-success/20 px-4 py-3 text-sm text-success-text">{notice}</div>
      )}

      {grouped.map((group) => (
        <section key={group.category}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {group.items.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 bg-card/40 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{row.title}</span>
                    {row.recorded ? (
                      <span title="Has a recorded video" className="text-success-text"><Film size={13} /></span>
                    ) : (
                      <span title="Written walkthrough only (no recording yet)" className="text-muted-foreground"><FileText size={13} /></span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{SPORT_LABELS[row.sport] ?? row.sport}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Current state — rejected/draft rows stay in the list, clearly marked */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      row.published
                        ? 'border-success/50 bg-success/15 text-success-text'
                        : 'border-border bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {row.published ? <><Globe size={11} /> Public</> : <><Lock size={11} /> Draft · in-app only</>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPublish(row, true)}
                    disabled={!writable || busy === row.id || row.published}
                    title="Publish to the public /learn pages"
                    className="inline-flex w-24 items-center justify-center gap-1.5 rounded-md border border-success/60 bg-success/15 px-3 py-1.5 text-xs font-semibold text-success-text transition-colors hover:bg-success/25 disabled:opacity-40"
                  >
                    {busy === row.id && !row.published ? <Loader2 size={13} className="animate-spin" /> : <><Globe size={13} /> Approve</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublish(row, false)}
                    disabled={!writable || busy === row.id || !row.published}
                    title="Push back to drafts (in-app only — removed from /learn)"
                    className="inline-flex w-24 items-center justify-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40"
                  >
                    {busy === row.id && row.published ? <Loader2 size={13} className="animate-spin" /> : <><Lock size={13} /> Reject</>}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
