'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { devUpdatePath } from '@/lib/updates/dev-detail';
import type {
  DevUpdate,
  DevUpdateCategory,
  DevUpdateImpact,
  DevStat,
} from '@/data/devUpdates';

// ── Category → badge variant ──────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const CATEGORY_VARIANT: Record<DevUpdateCategory, BadgeVariant> = {
  'AI & Vision': 'info',
  'Motion Intelligence': 'success',
  Architecture: 'warning',
  Platform: 'success',
  Performance: 'info',
  'Design System': 'warning',
  'Security & Privacy': 'danger',
  'Developer Experience': 'default',
};

const IMPACT_LABEL: Record<DevUpdateImpact, string> = {
  major: 'Major',
  notable: 'Notable',
  foundational: 'Foundational',
};

// ── Stats band ──────────────────────────────────────────────────────────────

function StatsBand({ stats }: { stats: DevStat[] }) {
  return (
    <section className="border-b border-border bg-muted px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-sm font-bold uppercase tracking-wide text-primary">
          By the numbers
        </h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-foreground sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{s.label}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Milestone timeline ──────────────────────────────────────────────────────

function MilestoneTimeline({ milestones }: { milestones: DevUpdate[] }) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 hidden w-px bg-primary/30 sm:block" aria-hidden="true" />
      <ol className="space-y-6">
        {milestones.map((m, i) => (
          <li key={m.id} className="flex gap-4 sm:gap-6">
            <div
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-xs"
              aria-hidden="true"
            >
              {i + 1}
            </div>
            <div className="min-w-0 pt-1">
              <time className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {m.displayDate}
              </time>
              <h3 className="mt-0.5 text-base font-semibold text-foreground">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.headline}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Update card ───────────────────────────────────────────────────────────

function DevUpdateCard({ update }: { update: DevUpdate }) {
  const variant = CATEGORY_VARIANT[update.category];

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-card shadow-xs',
        update.impact === 'major' ? 'border-l-4 border-l-primary border-border' : 'border-border',
      )}
      aria-label={update.title}
    >
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={variant}>{update.category}</Badge>
          <Badge
            variant="default"
            className={cn(
              update.impact === 'major' && 'bg-primary/10 text-primary',
            )}
          >
            {IMPACT_LABEL[update.impact]}
          </Badge>
          {update.version && (
            <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {update.version}
            </span>
          )}
          <time
            dateTime={update.date}
            className="ml-auto whitespace-nowrap text-xs text-muted-foreground"
          >
            {update.displayDate}
          </time>
        </div>

        <h3 className="mb-2 text-base font-bold leading-snug text-foreground sm:text-lg">
          <Link href={devUpdatePath(update)} className="hover:text-primary transition-colors">
            {update.title}
          </Link>
        </h3>

        <p className="mb-3 text-sm font-medium text-foreground">{update.headline}</p>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{update.details}</p>

        {update.highlights && update.highlights.length > 0 && (
          <ul className="mb-4 space-y-1.5">
            {update.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-foreground">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Read full developer report → dedicated page */}
        <div className="mt-4 border-t border-border pt-3">
          <Link
            href={devUpdatePath(update)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            aria-label={`Read the full developer report: ${update.title}`}
          >
            Read full developer report →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── Main content ────────────────────────────────────────────────────────────

interface DevUpdatesContentProps {
  updates: DevUpdate[];
  milestones: DevUpdate[];
  stats: DevStat[];
}

export function DevUpdatesContent({ updates, milestones, stats }: DevUpdatesContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<DevUpdateCategory | 'all'>('all');

  const categories = useMemo<Array<DevUpdateCategory | 'all'>>(() => {
    const cats = new Set<DevUpdateCategory>();
    updates.forEach((u) => cats.add(u.category));
    return ['all', ...Array.from(cats).sort()];
  }, [updates]);

  const filtered = useMemo(
    () =>
      selectedCategory === 'all'
        ? updates
        : updates.filter((u) => u.category === selectedCategory),
    [updates, selectedCategory],
  );

  return (
    <>
      <StatsBand stats={stats} />

      {/* Milestone timeline */}
      {milestones.length > 0 && (
        <section className="border-b border-border bg-card px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Engineering milestones</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The foundations the rest of the product is built on — oldest to newest.
              </p>
            </div>
            <MilestoneTimeline milestones={milestones} />
          </div>
        </section>
      )}

      {/* All updates */}
      <section className="px-4 py-14" id="all-dev-updates">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">All developer updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Newest first. The technical story behind the changelog.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedCategory === cat
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary',
                )}
                aria-pressed={selectedCategory === cat}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:gap-6">
            {filtered.map((update) => (
              <DevUpdateCard key={update.id} update={update} />
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {updates.length} developer update
            {updates.length !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* Note */}
      <section className="border-y border-warning/30 bg-warning/10 px-4 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-warning">
            <strong>This is the engineering log.</strong> For the plain-English, athlete-facing version of
            what shipped, see the{' '}
            <Link href="/updates" className="underline">
              product updates page
            </Link>
            . Movement findings are directional reads from video, sharpened by every swing you add — not
            measured lab biomechanics.
          </p>
        </div>
      </section>
    </>
  );
}
