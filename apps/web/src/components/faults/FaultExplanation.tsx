'use client';

// ============================================================
// SwingVantage — Fault Explanation (role-aware)
// ------------------------------------------------------------
// Renders what a swing fault MEANS in the voice that fits the
// user — parent / coach / advanced — defaulting to their chosen
// coaching tone, with a small toggle to switch. Backed by the
// fault ontology, so the copy is consistent everywhere a fault is
// explained. Accepts free-text (AI) issues or known fault ids.
// ============================================================

import { useState } from 'react';
import type { SportId } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { useSwingVantageStore } from '@/store';
import { resolveFault, matchFaultId, audienceFromTone } from '@/lib/faults';
import type { FaultAudience } from '@/lib/faults';

const AUDIENCES: Array<{ id: FaultAudience; label: string }> = [
  { id: 'parent', label: 'Parent' },
  { id: 'coach', label: 'Coach' },
  { id: 'advanced', label: 'Advanced' },
];

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'swing_focus';
}

export function FaultExplanation({
  faultText,
  faultId,
  sport,
  className,
}: {
  /** Free-text issue (e.g. from AI vision). Used to match a curated fault. */
  faultText?: string;
  /** A known ontology/diagnosis id (takes precedence over faultText). */
  faultId?: string;
  sport?: SportId;
  className?: string;
}) {
  const tone = useSwingVantageStore((s) => s.settings.coaching_tone);
  const [override, setOverride] = useState<FaultAudience | null>(null);
  const audience = override ?? audienceFromTone(tone);

  const label = faultText?.trim() || '';
  const id = faultId ?? (label ? matchFaultId(label, sport) ?? slug(label) : 'swing_focus');
  const entry = resolveFault(id, { label, sport });
  const explanation = entry.explanations[audience];

  return (
    <div className={cn('rounded-lg border border-border bg-muted/50 p-3', className)}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-xs font-semibold text-foreground">What this means</p>
        <div className="flex gap-1" role="group" aria-label="Explanation audience">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setOverride(a.id)}
              aria-pressed={audience === a.id}
              className={cn(
                'px-2 py-0.5 rounded-full text-2xs font-medium transition-colors',
                audience === a.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
    </div>
  );
}
