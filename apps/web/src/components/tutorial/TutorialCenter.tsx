'use client';

// ============================================================
// SwingVantage — Tutorial Center
// ------------------------------------------------------------
// The /tutorial hub. Two ways in:
//   1) A persona track — the right ordered tutorial for a Player,
//      Parent, Coach, or Team. ("A form of the tutorial for each
//      kind of user.")
//   2) The full library — one short video per feature, browsable
//      by category.
// Includes a clear "skip the tutorial" option that's remembered,
// and watched-progress that persists with the rest of the app.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ListChecks,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialVideoPlayer } from './TutorialVideoPlayer';
import {
  type TutorialVideo,
  type TutorialAudience,
  type TutorialCategory,
  AUDIENCE_ORDER,
  AUDIENCES,
  CATEGORIES,
  TUTORIAL_TRACKS,
  getTrackVideos,
  getVideosByCategory,
  totalDurationLabel,
} from '@/lib/tutorial/videos';

interface ActivePlayer {
  playlist: TutorialVideo[];
  index: number;
}

export function TutorialCenter() {
  const {
    isVideoWatched,
    markVideoWatched,
    unmarkVideoWatched,
    skippedTour,
    setSkippedTour,
    preferredAudience,
    setPreferredAudience,
  } = useTutorial();

  // Persisted state hydrates client-side; gate the dynamic UI on mount
  // so the server and first client render agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [audience, setAudience] = useState<TutorialAudience>('athlete');
  const [categoryFilter, setCategoryFilter] = useState<TutorialCategory | 'all'>('all');
  const [player, setPlayer] = useState<ActivePlayer | null>(null);

  // Adopt the remembered persona once state has hydrated.
  useEffect(() => {
    if (mounted && preferredAudience) setAudience(preferredAudience);
  }, [mounted, preferredAudience]);

  const trackVideos = useMemo(() => getTrackVideos(audience), [audience]);
  const watchedInTrack = mounted ? trackVideos.filter((v) => isVideoWatched(v.id)).length : 0;
  const track = TUTORIAL_TRACKS[audience];

  const categoryGroups = useMemo(() => getVideosByCategory(), []);
  const visibleGroups =
    categoryFilter === 'all'
      ? categoryGroups
      : categoryGroups.filter((g) => g.category === categoryFilter);

  function choosePersona(next: TutorialAudience) {
    setAudience(next);
    setPreferredAudience(next);
  }

  function startTrack() {
    if (trackVideos.length === 0) return;
    const firstUnwatched = trackVideos.findIndex((v) => !isVideoWatched(v.id));
    setPlayer({ playlist: trackVideos, index: firstUnwatched >= 0 ? firstUnwatched : 0 });
  }

  function toggleWatched(video: TutorialVideo) {
    if (isVideoWatched(video.id)) unmarkVideoWatched(video.id);
    else markVideoWatched(video.id);
  }

  const trackComplete = mounted && trackVideos.length > 0 && watchedInTrack === trackVideos.length;
  const trackProgressPct = trackVideos.length ? Math.round((watchedInTrack / trackVideos.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* ── Header ── */}
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap size={22} aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-wide">Tutorials</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          Learn SwingVantage in short videos
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          One quick video for every feature, plus a guided path made for you. Watch in any order, or
          follow your track top to bottom. The written steps under each video work even before the
          recording is up.
        </p>

        {/* Skip control */}
        {mounted && (
          <div className="mt-3">
            {skippedTour ? (
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                You chose to skip the guided tour. You can still watch any video here anytime.
                <button
                  onClick={() => setSkippedTour(false)}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <RotateCcw size={12} aria-hidden="true" /> Undo
                </button>
              </p>
            ) : (
              <button
                onClick={() => setSkippedTour(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <X size={13} aria-hidden="true" />
                Prefer to explore on your own? Skip the tutorial
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Persona picker ── */}
      <section aria-labelledby="persona-heading" className="mb-6">
        <h2 id="persona-heading" className="mb-2 text-sm font-semibold text-foreground">
          Who are you here as?
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AUDIENCE_ORDER.map((id) => {
            const meta = AUDIENCES[id];
            const selected = audience === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => choosePersona(id)}
                aria-pressed={selected}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40 hover:bg-muted',
                )}
              >
                <span className="text-lg" aria-hidden="true">{meta.emoji}</span>
                <span className={cn('text-sm font-bold', selected ? 'text-primary' : 'text-foreground')}>
                  {meta.label}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground">{meta.blurb}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── The selected track ── */}
      <section aria-labelledby="track-heading" className="mb-10 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="track-heading" className="text-lg font-bold text-foreground">
              Your {track.label} tutorial
            </h2>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{track.blurb}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Clock size={12} aria-hidden="true" />
            {trackVideos.length} videos · {totalDurationLabel(trackVideos)}
          </span>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{mounted ? `${watchedInTrack} of ${trackVideos.length} watched` : `${trackVideos.length} videos`}</span>
            {trackComplete && (
              <span className="inline-flex items-center gap-1 text-primary">
                <CheckCircle2 size={13} aria-hidden="true" /> Complete
              </span>
            )}
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${trackProgressPct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={startTrack}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary"
        >
          <PlayCircle size={18} aria-hidden="true" />
          {watchedInTrack > 0 && !trackComplete ? 'Resume tutorial' : trackComplete ? 'Watch again' : 'Start tutorial'}
        </button>

        {/* Ordered video list */}
        <ol className="mt-5 space-y-1.5">
          {trackVideos.map((video, i) => {
            const watched = mounted && isVideoWatched(video.id);
            return (
              <li key={video.id}>
                <button
                  onClick={() => setPlayer({ playlist: trackVideos, index: i })}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted"
                >
                  <span className="shrink-0">
                    {watched ? (
                      <CheckCircle2 size={20} className="text-primary" aria-hidden="true" />
                    ) : (
                      <Circle size={20} className="text-muted-foreground/50" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {i + 1}. {video.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{video.description}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{video.duration}</span>
                  <PlayCircle size={18} className="shrink-0 text-primary" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Full library ── */}
      <section aria-labelledby="library-heading">
        <div className="mb-3 flex items-center gap-2">
          <ListChecks size={18} className="text-primary" aria-hidden="true" />
          <h2 id="library-heading" className="text-lg font-bold text-foreground">
            Browse every feature
          </h2>
        </div>

        {/* Category filter */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
            All
          </FilterChip>
          {categoryGroups.map((g) => (
            <FilterChip
              key={g.category}
              active={categoryFilter === g.category}
              onClick={() => setCategoryFilter(g.category)}
            >
              {CATEGORIES[g.category].label}
            </FilterChip>
          ))}
        </div>

        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-bold text-foreground">{CATEGORIES[group.category].label}</h3>
              <p className="mb-3 text-xs text-muted-foreground">{CATEGORIES[group.category].blurb}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.videos.map((video, i) => (
                  <LibraryCard
                    key={video.id}
                    video={video}
                    watched={mounted && isVideoWatched(video.id)}
                    onOpen={() => setPlayer({ playlist: group.videos, index: i })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Looking for help on a specific screen? Every page has a{' '}
        <span className="font-semibold text-foreground">“?” Guide</span> button that explains exactly
        what you&apos;re looking at. Or head back to your{' '}
        <Link href="/dashboard" className="font-semibold text-primary hover:underline">dashboard</Link>.
      </p>

      {/* ── Player modal ── */}
      {player && (
        <TutorialVideoPlayer
          playlist={player.playlist}
          index={player.index}
          watched={isVideoWatched(player.playlist[player.index].id)}
          onClose={() => setPlayer(null)}
          onNavigate={(nextIndex) => setPlayer((p) => (p ? { ...p, index: nextIndex } : p))}
          onToggleWatched={toggleWatched}
        />
      )}
    </div>
  );
}

// ── Small building blocks ──────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function LibraryCard({
  video,
  watched,
  onOpen,
}: {
  video: TutorialVideo;
  watched: boolean;
  onOpen: () => void;
}) {
  const audienceLabels =
    video.audiences === 'all'
      ? ['Everyone']
      : video.audiences.map((a) => AUDIENCES[a].label);

  return (
    <button
      onClick={onOpen}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-primary">
          <PlayCircle size={18} aria-hidden="true" />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{video.duration}</span>
        </div>
        {watched && <CheckCircle2 size={16} className="text-primary" aria-hidden="true" />}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{video.title}</p>
      <p className="mt-0.5 line-clamp-2 flex-1 text-xs text-muted-foreground">{video.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {audienceLabels.map((label) => (
          <span
            key={label}
            className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Watch <ArrowRight size={11} aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}
