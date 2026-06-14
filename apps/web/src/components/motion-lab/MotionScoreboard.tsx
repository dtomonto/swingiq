'use client';

// ============================================================
// SwingVantage — Motion Lab: Scoreboard
// Overall Motion Score + transparent component scores + confidence.
// ============================================================

import type { MotionScoreboard as Scoreboard } from '@/lib/motion-lab';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

function tone(score: number): string {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-error';
}
function barTone(score: number): string {
  if (score >= 75) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-error';
}

export function MotionScoreboard({ scoreboard, accent = '#22C55E' }: { scoreboard: Scoreboard; accent?: string }) {
  const dash = (scoreboard.overall / 100) * 100.5;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-6 py-5 flex items-center gap-5 border-b border-border">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" className="text-muted" stroke="currentColor" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
              stroke={accent} strokeDasharray={`${dash} 100.5`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-foreground leading-none">{scoreboard.overall}</span>
            <span className="text-[9px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall Motion Score</p>
          <p className="text-sm text-foreground mt-0.5">
            Confidence <span className={cn('font-bold', tone(scoreboard.confidence * 100))}>{Math.round(scoreboard.confidence * 100)}%</span>
          </p>
          {scoreboard.disclaimer && (
            <p className="text-2xs text-muted-foreground mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />{scoreboard.disclaimer}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3">
        {scoreboard.components.map((c) => (
          <div key={c.id}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-foreground">{c.label}</span>
              <span className={cn('text-sm font-bold tabular-nums', tone(c.score))}>{c.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
              <div className={cn('h-full rounded-full', barTone(c.score))} style={{ width: `${c.score}%` }} />
            </div>
            <p className="text-3xs text-muted-foreground mt-1 leading-tight">{c.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
