'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowLeft, ExternalLink, Target, ListChecks, Lightbulb, Sparkles,
  Clock, Dumbbell, Gauge, Layers, AlertTriangle, Play, Wind,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import {
  ALL_SPORTS_INCLUDING_GOLF,
} from '@swingiq/core';
import { getDrillBySlug, getRelatedDrills } from '@/lib/drills/catalog';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-primary/15 text-primary',
  intermediate: 'bg-accent-secondary/15 text-accent-secondary',
  advanced: 'bg-accent-secondary/15 text-accent-secondary',
};

function sportMeta(id: string) {
  const s = ALL_SPORTS_INCLUDING_GOLF.find((x) => x.id === id);
  return { emoji: s?.emoji ?? '🏌️', name: s?.short_name ?? id };
}

export default function DrillDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const drill = useMemo(() => getDrillBySlug(slug), [slug]);
  const related = useMemo(() => (drill ? getRelatedDrills(drill, 3) : []), [drill]);

  if (!drill) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link href="/drills" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> Back to Drill Library
        </Link>
        <EmptyState
          icon={Dumbbell}
          title="Drill not found"
          description="This drill may have been renamed or removed. Browse the full library to find what you need."
        />
      </div>
    );
  }

  const sport = sportMeta(drill.sport);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/drills" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft size={14} /> Back to Drill Library
      </Link>

      {/* Hero */}
      <header className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-2xl">{sport.emoji}</span>
          <span className="text-sm text-muted-foreground">{sport.name}</span>
          {drill.category && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-sm text-muted-foreground">{drill.category}</span>
            </>
          )}
          <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full font-medium capitalize', DIFFICULTY_COLORS[drill.difficulty])}>
            {drill.difficulty}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{drill.name}</h1>
        <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">{drill.description}</p>
      </header>

      {/* Quick facts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Fact icon={Clock} label="Volume" value={drill.repsOrDuration} />
        <Fact icon={Gauge} label="Level" value={drill.difficulty} className="capitalize" />
        <Fact icon={Dumbbell} label="Equipment" value={drill.equipment || 'None'} />
        <Fact icon={Layers} label="Phase" value={drill.phase ?? '—'} />
      </div>

      {/* What it fixes */}
      {drill.targetFault && (
        <Card className="mb-5 border-primary/30 bg-primary/5">
          <CardBody className="flex items-start gap-3">
            <Target size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-0.5">What this fixes</p>
              <p className="text-sm text-foreground">{drill.targetFault}</p>
              <p className="text-sm text-muted-foreground mt-1">{drill.goal}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Safety note */}
      {drill.safetyNote && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning">{drill.safetyNote}</p>
        </div>
      )}

      {/* Steps */}
      {drill.steps.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
            <ListChecks size={18} className="text-primary" /> How to do it
          </h2>
          <ol className="space-y-2.5">
            {drill.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Focus feel */}
      {drill.focusFeel && (
        <Card className="mb-6 border-accent-secondary/30 bg-accent-secondary/5">
          <CardBody className="flex items-start gap-3">
            <Wind size={18} className="text-accent-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-secondary mb-0.5">What it should feel like</p>
              <p className="text-sm text-foreground italic">{drill.focusFeel}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tips */}
      {drill.tips.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
            <Lightbulb size={18} className="text-primary" /> Coaching tips
          </h2>
          <ul className="space-y-2">
            {drill.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-foreground">
                <Sparkles size={15} className="text-primary/70 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Watch it + coach hint */}
      <section className="mb-8 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground text-sm">See it in action</p>
            {drill.coachChannelHint ? (
              <p className="text-xs text-muted-foreground mt-0.5">Suggested coaches: {drill.coachChannelHint}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Watch a demonstration before your first reps.</p>
            )}
          </div>
          <a
            href={drill.youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            <Play size={15} /> Find on YouTube <ExternalLink size={12} />
          </a>
        </div>
      </section>

      {/* Related drills */}
      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">More {sport.name} drills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/drills/${r.slug}`}
                className="block rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-md transition"
              >
                <p className="font-semibold text-sm text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.goal}</p>
                <span className={cn('inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full font-medium capitalize', DIFFICULTY_COLORS[r.difficulty])}>
                  {r.difficulty}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({ icon: Icon, label, value, className }: { icon: typeof Clock; label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon size={13} /> {label}
      </div>
      <p className={cn('text-sm font-semibold text-foreground', className)}>{value}</p>
    </div>
  );
}
