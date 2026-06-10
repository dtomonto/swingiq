'use client';

// ============================================================
// SwingVantage — Athlete Timeline (Phase 5)
// ------------------------------------------------------------
// One chronological view of everything in the athlete record:
// imported/logged sessions, the issues found in them, video
// analyses, daily notes, equipment changes, and setup. Filterable
// by type + sport. This is the human-facing surface of the same
// longitudinal record the AI reasons over (lib/timeline/build).
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Video, NotebookPen, Target, Package, Compass, Clock, CloudCheck, Smartphone,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSwingVantageStore } from '@/store';
import { useAuth } from '@/lib/auth/useAuth';
import { buildTimeline, summarizeTimeline, filterTimeline } from '@/lib/timeline/build';
import type { TimelineEventType } from '@/lib/timeline/types';
import type { SportId } from '@swingiq/core';
import { format } from 'date-fns';

const TYPE_META: Record<TimelineEventType, { icon: typeof Activity; label: string; cls: string }> = {
  session: { icon: Activity, label: 'Session', cls: 'bg-primary/10 text-primary' },
  diagnosis: { icon: Target, label: 'Diagnosis', cls: 'bg-error/10 text-error' },
  video: { icon: Video, label: 'Video', cls: 'bg-warning/10 text-warning' },
  note: { icon: NotebookPen, label: 'Note', cls: 'bg-accent-secondary/10 text-accent-secondary' },
  equipment: { icon: Package, label: 'Equipment', cls: 'bg-success/10 text-success' },
  onboarding: { icon: Compass, label: 'Setup', cls: 'bg-muted text-muted-foreground' },
};

function relativeDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const days = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return format(d, 'MMM d, yyyy');
}

export default function TimelinePage() {
  const sessions = useSwingVantageStore((s) => s.sessions);
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);
  const dailyNotes = useSwingVantageStore((s) => s.dailyNotes);
  const clubs = useSwingVantageStore((s) => s.clubs);
  const onboarding = useSwingVantageStore((s) => s.onboarding);
  const { mode, status } = useAuth();

  const [typeFilter, setTypeFilter] = useState<TimelineEventType | 'all'>('all');
  const [sportFilter, setSportFilter] = useState<SportId | 'all'>('all');

  const allEvents = useMemo(
    () => buildTimeline({
      sessions, videoAnalyses, dailyNotes, clubs,
      onboardingCompletedAt: onboarding.completedAt,
      onboardingRole: onboarding.role,
    }),
    [sessions, videoAnalyses, dailyNotes, clubs, onboarding.completedAt, onboarding.role],
  );
  const summary = useMemo(() => summarizeTimeline(allEvents), [allEvents]);
  const events = useMemo(
    () => filterTimeline(allEvents, { type: typeFilter, sport: sportFilter }),
    [allEvents, typeFilter, sportFilter],
  );

  const typeOptions = (['all', ...Object.keys(TYPE_META)] as Array<TimelineEventType | 'all'>)
    .filter((t) => t === 'all' || summary.byType[t as TimelineEventType] > 0);

  const cloudSynced = mode === 'cloud' && status === 'authenticated';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock size={24} className="text-primary" /> Athlete Timeline
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Everything in your record, in order — {summary.total} event{summary.total === 1 ? '' : 's'}
          {summary.firstDate ? ` since ${format(new Date(summary.firstDate), 'MMM yyyy')}` : ''}.
        </p>
      </div>

      {/* Honest storage note (mode-gated — never claims local-only when synced) */}
      <div className="mb-5 flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {cloudSynced ? <CloudCheck size={15} className="mt-0.5 shrink-0 text-success" /> : <Smartphone size={15} className="mt-0.5 shrink-0" />}
        <span>
          {cloudSynced
            ? 'Saved to your account and synced across your devices. Your full history is kept — no session limit.'
            : 'Saved on this device. Create a free account to keep your full history safe and synced across devices.'}
        </span>
      </div>

      {allEvents.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center">
            <Clock size={36} className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold text-foreground">Your timeline starts with your first session</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Import launch-monitor data, log a session, or save a daily note and it will appear here in order.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/sessions/import" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Import data</Link>
              <Link href="/diagnose" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Analyze a swing</Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            {typeOptions.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'all' ? `All (${summary.total})` : `${TYPE_META[t as TimelineEventType].label} (${summary.byType[t as TimelineEventType]})`}
              </button>
            ))}
            {summary.sports.length > 1 && (
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value as SportId | 'all')}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                aria-label="Filter by sport"
              >
                <option value="all">All sports</option>
                {summary.sports.map((sp) => (
                  <option key={sp} value={sp}>{sp.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
          </div>

          {/* Event stream */}
          <ol className="relative space-y-3 border-l border-border pl-5">
            {events.map((e) => {
              const meta = TYPE_META[e.type];
              const Icon = meta.icon;
              return (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[1.65rem] flex size-6 items-center justify-center rounded-full ring-4 ring-[var(--color-background)] ${meta.cls}`}>
                    <Icon size={13} aria-hidden="true" />
                  </span>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{e.title}</p>
                      <time className="shrink-0 text-xs text-muted-foreground" dateTime={e.date}>{relativeDay(e.date)}</time>
                    </div>
                    {e.detail && <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="default" className="text-[10px]">{meta.label}</Badge>
                      {e.sport && <span className="text-[10px] capitalize text-muted-foreground">{e.sport.replace(/_/g, ' ')}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {events.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No events match this filter.</p>
          )}
        </>
      )}
    </div>
  );
}
