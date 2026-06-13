'use client';

// ============================================================
// WS-03 — useSkillTree: composes the athletic-journey branch state into the
// skill-tree node graph. Returns null for sports whose journey isn't live
// yet (the UI shows an "in development" state).
// ============================================================

import { useMemo } from 'react';
import type { SportId } from '@swingiq/core';
import { useAthleticJourney } from '@/lib/athletic-journey/adapters/useAthleticJourney';
import { buildSkillTree, type SkillTree } from './generate';
import { regressedCategoriesFromJourney } from './regression';

export function useSkillTree(sport: SportId): SkillTree | null {
  const journey = useAthleticJourney(sport);
  return useMemo(() => {
    if (!journey) return null;
    return buildSkillTree({
      sport,
      availability: journey.availability,
      branches: journey.branches,
      categoryScores: journey.categoryScores,
      regressedCategories: regressedCategoriesFromJourney(journey),
    });
  }, [journey, sport]);
}
