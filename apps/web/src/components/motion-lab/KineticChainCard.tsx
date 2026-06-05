'use client';

// ============================================================
// SwingVantage — Motion Lab: Kinetic Chain Card
// ------------------------------------------------------------
// Visualizes the firing ORDER of the energy transfer (lower body →
// torso → arms → implement) as a timeline of when each segment peaks,
// plus any power-leak flags and a plain-language coaching summary.
// Honest: a single-camera proxy, basis + confidence shown.
// ============================================================

import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { KineticChainScore } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';

const SEVERITY_STYLE: Record<string, string> = {
  high: 'text-error bg-error/10',
  moderate: 'text-warning bg-warning/10',
  low: 'text-muted-foreground bg-muted/40',
};

interface Props {
  chain: KineticChainScore;
  accent?: string;
}

export function KineticChainCard({ chain, accent = '#22C55E' }: Props) {
  const timed = chain.segments.filter((s) => s.peakTimePct != null);
  if (timed.length < 2) return null;

  const ordered = chain.sequenceQuality >= 90 && chain.powerLeakFlags.length === 0;

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: accent }} />
          <p className="text-sm font-semibold text-foreground">Kinetic chain — energy transfer</p>
          <span className="ml-auto text-xs font-semibold tabular-nums" style={{ color: accent }}>
            {chain.overall}/100
          </span>
        </div>

        {/* Firing-order timeline: each segment plotted at the fraction of the
            motion where it peaks. Ground-up = left-to-right in chain order. */}
        <div className="relative h-16">
          <div className="absolute left-0 right-0 top-8 h-px bg-border" />
          {timed.map((s) => {
            const left = `${Math.round((s.peakTimePct ?? 0) * 100)}%`;
            return (
              <div key={s.segment} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left, top: 0 }}>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{s.label}</span>
                <span className="mt-1 block w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
                <span className="text-[9px] text-muted-foreground tabular-nums mt-0.5">{Math.round((s.peakTimePct ?? 0) * 100)}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground -mt-1">
          When each link reaches peak speed (0% = start of motion, 100% = end). A good motion fires in this order: lower body → torso → arms → implement.
        </p>

        {/* Coaching summary */}
        <div className="flex items-start gap-2">
          {ordered ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          )}
          <p className="text-sm text-foreground leading-relaxed">{chain.coachingSummary}</p>
        </div>

        {/* Power-leak flags */}
        {chain.powerLeakFlags.length > 0 && (
          <ul className="space-y-1.5">
            {chain.powerLeakFlags.map((f) => (
              <li key={f.id} className="flex items-start gap-2">
                <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 shrink-0 ${SEVERITY_STYLE[f.severity]}`}>
                  {f.severity}
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{f.label}.</span> {f.detail}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-start gap-2 border-t border-border pt-2">
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Focus:</span>
          <p className="text-[11px] text-muted-foreground">{chain.recommendedFocus}</p>
        </div>

        {chain.disclaimer && (
          <p className="text-[10px] text-muted-foreground/80">{chain.disclaimer}</p>
        )}
      </CardBody>
    </Card>
  );
}
