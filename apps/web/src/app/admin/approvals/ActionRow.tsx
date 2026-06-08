// Action Center row — server-safe presentational component shared by the
// server-rendered list and the client island. No hooks.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import type { ActionItem, ActionSeverity } from '@/lib/admin/action-center/types';

const DOT: Record<ActionSeverity, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
};
const COUNT_TONE: Record<ActionSeverity, BadgeTone> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
  success: 'success',
};

export function ActionRow({ item }: { item: ActionItem }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/60 p-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[item.severity]}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-gray-500">{item.sourceLabel}</span>
          {item.count > 0 && <StatusBadge tone={COUNT_TONE[item.severity]}>{item.count}</StatusBadge>}
        </div>
        <p className="mt-0.5 text-sm font-medium text-gray-100">{item.title}</p>
        {item.detail && <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{item.detail}</p>}
      </div>
      <Link
        href={item.href}
        className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1 text-xs font-medium text-amber-400 hover:border-gray-600 hover:bg-gray-800"
      >
        {item.cta ?? 'Review'} <ArrowRight className="h-3 w-3" />
      </Link>
    </li>
  );
}
