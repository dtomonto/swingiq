import { CHALLENGES } from '../challenges';
import {
  generateSportChallenges,
  foundingJourneyChallenges,
  foundingChallengeCountForSport,
  JOURNEY_SPORTS,
} from '../challenge-generator';
import type { ChallengeContext } from '../types';

const generated = generateSportChallenges();
const founding = foundingJourneyChallenges();

const EMPTY_CTX: ChallengeContext = {
  sessions: [],
  videoAnalyses: [],
  lastExportAt: null,
  exportCount: 0,
  joinedAt: '2026-01-01T00:00:00Z',
};

describe('per-sport challenge library', () => {
  it('the system has at least 250 challenges overall', () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(250);
  });

  it('the founding journey has at least 100 relevant challenges', () => {
    expect(founding.length).toBeGreaterThanOrEqual(100);
  });

  it('every sport has a self-sufficient founding journey (single-sport players can earn the badge)', () => {
    for (const s of JOURNEY_SPORTS) {
      expect(foundingChallengeCountForSport(s.id)).toBeGreaterThanOrEqual(10);
    }
  });

  it('all challenge ids are unique', () => {
    const ids = CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every generated challenge is scoped to exactly one sport (never cross-sport)', () => {
    for (const c of generated) {
      expect(JOURNEY_SPORTS.some((s) => s.id === c.sport)).toBe(true);
    }
  });

  it('every founding challenge is sport-scoped (not a global "all" task)', () => {
    for (const c of founding) expect(c.sport).not.toBe('all');
  });

  it('challenges are layered: every sub-challenge references an existing top-level parent of the same sport + feature', () => {
    const byId = new Map(generated.map((c) => [c.id, c]));
    const children = generated.filter((c) => (c.tier ?? 1) >= 2);
    expect(children.length).toBeGreaterThan(0);
    for (const child of children) {
      expect(child.parentId).toBeTruthy();
      const parent = byId.get(child.parentId!);
      expect(parent).toBeDefined();
      expect(parent!.tier).toBe(1);
      expect(parent!.sport).toBe(child.sport);
      expect(parent!.feature).toBe(child.feature);
    }
  });

  it('progress is grounded in real activity — 0 when nothing is logged, 0..100 always', () => {
    for (const c of generated) {
      const p = c.getProgress(EMPTY_CTX);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
    expect(generated[0].getProgress(EMPTY_CTX)).toBe(0);
  });
});
