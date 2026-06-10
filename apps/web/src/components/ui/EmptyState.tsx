import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// ============================================================
// SwingVantage — EmptyState
// ------------------------------------------------------------
// One shared, accessible empty-state primitive so every screen
// answers the same three questions: what's here (title), why it
// matters (description), and what to do next (action). Renders
// inside an existing Card/section — it does NOT add its own card
// chrome, so it drops cleanly into the places that already have
// inline empties today.
// ============================================================

export interface EmptyStateAction {
  label: string;
  /** Use href for navigation, or onClick for an in-page action. */
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline';
  /** Optional leading icon inside the button. */
  icon?: LucideIcon;
}

/** Visual prominence. `sm` (default) matches the original inline empty;
 *  `lg` is for primary "get started" moments (e.g. an empty sessions list). */
export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** Tighter padding for use inside small cards/side panels. */
  compact?: boolean;
  /** Prominence — defaults to `sm` to preserve existing call-sites. */
  size?: EmptyStateSize;
  className?: string;
}

const SIZE_STYLES: Record<EmptyStateSize, { pad: string; icon: number; title: string; desc: string; btn: 'sm' | 'md' }> = {
  sm: { pad: 'py-8', icon: 36, title: 'text-sm font-semibold', desc: 'text-xs', btn: 'sm' },
  md: { pad: 'py-12', icon: 44, title: 'text-base font-semibold', desc: 'text-sm', btn: 'sm' },
  lg: { pad: 'py-16', icon: 48, title: 'text-lg font-semibold', desc: 'text-sm', btn: 'md' },
};

function ActionButton({ action, size }: { action: EmptyStateAction; size: 'sm' | 'md' }) {
  const ActionIcon = action.icon;
  const button = (
    <Button size={size} variant={action.variant ?? 'primary'} onClick={action.onClick}>
      {ActionIcon && <ActionIcon size={size === 'md' ? 16 : 14} aria-hidden="true" />}
      {action.label}
    </Button>
  );
  return action.href ? <Link href={action.href}>{button}</Link> : button;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  size = 'sm',
  className,
}: EmptyStateProps) {
  const s = SIZE_STYLES[size];
  // `compact` keeps its original tight padding + smaller icon override.
  const pad = compact ? 'py-4' : s.pad;
  const iconSize = compact ? 28 : s.icon;
  return (
    <div className={cn('text-center', pad, className)}>
      {Icon && (
        <Icon
          size={iconSize}
          className="mx-auto text-muted-foreground mb-2"
          aria-hidden="true"
        />
      )}
      <p className={cn('text-foreground', s.title)}>{title}</p>
      {description && (
        <p className={cn('text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed', s.desc)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {action && <ActionButton action={action} size={s.btn} />}
          {secondaryAction && (
            <ActionButton action={{ variant: 'outline', ...secondaryAction }} size={s.btn} />
          )}
        </div>
      )}
    </div>
  );
}
