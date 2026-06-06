'use client';

// ============================================================
// SwingVantage — Video Library: Browser (the /library hub)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The home for every video: a searchable, filterable hub with a rail
//   per category — Feature Walkthroughs (every feature) plus the training
//   tracks you grow over time (deep-dives, launch-monitor & data, drills,
//   coaching/parent, pro film study). Empty training rails show a friendly
//   "coming soon" home so there's always a clear place for new content.
//
//   Cards open an accessible player modal. Videos without a recording yet
//   still open — to their written walkthrough — so nothing is a dead end.
// ============================================================

import { useMemo, useState } from 'react';
import {
  Search,
  Film,
  PlayCircle,
  Layers,
  Gauge,
  Dumbbell,
  Users,
  Clapperboard,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  searchLibrary,
  getLibrarySections,
  LIBRARY_CATEGORIES,
  SPORT_LABELS,
  type LibraryItem,
  type LibraryCategory,
  type LibrarySport,
  type LibraryStats,
} from '@/lib/library';
import { LibraryPlayerModal } from './LibraryPlayerModal';

const ICONS: Record<string, typeof PlayCircle> = {
  PlayCircle,
  Layers,
  Gauge,
  Dumbbell,
  Users,
  Clapperboard,
};

const SPORTS: LibrarySport[] = ['all', 'golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast'];

export function LibraryBrowser({ items, stats }: { items: LibraryItem[]; stats: LibraryStats }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LibraryCategory | 'all'>('all');
  const [sport, setSport] = useState<LibrarySport>('all');
  const [active, setActive] = useState<LibraryItem | null>(null);

  const filtered = useMemo(
    () => searchLibrary(items, { query, category, sport }),
    [items, query, category, sport],
  );

  const isFiltering = Boolean(query.trim()) || category !== 'all' || sport !== 'all';
  const sections = useMemo(() => getLibrarySections(filtered), [filtered]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Film size={20} aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wide">Video Library</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Learn SwingVantage on video</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Short, guided walkthroughs for every feature — plus deeper training videos on drills, your
          launch monitor, coaching, and film study. {stats.recorded} of {stats.total} ready to watch.
        </p>
      </header>

      {/* Controls */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos (e.g. swing path, launch monitor, drills)…"
            aria-label="Search the video library"
            className="w-full rounded-theme border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip label="All" active={category === 'all'} onClick={() => setCategory('all')} />
          {LIBRARY_CATEGORIES.map((c) => (
            <CategoryChip key={c.id} label={c.label} active={category === c.id} onClick={() => setCategory(c.id)} />
          ))}
          <div className="ml-auto">
            <label className="sr-only" htmlFor="sport-filter">
              Filter by sport
            </label>
            <select
              id="sport-filter"
              value={sport}
              onChange={(e) => setSport(e.target.value as LibrarySport)}
              className="rounded-theme border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {SPORT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sections */}
      {filtered.length === 0 ? (
        <div className="rounded-theme border border-border bg-card p-10 text-center">
          <p className="text-sm font-semibold text-foreground">No videos match that search.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different term or clear the filters.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map((section) => {
            // Hide empty rails while actively filtering; otherwise keep training
            // rails visible as a "coming soon" home for future content.
            if (section.items.length === 0) {
              if (isFiltering || section.group !== 'training') return null;
              return <EmptyRail key={section.category} label={section.label} blurb={section.blurb} icon={section.icon} />;
            }
            const Icon = ICONS[section.icon] ?? PlayCircle;
            return (
              <section key={section.category} aria-label={section.label}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon size={18} className="text-primary" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-foreground">{section.label}</h2>
                  <span className="text-xs text-muted-foreground">· {section.items.length}</span>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{section.blurb}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <VideoCard key={`${item.source}:${item.id}`} item={item} onOpen={() => setActive(item)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {active && <LibraryPlayerModal item={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function VideoCard({ item, onOpen }: { item: LibraryItem; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group overflow-hidden rounded-theme border border-border bg-card text-left transition-shadow hover:shadow-theme focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-secondary">
        {item.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent-secondary/10">
            <Film size={28} className="text-primary/60" aria-hidden="true" />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 backdrop-blur transition-transform group-hover:scale-105">
            <PlayCircle size={26} className="text-white" aria-hidden="true" />
          </span>
        </span>
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">
          <Clock size={10} aria-hidden="true" /> {item.durationLabel}
        </span>
        {!item.hasRecording && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Sparkles size={10} aria-hidden="true" /> Coming soon
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-bold text-foreground">{item.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        {item.sport !== 'all' && (
          <span className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {SPORT_LABELS[item.sport]}
          </span>
        )}
      </div>
    </button>
  );
}

function EmptyRail({ label, blurb, icon }: { label: string; blurb: string; icon: string }) {
  const Icon = ICONS[icon] ?? PlayCircle;
  return (
    <section aria-label={label}>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} className="text-muted-foreground" aria-hidden="true" />
        <h2 className="text-lg font-bold text-foreground">{label}</h2>
      </div>
      <div className="rounded-theme border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{blurb}</p>
        <p className="mt-1 text-xs text-muted-foreground/80">New videos land here as they’re produced.</p>
      </div>
    </section>
  );
}
