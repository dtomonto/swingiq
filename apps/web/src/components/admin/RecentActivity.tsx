'use client';

// RecentActivity — shows the latest admin actions from the local-first
// audit log. Hydration-safe (renders a stable placeholder until mounted
// so server/client markup matches).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import { useAuditLog } from '@/lib/admin/stores/audit-log';
import { formatRelativeTime } from '@/lib/admin/format';
import type { AuditSeverity } from '@/lib/admin/audit';

const DOT: Record<AuditSeverity, string> = {
  info: 'bg-sky-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
};

export function RecentActivity({ limit = 6 }: { limit?: number }) {
  const [mounted, setMounted] = useState(false);
  const entries = useAuditLog((s) => s.entries);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <p className="text-sm text-gray-500">Loading recent activity…</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No admin actions recorded yet. Changes you make (toggling flags, editing content, moderating
        media) will appear here and in the{' '}
        <Link href="/admin/audit-log" className="text-amber-400 hover:underline">
          audit log
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.slice(0, limit).map((e) => (
        <li key={e.id} className="flex items-start gap-2.5 text-sm">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[e.severity]}`} />
          <span className="min-w-0 flex-1">
            <span className="text-gray-200">{e.summary}</span>
            <span className="ml-2 text-xs text-gray-600">
              {e.actor} · {formatRelativeTime(e.at)}
            </span>
          </span>
        </li>
      ))}
      <li className="pt-1">
        <Link href="/admin/audit-log" className="flex items-center gap-1 text-xs text-amber-400 hover:underline">
          <ScrollText className="h-3 w-3" /> View full audit log
        </Link>
      </li>
    </ul>
  );
}
