'use client';

// ============================================================
// SwingVantage — Motion Lab: Drill Plan
// ============================================================

import { useState } from 'react';
import { ChevronDown, Dumbbell, Clock, Video, Zap, Wind, Wrench, Lock } from 'lucide-react';
import type { DrillPlan as Plan, PrescribedDrill } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const KIND_META: Record<PrescribedDrill['kind'], { label: string; icon: typeof Zap; color: string }> = {
  immediate: { label: 'Immediate fix', icon: Zap, color: 'text-warning' },
  feel: { label: 'Feel drill', icon: Wind, color: 'text-accent-secondary' },
  technical: { label: 'Technical drill', icon: Wrench, color: 'text-primary' },
  constraint: { label: 'Constraint drill', icon: Lock, color: 'text-error' },
};

function DrillCard({ drill }: { drill: PrescribedDrill }) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[drill.kind];
  const Icon = meta.icon;
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
        <div className={cn('w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0', meta.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-3xs font-semibold uppercase tracking-wide text-muted-foreground">{meta.label}</p>
          <p className="text-sm font-semibold text-foreground truncate">{drill.name}</p>
          <p className="text-xs text-muted-foreground truncate">{drill.problemItSolves}</p>
        </div>
        <span className="text-2xs text-muted-foreground flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{drill.estimatedMinutes}m</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 text-xs border-t border-border bg-muted/30">
          <p className="text-muted-foreground"><span className="font-semibold text-foreground">Setup: </span>{drill.setup}</p>
          <ol className="list-decimal list-inside space-y-1 text-foreground">
            {drill.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <p className="text-muted-foreground"><span className="font-semibold text-foreground">Reps: </span>{drill.repsOrDuration}</p>
            <p className="text-muted-foreground"><span className="font-semibold text-foreground">Level: </span>{drill.difficulty}</p>
            <p className="text-muted-foreground"><span className="font-semibold text-foreground">Equipment: </span>{drill.equipment}</p>
            <p className="text-muted-foreground"><span className="font-semibold text-foreground">Success cue: </span>{drill.successCue}</p>
          </div>
          <p className="text-muted-foreground"><span className="font-semibold text-error">Common mistake: </span>{drill.commonMistake}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-2xs text-muted-foreground">↑ Harder: {drill.progression}</span>
            <span className="text-2xs text-muted-foreground">↓ Easier: {drill.regression}</span>
          </div>
          {drill.videoSearchUrl && (
            <a href={drill.videoSearchUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline pt-1">
              <Video className="w-3.5 h-3.5" /> Watch examples
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function DrillPlan({ plan }: { plan: Plan }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <DrillCard drill={plan.immediate} />
        <DrillCard drill={plan.feel} />
        <DrillCard drill={plan.technical} />
        <DrillCard drill={plan.constraint} />
      </div>

      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-primary" /> Your week
          </p>
          <div className="grid grid-cols-7 gap-1">
            {plan.weeklyPlan.map((d) => (
              <div key={d.day} className="text-center">
                <div className="text-3xs font-semibold text-muted-foreground">{d.day}</div>
                <div className={cn('mt-1 rounded-md py-2 px-0.5 text-[9px] leading-tight min-h-[58px] flex flex-col items-center justify-center',
                  d.minutes > 0 ? 'bg-primary/10 text-foreground' : 'bg-muted text-muted-foreground')}>
                  <span className="line-clamp-3">{d.focus}</span>
                  {d.minutes > 0 && <span className="text-muted-foreground mt-0.5">{d.minutes}m</span>}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
