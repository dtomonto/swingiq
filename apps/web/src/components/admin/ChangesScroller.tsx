'use client';

// ============================================================
// ChangesScroller — the admin dashboard "What changed" ticker.
// Merges shipped commits (committed 30-day snapshot) with admin actions
// (local-first audit log) into one newest-first feed. Entries auto-prune
// at 30 days (lib/admin/changes). Hydration-safe: renders the stable
// commit feed on first paint, then folds in the client-only audit entries
// after mount. The list scrolls only on manual user input (no auto-scroll).
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, ScrollText } from 'lucide-react';
import { useAuditLog } from '@/lib/admin/stores/audit-log';
import { formatRelativeTime } from '@/lib/admin/format';
import { buildChangesFeed, CHANGES_WINDOW_DAYS, type ChangeEntry, type CommitChange } from '@/lib/admin/changes';
import commitData from '@/data/changes-feed.generated.json';

const COMMITS = commitData as CommitChange[];

const DOT: Record<ChangeEntry['kind'], string> = {
  ship: 'bg-primary',
  admin: 'bg-warning',
};
const KIND_LABEL: Record<ChangeEntry['kind'], string> = {
  ship: 'Shipped',
  admin: 'Admin',
};

function Row({ e }: { e: ChangeEntry }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5 text-sm">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[e.kind]}`} />
      <span className="min-w-0 flex-1">
        <span className="text-foreground">{e.summary}</span>
        <span className="ml-2 text-xs text-muted-foreground/70">
          {KIND_LABEL[e.kind]}
          {e.meta ? ` · ${e.meta}` : ''} · {formatRelativeTime(e.at)}
        </span>
      </span>
    </li>
  );
}

export function ChangesScroller({ limit = 24 }: { limit?: number }) {
  const [mounted, setMounted] = useState(false);
  const auditEntries = useAuditLog((s) => s.entries);
  useEffect(() => setMounted(true), []);

  // First paint (SSR + pre-mount) = commits only, so markup is stable and
  // hydration matches; audit entries fold in once mounted.
  const feed = buildChangesFeed({
    commits: COMMITS,
    auditEntries: mounted ? auditEntries : [],
    limit,
  });

  if (feed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No changes in the last {CHANGES_WINDOW_DAYS} days yet.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Megaphone className="h-3.5 w-3.5" /> What changed · last {CHANGES_WINDOW_DAYS} days
        </span>
        <Link
          href="/dev-updates"
          className="flex items-center gap-1 text-xs text-link hover:underline"
        >
          <ScrollText className="h-3 w-3" /> Full changelog
        </Link>
      </div>

      <div
        className="sv-changes-window relative h-56 overflow-hidden rounded-lg border border-border/60 bg-card/40 px-3"
        aria-label="Recent changes"
      >
        <ul className="h-full overflow-y-auto">
          {feed.map((e) => (
            <Row key={e.id} e={e} />
          ))}
        </ul>
        {/* top/bottom fade so rows ease in/out of the window */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-card/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card/80 to-transparent" />
      </div>
    </div>
  );
}
