// Drill Library aggregation — pure unit tests.
// Confirms both catalogs normalize into one shape, stats reconcile,
// and cross-catalog duplicate names are detected.

import {
  aggregateDrillLibrary,
  groupDrillsBySport,
  normalizeContentDrill,
  normalizeCandidateDrill,
  type DrillContentLike,
  type DrillCandidateLike,
} from '../drill-library/aggregate';

const content: DrillContentLike[] = [
  {
    id: 'golf-gate', sport: 'golf', title: 'Gate Drill', category: 'Club Path',
    difficulty: 'beginner', duration: '10–15 minutes', targetFault: 'Out-to-in path', steps: ['a', 'b'],
  },
  {
    id: 'tennis-shadow', sport: 'tennis', title: 'Shadow Swing', category: 'Form',
    difficulty: 'beginner', duration: '5 minutes', targetFault: 'Late prep', steps: ['a'],
  },
];

const candidates: DrillCandidateLike[] = [
  {
    id: 'golf-cand-1', sport: 'golf', name: 'Headcover Gate', families: ['club_path'],
    faultIds: ['slice'], goal: 'Train in-to-out path', repsOrDuration: '20 reps',
    difficulty: 'intermediate', equipment: ['headcover'], steps: ['x'], safetyNote: null,
  },
  {
    id: 'golf-cand-2', sport: 'golf', name: 'Gate Drill', families: [],
    faultIds: [], goal: 'Path control', repsOrDuration: '15 reps',
    difficulty: 'advanced', equipment: [], steps: ['y'], safetyNote: 'Stop if wrist pain.',
  },
];

describe('normalizers', () => {
  it('maps a content drill', () => {
    const d = normalizeContentDrill(content[0]);
    expect(d.source).toBe('drills-content');
    expect(d.name).toBe('Gate Drill');
    expect(d.equipment).toEqual([]);
    expect(d.hasSteps).toBe(true);
  });

  it('maps a candidate drill, deriving category and fault', () => {
    const d = normalizeCandidateDrill(candidates[0]);
    expect(d.source).toBe('drillmatch');
    expect(d.category).toBe('Club Path'); // titleCased from family
    expect(d.targetFault).toBe('slice');
    expect(d.equipment).toEqual(['headcover']);
  });
});

describe('aggregateDrillLibrary', () => {
  const lib = aggregateDrillLibrary(content, candidates);

  it('combines both catalogs', () => {
    expect(lib.stats.total).toBe(4);
    expect(lib.stats.bySource['drills-content']).toBe(2);
    expect(lib.stats.bySource.drillmatch).toBe(2);
  });

  it('counts by sport and difficulty reconcile with the total', () => {
    const sportSum = Object.values(lib.stats.bySport).reduce((a, b) => a + b, 0);
    const diffSum = Object.values(lib.stats.byDifficulty).reduce((a, b) => a + b, 0);
    expect(sportSum).toBe(lib.stats.total);
    expect(diffSum).toBe(lib.stats.total);
    expect(lib.stats.bySport.golf).toBe(3);
    expect(lib.stats.sports).toBe(2);
  });

  it('tracks equipment and safety coverage', () => {
    expect(lib.stats.withEquipment).toBe(1);
    expect(lib.stats.withSafety).toBe(1);
  });

  it('detects cross-catalog duplicate names', () => {
    // "Gate Drill" exists in both content and a candidate.
    const dup = lib.duplicateNames.find((d) => d.name === 'gate drill');
    expect(dup).toBeDefined();
    expect(dup!.ids.sort()).toEqual(['golf-cand-2', 'golf-gate']);
  });

  it('is sorted by sport then name', () => {
    const order = lib.drills.map((d) => `${d.sport}:${d.name}`);
    expect(order).toEqual([...order].sort());
  });
});

describe('groupDrillsBySport', () => {
  it('groups by sport in descending count order', () => {
    const groups = groupDrillsBySport(aggregateDrillLibrary(content, candidates));
    expect(groups[0].sport).toBe('golf'); // 3 > 1
    expect(groups[0].drills.length).toBe(3);
    expect(groups.flatMap((g) => g.drills).length).toBe(4);
  });
});
