'use client';

import { Activity, ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';
import type { ReadinessAssessment } from '@/lib/bodysync';
import { ZONE_META } from '@/lib/bodysync';

const TONE: Record<string, { ring: string; text: string; bg: string }> = {
  success: { ring: 'ring-success/40', text: 'text-success', bg: 'bg-success/10' },
  warning: { ring: 'ring-warning/40', text: 'text-warning', bg: 'bg-warning/10' },
  error: { ring: 'ring-error/40', text: 'text-error', bg: 'bg-error/10' },
};

function Donut({ value, tone }: { value: number; tone: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={r} className="fill-none stroke-border" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r}
        className={`fill-none ${TONE[tone]?.text ?? 'text-primary'}`}
        stroke="currentColor" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
      />
    </svg>
  );
}

export function ReadinessScoreCard({ assessment }: { assessment: ReadinessAssessment }) {
  const [open, setOpen] = useState(false);
  const meta = ZONE_META[assessment.zone];
  const tone = TONE[meta.tone] ?? TONE.warning;

  const scores = [
    { label: 'Recovery', v: assessment.recovery.score },
    { label: 'Readiness', v: assessment.readiness.score },
    { label: 'Load', v: assessment.trainingLoad.score },
    { label: 'Opportunity', v: assessment.performanceOpportunity.score },
  ];

  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ring-1 ${tone.ring}`}>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Donut value={assessment.readiness.score} tone={meta.tone} />
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
            {assessment.readiness.score}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{meta.emoji}</span>
            <span className={`text-lg font-bold ${tone.text}`}>{meta.label}</span>
            <span className="text-3xs uppercase tracking-wide text-muted-foreground rounded-full bg-muted px-2 py-0.5">
              {assessment.confidence} confidence
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{assessment.summary}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {scores.map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/40 px-2 py-2 text-center">
            <p className="text-sm font-semibold text-foreground">{s.v}</p>
            <p className="text-3xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
        aria-expanded={open}
      >
        <Info size={13} aria-hidden="true" /> Why this score
        <ChevronDown size={13} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden="true" />
      </button>

      {open && (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {assessment.readiness.contributors
            .filter((c) => Math.abs(c.impact) >= 3)
            .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
            .map((c, i) => (
              <li key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Activity size={11} aria-hidden="true" /> {c.label}
                </span>
                <span className={c.impact >= 0 ? 'text-success font-medium' : 'text-error font-medium'}>
                  {c.impact >= 0 ? '+' : ''}{c.impact}
                </span>
              </li>
            ))}
          {assessment.readiness.missing.length > 0 && (
            <li className="text-2xs text-muted-foreground pt-1">
              Add {assessment.readiness.missing.slice(0, 3).join(', ')} to sharpen this estimate.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
