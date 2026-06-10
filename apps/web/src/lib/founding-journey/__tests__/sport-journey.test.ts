import { buildSportJourney, featureMeta } from '../sport-journey';
import { FOUNDING_JOURNEY_REQUIRED } from '@/lib/central-intelligence/config';
import type { ChallengeContext } from '@/lib/community/types';

const EMPTY: ChallengeContext = { sessions: [], videoAnalyses: [], lastExportAt: null, exportCount: 0, joinedAt: '' };

describe('buildSportJourney (per-sport, layered)', () => {
  it('builds a sport-scoped journey grouped + layered', () => {
    const j = buildSportJourney('softball_slow', EMPTY);
    expect(j.sport).toBe('softball_slow');
    expect(j.groups.length).toBeGreaterThan(0);
    expect(j.total).toBeGreaterThanOrEqual(FOUNDING_JOURNEY_REQUIRED);
    for (const g of j.groups) expect(g.parent).not.toBeNull();
    expect(j.groups.some((g) => g.children.length > 0)).toBe(true);
  });

  it('is 0% with no activity (grounded in real signals)', () => {
    const j = buildSportJourney('golf', EMPTY);
    expect(j.completed).toBe(0);
    expect(j.eligible).toBe(false);
    expect(j.percent).toBe(0);
  });

  it('counts real activity and flips eligible at the threshold', () => {
    const ctx: ChallengeContext = {
      sessions: Array.from({ length: 12 }, () => ({ sport: 'golf', diagnoses: [{}] })) as unknown as ChallengeContext['sessions'],
      videoAnalyses: Array.from({ length: 12 }, () => ({ sport: 'golf' })) as unknown as ChallengeContext['videoAnalyses'],
      lastExportAt: null,
      exportCount: 0,
      joinedAt: '',
    };
    const j = buildSportJourney('golf', ctx);
    expect(j.completed).toBeGreaterThanOrEqual(FOUNDING_JOURNEY_REQUIRED);
    expect(j.eligible).toBe(true);
  });

  it('never references another sport — every challenge is the chosen sport', () => {
    const j = buildSportJourney('tennis', EMPTY);
    const all = j.groups.flatMap((g) => [g.parent, ...g.children]).filter(Boolean);
    for (const v of all) expect(v!.challenge.sport).toBe('tennis');
  });

  it('featureMeta maps a feature to a real route', () => {
    expect(featureMeta('swing-analysis').href).toBe('/start');
    expect(featureMeta('diagnosis-drills').href).toBe('/diagnose');
  });
});
