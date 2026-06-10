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
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** Tighter padding for use inside small cards/side panels. */
  compact?: boolean;
  className?: string;
}

function ActionButton({ action }: { action: EmptyStateAction }) {
  const button = (
    <Button
      size="sm"
      variant={action.variant ?? 'primary'}
      onClick={action.onClick}
    >
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
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center', compact ? 'py-4' : 'py-8', className)}>
      {Icon && (
        <Icon
          size={compact ? 28 : 36}
          className="mx-auto text-muted-foreground mb-2"
          aria-hidden="true"
        />
      )}
      <p className="text-foreground text-sm font-semibold">{title}</p>
      {description && (
        <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {action && <ActionButton action={action} />}
          {secondaryAction && (
            <ActionButton action={{ variant: 'outline', ...secondaryAction }} />
          )}
        </div>
      )}
    </div>
  );
}
