// ============================================================
// WS-07 — Journey → skill-tree regression signal
// ------------------------------------------------------------
// Maps the athletic-journey regression state onto the skill-tree node graph
// so `regressed` nodes light up from REAL data instead of staying dark.
// Honest heuristic (no fabrication): only when the journey flags a regression
// risk do we treat the current development-gap categories as regressing — we
// never invent a per-node downtrend we can't evidence.
// ============================================================

import type { JourneyDashboard, ClassificationCategory } from '@/lib/athletic-journey/types';

export function regressedCategoriesFromJourney(
  journey: JourneyDashboard | null,
): ClassificationCategory[] {
  if (!journey || !journey.regressionRisk) return [];
  return Array.from(new Set(journey.developmentGaps.map((g) => g.category)));
}
