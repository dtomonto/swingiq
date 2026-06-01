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
    <Card className="border-indigo-200 bg-linear-to-br from-indigo-50 to-white">
      <CardHeader className="flex flex-row items-center gap-2">
        <Brain size={16} className="text-indigo-600" />
        <CardTitle>{plan.title}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Sparkles size={12} /> Today&apos;s swing thoughts
          </p>
          <ul className="space-y-1">
            {plan.swingThoughts.map((t, i) => (
              <li key={i} className="text-sm font-medium text-gray-900 flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white border border-gray-200 p-2.5">
            <p className="font-semibold text-gray-500 mb-0.5">Warm-up focus</p>
            <p className="text-gray-700">{plan.warmupFocus}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-2.5">
            <p className="font-semibold text-gray-500 mb-0.5">On the day</p>
            <p className="text-gray-700">{plan.tacticalReminder}</p>
          </div>
        </div>

        <div className="rounded-lg bg-green-50 border border-green-200 p-2.5">
          <p className="text-xs text-green-800">{plan.confidenceCue}</p>
        </div>
        <p className="text-xs text-amber-700">Avoid: {plan.whatToAvoid}</p>
      </CardBody>
    </Card>
  );
}
