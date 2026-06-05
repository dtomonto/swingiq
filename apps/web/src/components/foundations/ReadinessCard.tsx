'use client';

// ============================================================
// SwingVantage — Readiness + Game-Ready Card
// ------------------------------------------------------------
// Two transparent guidance scores side by side, each with its
// factors visible and an honest basis line. A safety caution, if
// present, is shown above the number — it always wins.
// ============================================================

import { Gauge, ShieldAlert, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { TransparentScore, ScoreBand } from '@/lib/readiness';

const BAND_RING: Record<ScoreBand, string> = {
  building: 'text-muted-foreground',
  developing: 'text-warning',
  solid: 'text-primary',
  sharp: 'text-success',
};

const BAND_LABEL: Record<ScoreBand, string> = {
  building: 'Building',
  developing: 'Developing',
  solid: 'Solid',
  sharp: 'Sharp',
};

function ScoreBlock({ title, s }: { title: string; s: TransparentScore }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={cn('text-3xl font-black', BAND_RING[s.band])}>{s.score}</span>
        <span className={cn('text-xs font-semibold', BAND_RING[s.band])}>{BAND_LABEL[s.band]}</span>
      </div>
      <p className="text-sm text-foreground mt-1">{s.headline}</p>

      {s.caution && (
        <p className="flex items-start gap-1.5 text-xs text-error bg-error/10 px-2 py-1.5 rounded mt-2">
          <ShieldAlert size={12} className="shrink-0 mt-0.5" /> {s.caution}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
        aria-expanded={open}
      >
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
        {open ? 'Hide' : 'Why this score'}
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {s.factors.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{f.label}</span>
              <span className={cn('font-semibold', f.contribution >= 0 ? 'text-success' : 'text-error')}>
                {f.contribution >= 0 ? '+' : ''}{f.contribution}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground mt-2">{s.basis}</p>
    </div>
  );
}

export function ReadinessCard({ readiness, gameReady }: { readiness: TransparentScore; gameReady: TransparentScore }) {
  return (
    <Card className="border-primary/30">
      <CardBody className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
          <Gauge size={13} /> Readiness Engine
        </div>
        <div className="flex flex-col sm:flex-row gap-5">
          <ScoreBlock title="Readiness" s={readiness} />
          <div className="hidden sm:block w-px bg-border" />
          <ScoreBlock title="Game-Ready" s={gameReady} />
        </div>
      </CardBody>
    </Card>
  );
}
