'use client';

// ============================================================
// SwingIQ — Next Badge Nudge ("Almost there")
// ------------------------------------------------------------
// Goal-gradient effect: surfaces the single closest-to-earned
// achievement so the user can see what they're a step away from.
// Pairs with the earn-moment celebration (see lib/celebrations) to
// close the loop: see what's next -> earn it -> get celebrated.
//
// Selection logic lives in lib/community/nextBadge (pure + tested);
// this component only renders it.
// ============================================================

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useSwingIQStore } from '@/store';
import { pickNextBadge } from '@/lib/community/next-badge';
import type { AchievementContext } from '@/lib/community/types';

export function NextBadgeNudge() {
  const sessions = useSwingIQStore((s) => s.sessions);
  const videoAnalyses = useSwingIQStore((s) => s.video_analyses);
  const training = useSwingIQStore((s) => s.training);
  const community = useSwingIQStore((s) => s.community);

  const ctx: AchievementContext = {
    sessions,
    videoAnalyses,
    training,
    lastExportAt: community.lastExportAt,
    exportCount: community.exportCount,
    challengesCompleted: community.challengesCompleted,
  };

  const best = pickNextBadge(ctx);
  if (!best) return null;

  const remaining = Math.max(1, best.max - best.progress);
  return (
    <Link
      href="/community/badges"
      aria-label={`Almost there: ${best.name}, ${remaining} to go`}
      className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
    >
      <span className="text-2xl leading-none" aria-hidden="true">{best.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            Almost there: {best.name}
          </p>
          <span className="shrink-0 text-xs font-medium text-primary">{remaining} to go</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, best.percent)}%` }}
          />
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
