'use client';

import { AlertTriangle } from 'lucide-react';
import type { InjuryRiskFlag } from '@/lib/bodysync';
import { BODY_REGIONS } from '@/lib/bodysync';

export function FatigueRiskBanner({ risk }: { risk: InjuryRiskFlag }) {
  if (risk.level === 'none') return null;
  const elevated = risk.level === 'elevated';
  const regionLabels = risk.regions
    .map((r) => BODY_REGIONS.find((b) => b.id === r)?.label)
    .filter(Boolean);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 ${
        elevated ? 'border-error/40 bg-error/10' : 'border-warning/40 bg-warning/10'
      }`}
      role="alert"
    >
      <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${elevated ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${elevated ? 'text-error' : 'text-warning'}`}>
          {elevated ? 'Elevated fatigue / strain signals' : 'Worth watching today'}
        </p>
        <ul className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {risk.reasons.map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
        {regionLabels.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            SwingVantage will ease drills loading: <span className="font-medium text-foreground">{regionLabels.join(', ')}</span>.
          </p>
        )}
        <p className="mt-1 text-2xs text-muted-foreground">If discomfort persists, consider a qualified health professional.</p>
      </div>
    </div>
  );
}
