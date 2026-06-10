// ============================================================
// Founding Journey — per-sport, layered (PURE)
// ------------------------------------------------------------
// Builds ONE sport's Founding journey from the per-sport founding challenge pool
// (lib/community/challenge-generator), grouped by feature and layered into a
// top-level milestone + its sub-challenges. A single-sport athlete completes
// enough of THEIR sport's challenges to qualify — we never reference another
// sport. Progress + completion are derived from real activity via each
// challenge's getProgress; eligibility = completed ≥ FOUNDING_JOURNEY_REQUIRED.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { ChallengeContext, ChallengeDefinition } from '@/lib/community/types';
import { foundingJourneyChallenges } from '@/lib/community/challenge-generator';
import { FOUNDING_JOURNEY_REQUIRED } from '@/lib/central-intelligence/config';

/** Where each feature family sends the athlete to make progress. */
const FEATURE_META: Record<string, { label: string; href: string }> = {
  'getting-started': { label: 'Get started', href: '/start' },
  'swing-analysis': { label: 'Swing analysis', href: '/start' },
  'diagnosis-drills': { label: 'Diagnosis & drills', href: '/diagnose' },
  consistency: { label: 'Consistency', href: '/sessions' },
  progress: { label: 'Progress', href: '/timeline' },
  'practice-plan': { label: 'Practice plan', href: '/drills' },
  mental: { label: 'Mental performance', href: '/mental' },
  equipment: { label: 'Equipment', href: '/bag' },
  'motion-lab': { label: 'Motion Lab', href: '/motion-lab' },
  'data-mastery': { label: 'Data mastery', href: '/settings/backup' },
};

export function featureMeta(feature: string): { label: string; href: string } {
  return FEATURE_META[feature] ?? { label: feature, href: '/dashboard' };
}

export interface JourneyChallengeView {
  challenge: ChallengeDefinition;
  progress: number; // 0–100
  done: boolean;
}

export interface JourneyFeatureGroup {
  feature: string;
  label: string;
  href: string;
  parent: JourneyChallengeView | null;
  children: JourneyChallengeView[];
  completed: number; // done challenges in this group
  total: number;
}

export interface SportJourney {
  sport: SportId;
  groups: JourneyFeatureGroup[];
  /** Founding challenges completed for this sport. */
  completed: number;
  /** How many must be completed to qualify. */
  required: number;
  /** Total founding challenges available for this sport. */
  total: number;
  /** completed ≥ required → eligible to claim a Founding number. */
  eligible: boolean;
  /** 0–100 toward the required count. */
  percent: number;
}

/** Build the per-sport founding journey from real activity (ctx). */
export function buildSportJourney(sport: SportId, ctx: ChallengeContext): SportJourney {
  const challenges = foundingJourneyChallenges(sport);
  const view = (c: ChallengeDefinition): JourneyChallengeView => {
    const progress = Math.max(0, Math.min(100, Math.round(c.getProgress(ctx))));
    return { challenge: c, progress, done: progress >= 100 };
  };

  // Group by feature, preserving generation order, with the tier-1 as parent.
  const order: string[] = [];
  const byFeature = new Map<string, JourneyChallengeView[]>();
  for (const c of challenges) {
    const f = c.feature ?? 'other';
    if (!byFeature.has(f)) {
      byFeature.set(f, []);
      order.push(f);
    }
    byFeature.get(f)!.push(view(c));
  }

  const groups: JourneyFeatureGroup[] = order.map((feature) => {
    const items = byFeature.get(feature)!;
    const parent = items.find((i) => (i.challenge.tier ?? 1) === 1) ?? items[0] ?? null;
    const children = items.filter((i) => i !== parent);
    const meta = featureMeta(feature);
    return {
      feature,
      label: meta.label,
      href: meta.href,
      parent,
      children,
      completed: items.filter((i) => i.done).length,
      total: items.length,
    };
  });

  const completed = challenges.filter((c) => view(c).done).length;
  const required = Math.min(FOUNDING_JOURNEY_REQUIRED, challenges.length);
  return {
    sport,
    groups,
    completed,
    required,
    total: challenges.length,
    eligible: completed >= required,
    percent: Math.min(100, Math.round((completed / Math.max(1, required)) * 100)),
  };
}
