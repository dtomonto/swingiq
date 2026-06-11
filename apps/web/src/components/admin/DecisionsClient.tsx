'use client';

// ============================================================
// DecisionsClient — interactive shell for the Decision Center queue
// ------------------------------------------------------------
// Renders the ranked DecisionCards, opens the DecisionDrawer on a row, and
// persists each decision's staged-rollout plan locally (decision-rollout).
// The server page stays a pure data source; all interactivity lives here.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { DecisionCard, type DecisionVM } from './DecisionCard';
import { DecisionDrawer } from './DecisionDrawer';
import {
  DEFAULT_PLAN, getRolloutPlan, setRolloutPlan, type RolloutPlan,
} from '@/lib/admin/decision-rollout';

export function DecisionsClient({ decisions }: { decisions: DecisionVM[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Record<string, RolloutPlan>>({});

  // Seed a decision's saved plan from localStorage the first time it's opened
  // (event handler, not an effect — no cascading render, no SSR mismatch).
  const open = useCallback((id: string) => {
    setSelectedId(id);
    setPlans((prev) => (prev[id] ? prev : { ...prev, [id]: getRolloutPlan(id) ?? DEFAULT_PLAN }));
  }, []);

  // Close the drawer on Escape.
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const selected = decisions.find((d) => d.id === selectedId) ?? null;
  const selectedPlan = selectedId ? (plans[selectedId] ?? DEFAULT_PLAN) : DEFAULT_PLAN;

  const onPlanChange = useCallback((id: string, plan: RolloutPlan) => {
    const saved = setRolloutPlan(id, plan, new Date().toISOString());
    setPlans((prev) => ({ ...prev, [id]: saved }));
  }, []);

  return (
    <>
      <div className="space-y-3">
        {decisions.map((d) => (
          <DecisionCard
            key={d.id}
            score={d.score}
            band={d.band}
            type={d.type}
            title={d.title}
            read={d.read}
            meta={d.meta}
            href={d.href}
            cta={d.cta}
            onSelect={() => open(d.id)}
          />
        ))}
      </div>

      {selected && (
        <DecisionDrawer
          decision={selected}
          plan={selectedPlan}
          savedAt={selectedId ? plans[selectedId]?.updatedAt : undefined}
          onPlanChange={(plan) => onPlanChange(selected.id, plan)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
