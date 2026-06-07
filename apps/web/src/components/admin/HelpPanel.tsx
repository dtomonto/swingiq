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
    <details className="group rounded-xl border border-gray-800 bg-gray-900/60 p-4 [&_a]:text-amber-400 [&_a:hover]:underline">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-gray-200">
        <span className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-amber-400" />
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-gray-400">{children}</div>
    </details>
  );
}
