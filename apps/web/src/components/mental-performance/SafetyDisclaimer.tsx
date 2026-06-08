import { ShieldCheck } from 'lucide-react';
import {
  NON_MEDICAL_DISCLAIMER, SHORT_DISCLAIMER, PROFESSIONAL_NOTE, CRISIS_NOTE,
} from '@/lib/mental-performance/constants';

/**
 * Non-alarming performance-coaching disclaimer. `variant`:
 *  - 'short'  — one calm line (footers, cards).
 *  - 'full'   — full non-medical + professional + crisis note (page level).
 */
export function SafetyDisclaimer({ variant = 'short' }: { variant?: 'short' | 'full' }) {
  if (variant === 'short') {
    return (
      <p className="text-xs text-muted-foreground">{SHORT_DISCLAIMER}</p>
    );
  }
  return (
    <aside className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <ShieldCheck size={16} aria-hidden="true" />
        A quick, honest note
      </div>
      <p className="mt-2">{NON_MEDICAL_DISCLAIMER}</p>
      <p className="mt-2">{PROFESSIONAL_NOTE}</p>
      <p className="mt-2">{CRISIS_NOTE}</p>
    </aside>
  );
}
