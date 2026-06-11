// ============================================================
// /admin/sports — Sports Configuration Center
// ------------------------------------------------------------
// Reads the authoritative sport registry from @swingiq/core. This is
// the single place to see how every sport's analysis is set up:
// phases, benchmarks, camera guidance and evidence notes.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';

export const metadata: Metadata = { title: 'Sports | Admin', robots: 'noindex, nofollow' };

export default function AdminSportsPage() {
  const sports = ALL_SPORTS_INCLUDING_GOLF;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Sports Configuration"
        icon={Trophy}
        description="Every sport SwingVantage supports and how its analysis is configured — phases, benchmarks, camera guidance and the evidence behind them. Click a sport to see the full setup."
        actions={<StatusBadge tone="info">{sports.length} sports</StatusBadge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sports.map((s) => (
          <Link
            key={s.id}
            href={`/admin/sports/${s.id}`}
            className="group rounded-xl border border-border bg-card p-4 hover:border-border"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl" aria-hidden>{s.emoji}</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-muted-foreground" />
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{s.name}</p>
            <p className="text-xs text-link/80">{s.tagline}</p>
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
          </Link>
        ))}
      </div>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The control reference for each sport. It
          shows the swing phases the AI looks for, the benchmark values it compares against, and the camera
          guidance shown to users.
        </p>
        <p>
          <strong className="text-foreground">How configuration works today.</strong> Sport analysis is defined
          in code (the <code>@swingiq/core</code> sport registry) so it can be versioned and tested. This
          screen is the authoritative, plain-English view of that setup; deeper editing happens in the
          registry. Adding a brand-new sport is intentionally a one-place change there.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Open a sport to review its phases and
          benchmark version, and confirm the evidence note reads accurately for users.
        </p>
      </HelpPanel>
    </div>
  );
}
