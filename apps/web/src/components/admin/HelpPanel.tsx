// HelpPanel — the beginner-friendly education layer on every page.
// Uses native <details> so it works without client JS (server-safe).

import type { ReactNode } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export interface HelpPanelProps {
  title?: string;
  children: ReactNode;
}

export function HelpPanel({ title = 'What is this & what to do', children }: HelpPanelProps) {
  return (
    <details className="group rounded-xl border border-border bg-card/60 p-4 [&_a]:text-link [&_a:hover]:underline">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
        <span className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-link" />
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}
