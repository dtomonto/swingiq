'use client';

// ============================================================
// SwingVantage — Athlete Priority Panel (Phase 7)
// ------------------------------------------------------------
// The dashboard's synthesized "#1 thing to work on", computed from the
// WHOLE record (every session's diagnoses + club gapping + video
// issues), not just the latest session. Shows the top + secondary
// priority with evidence, how it's trending, what changed since last
// time, and what data would sharpen it. Self-hides until there's enough
// to synthesize. Records a snapshot so "what changed" works next visit.
// ============================================================

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, Sparkles, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore } from '@/store';
import { analyzeClubGaps, type ClubGapInput } from '@swingiq/core';
import { computeAthletePriorities, snapshotFromResult, type PrioritySessionInput } from '@/lib/priority/engine';
import type { AthletePriority, PrioritySeverity, PriorityTrend } from '@/lib/priority/types';

const SEVERITY_BADGE: Record<PrioritySeverity, 'critical' | 'warning' | 'info' | 'default'> = {
  critical: 'critical', high: 'warning', medium: 'info', low: 'default',
};

const TREND_META: Record<PriorityTrend, { icon: typeof Minus; label: string; cls: string }> = {
  new: { icon: Sparkles, label: 'New', cls: 'text-primary' },
  persisting: { icon: Minus, label: 'Persisting', cls: 'text-muted-foreground' },
  improving: { icon: TrendingDown, label: 'Easing', cls: 'text-success' },
  worsening: { icon: TrendingUp, label: 'Worsening', cls: 'text-error' },
};

function TrendTag({ trend }: { trend: PriorityTrend }) {
  const m = TREND_META[trend];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.cls}`}>
      <Icon size={12} aria-hidden="true" /> {m.label}
    </span>
  );
}

export function PriorityPanel() {
  const sessions = useSwingVantageStore((s) => s.sessions);
  const clubs = useSwingVantageStore((s) => s.clubs);
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);
  const snapshots = useSwingVantageStore((s) => s.prioritySnapshots);
  const record = useSwingVantageStore((s) => s.recordPrioritySnapshot);

  // Capture the previous snapshot ONCE at mount so "what changed" compares to
  // last visit (not to the snapshot we're about to record this render).
  const previousRef = useRef(snapshots[snapshots.length - 1] ?? null);

  const result = useMemo(() => {
    const golf = sessions.filter((s) => s.sport === 'golf' || !s.sport);
    const prioritySessions: PrioritySessionInput[] = golf.map((s) => ({
      id: s.id,
      date: s.date || s.created_at,
      diagnoses: s.diagnoses ?? [],
    }));
    const hasClubFaceData = golf.some((s) =>
      s.shots?.some((sh) => sh.club_data?.face_to_path != null || sh.club_data?.club_path != null),
    );
    const gapInputs: ClubGapInput[] = clubs.map((c) => ({
      id: c.id, name: c.name, category: c.category, typical_carry: c.typical_carry, sort_order: c.sort_order,
    }));
    const gap = clubs.length >= 2 ? analyzeClubGaps(gapInputs) : null;
    const videoIssues = videoAnalyses
      .filter((v) => !!v.primary_issue)
      .map((v) => ({ issue: v.primary_issue as string, date: v.created_at }));

    return computeAthletePriorities({
      sessions: prioritySessions,
      videoIssues,
      gapping: gap ? { grade: gap.overall_grade, summary: gap.summary } : null,
      hasClubFaceData,
      previous: previousRef.current,
    });
  }, [sessions, clubs, videoAnalyses]);

  // Persist the snapshot when the top priority changes (slice dedups).
  const topId = result.top?.id ?? null;
  useEffect(() => {
    if (result.top) record(snapshotFromResult(result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topId]);

  if (result.insufficientData || !result.top) return null;

  const top = result.top;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Target size={18} className="text-primary" aria-hidden="true" /> Your #1 priority
          </CardTitle>
          <Badge variant={SEVERITY_BADGE[top.severity]} className="capitalize">{top.severity}</Badge>
        </div>
        {result.whatChanged && <p className="mt-1 text-sm text-muted-foreground">{result.whatChanged}</p>}
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Top priority */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-foreground">{top.label}</h3>
            <TrendTag trend={top.trend} />
          </div>
          {top.summary && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{top.summary}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            {top.evidence.map((e) => (
              <span key={e.label} className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{e.detail}</span> {e.label.toLowerCase() === 'confidence' ? 'confidence' : e.label.toLowerCase()}
              </span>
            ))}
          </div>

          <div className="mt-3">
            <Link href={top.recommendedPlanHref}>
              <Button size="sm">
                Build a plan for this <ChevronRight size={14} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Secondary priority (compact) */}
        {result.secondary && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Also on the radar</p>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{result.secondary.label}</p>
                <p className="text-xs text-muted-foreground">{result.secondary.occurrences} session{result.secondary.occurrences === 1 ? '' : 's'} · {result.secondary.confidence}% confidence</p>
              </div>
              <TrendTag trend={result.secondary.trend} />
            </div>
          </div>
        )}

        {/* What would sharpen this */}
        {result.whatsMissing.length > 0 && (
          <div className="rounded-lg bg-accent-secondary/10 border border-accent-secondary/25 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-secondary">
              <Info size={13} aria-hidden="true" /> Sharpen this priority
            </p>
            <ul className="mt-1 space-y-0.5">
              {result.whatsMissing.slice(0, 2).map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {m}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Synthesized from {sessions.length} session{sessions.length === 1 ? '' : 's'} — not just your latest — weighted for how recent, severe, and recurring each issue is.
        </p>
      </CardBody>
    </Card>
  );
}
