// PageHeader — title + plain-English explainer + primary actions.
// Server-safe (no hooks). Every admin page uses this so the "what is
// this / why it matters" requirement is satisfied consistently.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  /** Plain-English "what this section does / why it matters". */
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions, children }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-0.5 shrink-0 rounded-lg bg-gray-800 p-2 text-amber-400">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-100">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-gray-400">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
