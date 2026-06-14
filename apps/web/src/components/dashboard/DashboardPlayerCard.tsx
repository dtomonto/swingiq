'use client';

// ============================================================
// WS-02 — Dashboard player card. A premium, video-game-style player-
// selection card: archetype "class", sport identity, level/stage, confidence,
// momentum, top strength, current focus, and a skill-tree snapshot. Clean by
// default, expandable for depth. Built from composed intelligence (WS-04) +
// skill tree (WS-03); honest when data is thin.
// ============================================================

import { useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { getSportConfig } from '@swingiq/core';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSwingVantageStore } from '@/store';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { usePlayerProfileIntelligence } from '@/lib/player-profile/usePlayerProfileIntelligence';
import { useSkillTree } from '@/lib/skill-tree/useSkillTree';
import { initialsFrom } from '@/lib/friends/service';

const SPORT_FALLBACK: Record<string, { emoji: string; accent: string; name: string }> = {
  golf: { emoji: '⛳', accent: '#16a34a', name: 'Golf' },
};

export function DashboardPlayerCard({ sport }: { sport: SportId }) {
  const intel = usePlayerProfileIntelligence(sport);
  const tree = useSkillTree(sport);
  const profile = useSwingVantageStore((s) => s.profile);

  const cfg = getSportConfig(sport);
  const visual = {
    emoji: cfg?.emoji ?? SPORT_FALLBACK[sport]?.emoji ?? '🏅',
    accent: cfg?.accent_hex ?? SPORT_FALLBACK[sport]?.accent ?? 'var(--primary)',
    name: cfg?.name ?? SPORT_FALLBACK[sport]?.name ?? 'Athlete',
  };
  const name = profile?.name?.trim() || 'Your Player Card';

  useEffect(() => {
    track(ANALYTICS_EVENTS.DASHBOARD_PLAYER_CARD_VIEWED, {
      sport,
      skill_level: profile?.skill_level ?? '',
      archetype: intel.archetype?.label ?? 'none',
      confidence_score: intel.confidenceScore ?? 0,
    });
  }, [sport, intel.archetype?.label, intel.confidenceScore, profile?.skill_level]);

  const mastered = (tree?.nodes ?? []).filter((n) => n.status === 'mastered' || n.status === 'improving').length;
  const toWork = (tree?.nodes ?? []).filter((n) => n.status === 'needs_attention' || n.status === 'regressed').length;
  const confidencePct = intel.confidenceScore !== null ? Math.round(intel.confidenceScore * 100) : null;

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Accent banner — sport identity */}
      <div className="h-1.5 w-full" style={{ backgroundColor: visual.accent }} aria-hidden="true" />
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
            style={{ backgroundColor: visual.accent }}
            aria-hidden="true"
          >
            {profile?.name ? initialsFrom(profile.name, null) : visual.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-bold text-foreground">{name}</p>
              <span className="text-base" aria-hidden="true">{visual.emoji}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{visual.name}</span>
              {intel.archetype && (
                <Badge variant="info">
                  <Sparkles size={11} className="mr-1 inline" aria-hidden="true" />
                  {intel.archetype.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Stage" value={intel.stage?.name ?? '—'} />
          <Stat label="Confidence" value={confidencePct !== null ? `${confidencePct}%` : '—'} />
          <Stat label="Momentum" value={intel.momentumBand === 'unknown' ? '—' : titleCase(intel.momentumBand)} />
        </div>

        {/* Strength + focus */}
        <div className="grid gap-2 sm:grid-cols-2">
          <MiniBlock label="Top strength" value={intel.topStrengths[0]?.label ?? 'Building…'} />
          <MiniBlock label="Current focus" value={intel.currentFocus?.label ?? 'Keep logging data'} />
        </div>

        {/* Skill tree snapshot + link to depth */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Skill tree:{' '}
            <span className="font-medium text-foreground">{mastered} strong</span> ·{' '}
            <span className="font-medium text-foreground">{toWork} to work on</span>
          </p>
          <Link href="/profile" className="inline-flex items-center text-xs font-medium text-[var(--primary)]">
            View <ChevronRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border py-2">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
