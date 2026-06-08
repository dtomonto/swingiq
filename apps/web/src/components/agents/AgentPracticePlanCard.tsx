'use client';

import { useMemo, useState } from 'react';
import { Clock, Dumbbell, Flag, Sparkles, Target } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAgentContext } from '@/hooks/useAgentContext';
import { buildPracticePlan } from '@/lib/agents';

// Surfaces the Practice Planner workflow as a concise, time-boxed plan.
// Plain language, 2–3 drills, never overwhelming.

export function AgentPracticePlanCard() {
  const { ready, ctx } = useAgentContext();
  const [minutes, setMinutes] = useState<number | null>(null);

  const plan = useMemo(() => {
    if (!ctx) return null;
    return buildPracticePlan(ctx, minutes ?? undefined);
  }, [ctx, minutes]);

  if (!ready || !plan) return null;

  return (
    <Card className="border-accent-secondary/25 bg-accent-secondary/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent-secondary" />
          <CardTitle>Your practice focus</CardTitle>
        </div>
        <Badge variant="info" className="capitalize">{plan.difficultyLevel}</Badge>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Target size={15} className="text-accent-secondary" />
            <p className="font-semibold text-foreground text-sm capitalize">{plan.practiceFocus}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{plan.whyThisPlan}</p>
        </div>

        {/* Time options */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            How much time today?
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Practice length">
            {plan.timeOptions.map((t) => {
              const active = plan.estimatedTimeMinutes === t;
              return (
                <button
                  key={t}
                  onClick={() => setMinutes(t)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-accent-secondary text-white'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                  }`}
                >
                  {t} min
                </button>
              );
            })}
          </div>
        </div>

        {/* Warmup */}
        <div className="flex items-start gap-2 text-sm">
          <Clock size={15} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-foreground"><span className="font-medium">Warm-up:</span> {plan.warmup}</p>
        </div>

        {/* Drills */}
        <div className="space-y-2">
          {plan.mainDrills.map((d, i) => (
            <div key={i} className="rounded-lg bg-card border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Dumbbell size={13} className="text-accent-secondary" /> {d.name}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{d.repsOrTime}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{d.why}</p>
              <p className="text-xs text-link mt-1">✓ {d.successMetric}</p>
            </div>
          ))}
        </div>

        {/* Pressure test + success */}
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3">
          <p className="text-xs font-semibold text-warning-text flex items-center gap-1.5">
            <Flag size={13} /> Pressure test
          </p>
          <p className="text-xs text-warning-text mt-1">{plan.pressureTest}</p>
          <p className="text-xs text-warning-text mt-1.5 font-medium">Goal: {plan.successMetric}</p>
        </div>

        <p className="text-xs text-muted-foreground">{plan.nextSessionPrompt}</p>
      </CardBody>
    </Card>
  );
}
