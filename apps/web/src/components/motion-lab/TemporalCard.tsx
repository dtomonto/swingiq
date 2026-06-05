'use client';

// ============================================================
// SwingVantage — Motion Lab: Temporal Intelligence Card
// ------------------------------------------------------------
// Shows HOW the motion unfolds over time: load / transition /
// acceleration durations, where speed peaks, contact-window stability,
// deceleration control, and any timing flags. Single-camera proxies —
// basis + confidence shown.
// ============================================================

import { Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TemporalIntelligence } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';

const SEVERITY_STYLE: Record<string, string> = {
  high: 'text-error bg-error/10',
  moderate: 'text-warning bg-warning/10',
  low: 'text-muted-foreground bg-muted/40',
};

function ms(n: number | null): string {
  return n != null ? `${(n / 1000).toFixed(2)}s` : '—';
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface Props {
  temporal: TemporalIntelligence;
  accent?: string;
}

export function TemporalCard({ temporal: t, accent = '#22C55E' }: Props) {
  // Nothing meaningful to show on an un-timeable clip.
  if (t.confidence === 0 && t.flags.length === 0 && t.tempoRatio == null) return null;
  const clean = t.flags.length === 0;

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4" style={{ color: accent }} />
          <p className="text-sm font-semibold text-foreground">Timing — how your motion unfolds</p>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{Math.round(t.confidence * 100)}% conf.</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Stat label="Tempo" value={t.tempoRatio != null ? `${t.tempoRatio}:1` : '—'} hint="back : through" />
          <Stat label="Load" value={ms(t.loadDurationMs)} hint="to top of backswing" />
          <Stat label="Transition" value={ms(t.transitionDurationMs)} hint="change of direction" />
          <Stat label="Acceleration" value={ms(t.accelerationDurationMs)} hint="to contact" />
          <Stat
            label="Contact stability"
            value={t.contactWindowStability != null ? `${t.contactWindowStability}/100` : '—'}
            hint="steady through strike"
          />
          <Stat
            label="Deceleration"
            value={t.decelerationControl != null ? `${t.decelerationControl}/100` : '—'}
            hint="controlled finish"
          />
        </div>

        <div className="flex items-start gap-2">
          {clean ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          )}
          <p className="text-sm text-foreground leading-relaxed">{t.summary}</p>
        </div>

        {t.flags.length > 0 && (
          <ul className="space-y-1.5">
            {t.flags.map((f) => (
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

        {t.disclaimer && <p className="text-[10px] text-muted-foreground/80 border-t border-border pt-2">{t.disclaimer}</p>}
      </CardBody>
    </Card>
  );
}
