'use client';

import { ShieldCheck } from 'lucide-react';
import { NON_MEDICAL_DISCLAIMER } from '@/lib/bodysync';

/** The non-medical disclaimer, shown wherever BodySync health context appears. */
export function NonMedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-muted-foreground"
      role="note"
    >
      <ShieldCheck size={compact ? 14 : 16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className={compact ? 'text-2xs leading-relaxed' : 'text-xs leading-relaxed'}>
        {NON_MEDICAL_DISCLAIMER}
      </p>
    </div>
  );
}
