// PageHeader — title + plain-English explainer + primary actions.
// Server-safe (no hooks). Every admin page uses this so the "what is
// this / why it matters" requirement is satisfied consistently.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  /** Interpreted "so what" — what this section means, not just what it does. */
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  /** Breadcrumb trail, rendered above the title on nested pages. */
  breadcrumb?: ReactNode;
  /** Status chip rendered next to the title (e.g. a severity StatusBadge). */
  badge?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  title, description, icon: Icon, actions, breadcrumb, badge, children,
}: PageHeaderProps) {
  return (
    <header className="mb-6">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-0.5 shrink-0 rounded-lg border border-primary/25 bg-primary/[0.08] p-2 text-link">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              {badge}
            </div>
            {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
