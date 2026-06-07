'use client';

import Link from 'next/link';
import { SIMULATIONS } from '@/lib/academy/simulations';
import { useAcademyStore } from '@/lib/academy/store';
import { useMounted } from '@/components/academy/parts';

const KIND_EMOJI: Record<string, string> = { support: '🎧', sales: '📈', coach: '📋', feedback: '💬' };

export default function SimulationsPage() {
  const mounted = useMounted();
  const attempts = useAcademyStore((s) => s.progress.simulationAttempts);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Simulation Lab</h1>
        <p className="text-muted-foreground">Practice real scenarios. Write your response and get scored against a rubric — including guardrail checks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SIMULATIONS.map((sim) => {
          const rec = mounted ? attempts?.[sim.id] : undefined;
          return (
            <Link key={sim.id} href={`/admin/academy/simulations/${sim.id}`}
              className="group rounded-theme border border-border bg-card p-5 transition-colors hover:border-primary/50">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{KIND_EMOJI[sim.kind] ?? '🎯'}</span>
                {rec?.passed
                  ? <span className="text-xs font-semibold text-success">✓ passed</span>
                  : rec
                    ? <span className="text-xs text-muted-foreground">best {rec.bestScore}%</span>
                    : <span className="text-xs text-muted-foreground capitalize">{sim.kind}</span>}
              </div>
              <h3 className="mt-2 font-bold text-foreground group-hover:text-primary">{sim.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{sim.persona}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
