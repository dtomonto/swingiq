'use client';

import { useMemo } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAgentContext } from '@/hooks/useAgentContext';
import { buildPreGamePlan } from '@/lib/agents';

// Compact pre-game / pre-round STRATEGY card (mental side) — complements the
// physical warm-up routine already on the page. 1–2 swing thoughts, max.

export function PreGameStrategyCard() {
  const { ready, ctx } = useAgentContext();

  const plan = useMemo(() => (ctx ? buildPreGamePlan(ctx) : null), [ctx]);

  if (!ready || !plan) return null;

  return (
    <Card className="border-accent-secondary/25 bg-linear-to-br from-accent-secondary/10 to-card">
      <CardHeader className="flex flex-row items-center gap-2">
        <Brain size={16} className="text-accent-secondary" />
        <CardTitle>{plan.title}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-accent-secondary uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Sparkles size={12} /> Today&apos;s swing thoughts
          </p>
          <ul className="space-y-1">
            {plan.swingThoughts.map((t, i) => (
              <li key={i} className="text-sm font-medium text-foreground flex items-start gap-2">
                <span className="text-accent-secondary">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-card border border-border p-2.5">
            <p className="font-semibold text-muted-foreground mb-0.5">Warm-up focus</p>
            <p className="text-foreground">{plan.warmupFocus}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-2.5">
            <p className="font-semibold text-muted-foreground mb-0.5">On the day</p>
            <p className="text-foreground">{plan.tacticalReminder}</p>
          </div>
        </div>

        <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5">
          <p className="text-xs text-primary">{plan.confidenceCue}</p>
        </div>
        <p className="text-xs text-warning">Avoid: {plan.whatToAvoid}</p>
      </CardBody>
    </Card>
  );
}
