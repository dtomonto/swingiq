// ============================================================
// SwingVantage — ConfidenceNote: honest, reusable evidence-basis
// callout for learning pages (and reusable elsewhere). Mirrors the
// product rule: never fake precision — say measured vs inferred.
// ============================================================

import { ShieldCheck, Gauge, Sparkles, User } from 'lucide-react';
import type { EvidenceBasis } from '@/lib/faults';

const META: Record<EvidenceBasis, { label: string; icon: typeof Gauge; tone: string }> = {
  measured: { label: 'Measured', icon: ShieldCheck, tone: 'border-success/30 bg-success/10 text-success' },
  estimated: { label: 'Estimated from video', icon: Gauge, tone: 'border-warning/30 bg-warning/10 text-warning' },
  ai_inferred: { label: 'AI-inferred', icon: Sparkles, tone: 'border-accent-secondary/30 bg-accent-secondary/10 text-foreground' },
  user_entered: { label: 'Self-reported', icon: User, tone: 'border-border bg-muted text-muted-foreground' },
};

export function ConfidenceNote({
  basis,
  explanation,
}: {
  basis: EvidenceBasis;
  explanation: string;
}) {
  const meta = META[basis];
  const Icon = meta.icon;
  return (
    <div className={`mt-3 flex items-start gap-2 rounded-xl border p-4 ${meta.tone}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">Confidence: {meta.label}</p>
        <p className="mt-1 text-sm opacity-90">{explanation}</p>
      </div>
    </div>
  );
}
