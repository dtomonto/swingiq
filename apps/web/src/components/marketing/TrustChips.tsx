import type { LucideIcon } from 'lucide-react';
import { Lock, UserX, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TrustChip = { icon: LucideIcon; label: string };

/**
 * The "No account required · 100% free · Private by default" reassurance row
 * that sits under the hero CTAs. Previously hand-inlined verbatim in both the
 * homepage hero (`LocalizedHome`) and every sport landing hero
 * (`SportAnalysisHero`); extracted here so the trust sequence is one component
 * (maps cleanly to a Figma "Trust Chips" component) and can't drift.
 *
 * Icons use the theme-safe `text-link` accent and labels `text-muted-foreground`
 * — both AA-tuned per theme. Renders nothing when `chips` is empty.
 */
export const DEFAULT_TRUST_CHIPS: TrustChip[] = [
  { icon: UserX, label: 'No account required' },
  { icon: Zap, label: '100% free' },
  { icon: Lock, label: 'Private by default' },
];

export function TrustChips({
  chips = DEFAULT_TRUST_CHIPS,
  align = 'start',
  className,
}: {
  chips?: TrustChip[];
  /** Hero copy is left-aligned; centered heroes pass `center`. @default 'start' */
  align?: 'start' | 'center';
  className?: string;
}) {
  if (chips.length === 0) return null;
  return (
    <ul
      className={cn(
        'mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground',
        align === 'center' && 'justify-center',
        className,
      )}
    >
      {chips.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon size={16} className="shrink-0 text-link" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}
