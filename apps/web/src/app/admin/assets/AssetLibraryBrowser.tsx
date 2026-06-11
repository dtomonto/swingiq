'use client';

// Client island for the Digital Asset Library: source filter + search over the
// server-built catalog, rendered as a preview grid. Pure presentation — data
// comes from props (no server imports pulled into the bundle).

import { useMemo, useState } from 'react';
import { Search, Film, Image as ImageIcon, Captions, Globe, Lock, Clapperboard } from 'lucide-react';

type AssetSource = 'training-video' | 'feature-walkthrough' | 'video-studio';
type AssetFileKind = 'mp4' | 'poster' | 'captions';

interface AssetFile {
  kind: AssetFileKind;
  path: string;
}
interface AssetRecord {
  id: string;
  title: string;
  description?: string;
  source: AssetSource;
  sourceLabel: string;
  poster?: string;
  durationSec?: number;
  durationLabel?: string;
  files: AssetFile[];
  recorded: boolean;
  public: boolean;
  placeholder?: boolean;
  category?: string;
  usedOn?: string;
}
interface Stats {
  total: number;
  bySource: Record<AssetSource, number>;
  recorded: number;
  publicCount: number;
  totalDurationSec: number;
  fileCount: number;
}

const SOURCE_LABELS: Record<AssetSource, string> = {
  'training-video': 'Training videos',
  'feature-walkthrough': 'Feature walkthroughs',
  'video-studio': 'Video Studio',
};

const FILE_ICON: Record<AssetFileKind, typeof Film> = {
  mp4: Film,
  poster: ImageIcon,
  captions: Captions,
};

function fmtTotalDuration(sec: number): string {
  const m = Math.round(sec / 60);
  return m >= 1 ? `${m} min of footage` : `${Math.round(sec)}s of footage`;
}

export function AssetLibraryBrowser({ records, stats }: { records: AssetRecord[]; stats: Stats }) {
  const [source, setSource] = useState<AssetSource | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (source !== 'all' && r.source !== source) return false;
      if (q && !`${r.title} ${r.description ?? ''} ${r.category ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [records, source, query]);

  const tabs: { id: AssetSource | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'training-video', label: SOURCE_LABELS['training-video'], count: stats.bySource['training-video'] },
    { id: 'feature-walkthrough', label: SOURCE_LABELS['feature-walkthrough'], count: stats.bySource['feature-walkthrough'] },
    { id: 'video-studio', label: SOURCE_LABELS['video-studio'], count: stats.bySource['video-studio'] },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Assets" value={stats.total} />
        <Stat label="Files" value={stats.fileCount} />
        <Stat label="Public" value={stats.publicCount} />
        <Stat label="Footage" value={fmtTotalDuration(stats.totalDurationSec)} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSource(t.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                source === t.id
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border bg-muted/40 text-foreground hover:bg-muted'
              }`}
            >
              {t.label} <span className="text-muted-foreground">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets…"
            className="w-full rounded-lg border border-border bg-card/60 py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-card/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No assets match.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <li key={`${r.source}:${r.id}`} className="overflow-hidden rounded-xl border border-border bg-card/40">
              {/* Preview */}
              <div className="relative aspect-video w-full bg-muted">
                {r.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.poster} alt={`${r.title} preview`} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/70">
                    <Clapperboard className="h-7 w-7" />
                  </div>
                )}
                {r.durationLabel && (
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {r.durationLabel}
                  </span>
                )}
                <span className="absolute left-1.5 top-1.5 rounded bg-foreground/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                  {r.sourceLabel}
                </span>
              </div>
              {/* Body */}
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-foreground" title={r.title}>{r.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 ${r.public ? 'bg-success/15 text-success-text' : 'bg-muted/50 text-muted-foreground'}`}>
                    {r.public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {r.public ? 'Public' : 'Internal'}
                  </span>
                  {r.placeholder && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-link">Placeholder</span>}
                  {r.usedOn && <span className="truncate text-muted-foreground">· {r.usedOn}</span>}
                </div>
                {/* Files */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.files.map((f) => {
                    const Icon = FILE_ICON[f.kind];
                    return (
                      <a
                        key={f.kind}
                        href={f.path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] text-foreground hover:bg-muted"
                        title={`Open ${f.kind} — ${f.path}`}
                      >
                        <Icon className="h-3 w-3" /> {f.kind}
                      </a>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
