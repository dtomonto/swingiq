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

  async function toggle(row: Row) {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(row.id);
    const next = !row.published;
    try {
      const res = await fetch('/api/admin/library-publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id, action: next ? 'publish' : 'unpublish' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || `Request failed (${res.status}).`);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, published: data.published } : r)));
      setNotice(
        `${next ? 'Published to' : 'Removed from'} /learn: “${row.title}”. Commit & push the overrides file to deploy.`,
      );
    } catch {
      setError('Network error — could not reach the publishing API.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm">
        <span className="text-gray-300">
          <strong className="text-white">{publishedCount}</strong> of {rows.length} videos public on{' '}
          <code className="text-gray-400">/learn</code>
        </span>
        <span className="text-xs text-gray-500">signed in as {actor}</span>
      </div>

      {!writable && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          View-only here — production runs on a read-only filesystem. Toggle from your local dev
          environment, then commit &amp; push the overrides file.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">{notice}</div>
      )}

      {grouped.map((group) => (
        <section key={group.category}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{group.label}</h2>
          <ul className="divide-y divide-gray-800 overflow-hidden rounded-lg border border-gray-800">
            {group.items.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 bg-gray-900/40 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-100">{row.title}</span>
                    {row.recorded ? (
                      <span title="Has a recorded video" className="text-emerald-400"><Film size={13} /></span>
                    ) : (
                      <span title="Written walkthrough only (no recording yet)" className="text-gray-500"><FileText size={13} /></span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{SPORT_LABELS[row.sport] ?? row.sport}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(row)}
                  disabled={!writable || busy === row.id}
                  aria-pressed={row.published}
                  className={`inline-flex w-32 shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    row.published
                      ? 'border-emerald-600/60 bg-emerald-600/15 text-emerald-300 hover:bg-emerald-600/25'
                      : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:bg-gray-700/60'
                  }`}
                >
                  {busy === row.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : row.published ? (
                    <><Globe size={13} /> Public</>
                  ) : (
                    <><Lock size={13} /> In-app only</>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
