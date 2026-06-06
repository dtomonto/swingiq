'use client';

import { Dumbbell, Clock, Gauge, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import type { CoachingRecommendation } from '@/lib/bodysync';

const SESSION_LABEL: Record<CoachingRecommendation['sessionType'], string> = {
  recovery: 'Recovery / rest',
  mobility: 'Mobility',
  light_technical: 'Light technical',
  technical: 'Technical',
  full_practice: 'Full practice',
  speed_power: 'Speed & power',
  performance: 'Performance day',
};

export function PracticeAdjustmentCard({ rec }: { rec: CoachingRecommendation }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" aria-hidden="true" />
        <h3 className="text-sm font-bold text-foreground">Today&apos;s recommended session</h3>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={<Dumbbell size={14} />} label="Session" value={SESSION_LABEL[rec.sessionType]} />
        <Stat icon={<Clock size={14} />} label="Duration" value={`~${rec.durationMinutes} min`} />
        <Stat icon={<Gauge size={14} />} label="Intensity cap" value={`${rec.intensityCap}%`} />
        <Stat icon={<Flame size={14} />} label="Volume" value={cap(rec.volume)} />
      </div>

      <div className="mt-3 rounded-lg bg-muted/40 p-3">
        <p className="text-xs font-medium text-foreground">Warm-up</p>
        <p className="text-xs text-muted-foreground mt-0.5">{rec.warmup}</p>
      </div>

      <p className="mt-3 text-sm text-foreground leading-relaxed">{rec.recoveryNote}</p>

      {rec.injuryNote && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-xs text-warning leading-relaxed">{rec.injuryNote}</p>
        </div>
      )}

      {rec.explanation.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Why</p>
          <ul className="mt-1 space-y-1">
            {rec.explanation.map((e, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {e}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-primary">
          Sport-specific cues
        </summary>
        <ul className="mt-1.5 space-y-1">
          {rec.sportNotes.map((n, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {n}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <span className="flex items-center gap-1 text-muted-foreground">{icon}<span className="text-[10px]">{label}</span></span>
      <p className="mt-0.5 text-sm font-semibold text-foreground leading-tight">{value}</p>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
