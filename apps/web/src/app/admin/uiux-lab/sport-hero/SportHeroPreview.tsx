'use client';

// ============================================================
// Sport Hero Preview — switch sport · variant · motif live.
// Nothing here ships to users; it's the owner's pick-the-look
// surface for the reusable <SportHero> before it's adopted on
// any public page. (Admin-only, noindex via /admin layout.)
// ============================================================

import { useState } from 'react';
import type { SportId } from '@swingiq/core';
import { SportHero, type SportHeroVariant } from '@/components/sport/SportHero';
import { SPORT_BRANDS } from '@/lib/sport-brand/registry';

const SPORTS = Object.keys(SPORT_BRANDS) as SportId[];
const VARIANTS: SportHeroVariant[] = ['spotlight', 'split', 'minimal'];

const SAMPLE: Record<SportId, { title: string; subtitle: string }> = {
  golf: { title: 'See exactly why your ball flies the way it does', subtitle: 'Upload a swing or your launch-monitor data — get club path, face angle, and the one change that matters most.' },
  tennis: { title: 'Sharpen every stroke, phase by phase', subtitle: 'Forehand, backhand, and serve mechanics broken down into the cues that actually move the needle.' },
  pickleball: { title: 'Win the kitchen with cleaner mechanics', subtitle: 'Dinks, third-shot drops, drives, resets, and volleys — analyzed and coached for compact paddle play.' },
  padel: { title: 'Read the glass, hold the net', subtitle: 'Bandeja, víbora, volleys, lobs, and wall play, broken down phase by phase.' },
  baseball: { title: 'Build a swing that repeats', subtitle: 'Load through extension and follow-through — see what changes and what to drill next.' },
  softball_slow: { title: 'Drive line-drive contact', subtitle: 'Arc timing, bat path, and directional hitting tuned for the slow-pitch swing.' },
  softball_fast: { title: 'Quicken your launch', subtitle: 'Compact swing, timing, and pitch-speed adaptation for fast-pitch hitters.' },
};

const SAMPLE_STATS = [
  { label: 'Analyzed', value: '12 swings' },
  { label: 'Top fix', value: 'Path +4°' },
  { label: 'Score', value: '78' },
];

const segBtn = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted border border-border'
  }`;

export function SportHeroPreview() {
  const [sport, setSport] = useState<SportId>('golf');
  const [variant, setVariant] = useState<SportHeroVariant>('spotlight');
  const [motif, setMotif] = useState(true);
  const [withStats, setWithStats] = useState(true);

  const sample = SAMPLE[sport];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sport</span>
          {SPORTS.map((s) => (
            <button key={s} type="button" onClick={() => setSport(s)} className={segBtn(s === sport)}>
              {SPORT_BRANDS[s].emoji} {SPORT_BRANDS[s].name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variant</span>
          {VARIANTS.map((v) => (
            <button key={v} type="button" onClick={() => setVariant(v)} className={segBtn(v === variant)}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Options</span>
          <button type="button" onClick={() => setMotif((m) => !m)} className={segBtn(motif)}>
            Motif {motif ? 'on' : 'off'}
          </button>
          <button type="button" onClick={() => setWithStats((s) => !s)} className={segBtn(withStats)}>
            Stats {withStats ? 'on' : 'off'}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <SportHero
          sport={sport}
          variant={variant}
          title={sample.title}
          subtitle={sample.subtitle}
          primaryCta={{ label: 'Analyze my swing', href: '/upload' }}
          secondaryCta={{ label: 'See how it works', href: '/how-it-works' }}
          stats={withStats ? SAMPLE_STATS : undefined}
          motif={motif}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Preview only — nothing here publishes. Pick a variant per page, then adopt{' '}
        <code className="rounded bg-muted px-1 py-0.5">&lt;SportHero&gt;</code> on the target route.
      </p>
    </div>
  );
}
