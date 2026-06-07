'use client';

// ============================================================
// SwingVantage — TeamOS: the team read (shared focus)
// ============================================================

import { Users, Target } from 'lucide-react';
import type { TeamPulse } from '@/lib/team';

export function TeamPulseCard({ pulse }: { pulse: TeamPulse }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-primary">
        <Users size={18} aria-hidden="true" />
        <h2 className="font-semibold">Team read</h2>
      </div>
      <p className="mt-2 text-sm text-foreground">{pulse.summary}</p>

      {pulse.topSharedGap && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <Target size={18} className="shrink-0 text-primary" aria-hidden="true" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">Group focus: {pulse.topSharedGap.name}</span>
            <span className="text-muted-foreground">
              {' '}— {pulse.topSharedGap.athletesAffected} affected · team avg {pulse.topSharedGap.avgScore}/100
            </span>
          </div>
        </div>
      )}

      {pulse.gaps.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Shared gaps (most athletes weak → fewest)
          </p>
          {pulse.gaps.map((g) => (
            <div key={g.capability}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{g.name}</span>
                <span className="text-muted-foreground">{g.athletesAffected} weak · avg {g.avgScore}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${pulse.memberCount ? (g.athletesAffected / pulse.memberCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
