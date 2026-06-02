'use client';

// ============================================================
// SwingIQ — Player Arc Card
// ------------------------------------------------------------
// The story of the player's improvement so far: mission, baseline,
// trend, what keeps coming back, what they've moved past, and the
// single next move. Honest framing — "moved past" never claims a
// flaw is permanently fixed.
// ============================================================

import { Route, TrendingUp, TrendingDown, Minus, Flag, Repeat, CheckCircle2, Award } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import type { PlayerArc } from '@/lib/progress';
import type { TrendDirection } from '@/lib/agents';

function TrendBit({ direction, summary }: { direction: TrendDirection; summary: string }) {
  const map = {
    improving: { Icon: TrendingUp, cls: 'text-success' },
    declining: { Icon: TrendingDown, cls: 'text-error' },
    stable: { Icon: Minus, cls: 'text-muted-foreground' },
    unknown: { Icon: Minus, cls: 'text-muted-foreground' },
  } as const;
  const { Icon, cls } = map[direction];
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className={`${cls} shrink-0 mt-0.5`} />
      <p className="text-sm text-foreground">{summary}</p>
    </div>
  );
}

function Chips({ items, tone }: { items: string[]; tone: 'recurring' | 'past' }) {
  const cls = tone === 'recurring' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success';
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span key={it} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
          {it}
        </span>
      ))}
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function PlayerArcCard({ arc }: { arc: PlayerArc }) {
  return (
    <Card className="border-primary/30">
      <CardBody className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
          <Route size={13} /> Player Arc
        </div>

        {/* Mission */}
        <div className="flex items-start gap-2">
          <Flag size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-foreground">{arc.mission}</p>
        </div>

        {/* Baseline + trend */}
        <p className="text-xs text-muted-foreground">{arc.baseline}</p>
        <TrendBit direction={arc.trendDirection} summary={arc.trendSummary} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border">
          <Stat value={arc.sessionsLogged} label="Sessions" />
          <Stat value={arc.streakDays} label="Day streak" />
          <Stat value={arc.retestsCompleted} label="Retests" />
        </div>

        {/* Recurring + moved-past */}
        {arc.recurringFlaws.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
              <Repeat size={12} className="text-warning" /> Keeps coming back
            </p>
            <Chips items={arc.recurringFlaws} tone="recurring" />
          </div>
        )}
        {arc.movedPastFlaws.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
              <CheckCircle2 size={12} className="text-success" /> No longer your top issue
            </p>
            <Chips items={arc.movedPastFlaws} tone="past" />
          </div>
        )}

        {/* Milestones */}
        {arc.milestones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {arc.milestones.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Award size={12} className="text-primary" /> {m}
              </span>
            ))}
          </div>
        )}

        {/* Next best action */}
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <p className="text-xs font-semibold text-primary">Next best move</p>
          <p className="text-sm text-foreground mt-0.5">{arc.nextBestAction}</p>
        </div>
      </CardBody>
    </Card>
  );
}
