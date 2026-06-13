// ============================================================
// WS-07 — journey → skill-tree regression mapping tests
// ============================================================

import { regressedCategoriesFromJourney } from '../regression';
import type { JourneyDashboard } from '@/lib/athletic-journey/types';

const journey = (over: Partial<JourneyDashboard>): JourneyDashboard =>
  ({ regressionRisk: false, developmentGaps: [], ...over }) as unknown as JourneyDashboard;

describe('regressedCategoriesFromJourney', () => {
  it('returns [] for a null journey', () => {
    expect(regressedCategoriesFromJourney(null)).toEqual([]);
  });

  it('returns [] when there is no regression risk (no fabrication)', () => {
    expect(
      regressedCategoriesFromJourney(
        journey({ regressionRisk: false, developmentGaps: [{ category: 'consistency', text: 'x', basis: 'analyzed' }] }),
      ),
    ).toEqual([]);
  });

  it('returns the unique development-gap categories when at regression risk', () => {
    const out = regressedCategoriesFromJourney(
      journey({
        regressionRisk: true,
        developmentGaps: [
          { category: 'consistency', text: 'a', basis: 'analyzed' },
          { category: 'consistency', text: 'b', basis: 'measured' },
          { category: 'technique', text: 'c', basis: 'analyzed' },
        ],
      }),
    );
    expect(out.sort()).toEqual(['consistency', 'technique']);
  });
});
