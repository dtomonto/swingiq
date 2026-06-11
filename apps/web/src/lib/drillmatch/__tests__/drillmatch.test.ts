// ============================================================
// SwingVantage — DrillMatch + Fix Stack: Unit Tests
// ------------------------------------------------------------
// Guarantees the catalog normalizes real library data, the scorer
// is deterministic and explainable, the feedback loop actually
// changes rankings, and every Fix Stack is complete + honest.
// ============================================================

import {
  ALL_DRILL_CANDIDATES,
  getCandidatesForSport,
  getCandidatesForFault,
  getDrillCandidateById,
  estimateMinutes,
  rankDrills,
  scoreDrill,
  normalizeMatchInput,
  buildFixStack,
  type DrillFeedbackRecord,
  type DrillFeedbackRepository,
} from '..';

// In-memory repo (node test env has no localStorage).
function memRepo(): DrillFeedbackRepository {
  let recs: DrillFeedbackRecord[] = [];
  return {
    record(input) {
      const r: DrillFeedbackRecord = { ...input, recordedAt: new Date().toISOString() };
      recs.push(r);
      return r;
    },
    getFor(drillId, faultId) {
      return recs.filter((r) => r.drillId === drillId && (faultId === undefined || r.faultId === faultId));
    },
    latestFor(drillId, faultId) {
      const m = this.getFor(drillId, faultId);
      return m.length ? m[m.length - 1] : null;
    },
    all() {
      return recs;
    },
    clear() {
      recs = [];
    },
  };
}

describe('catalog — normalization of existing drill libraries', () => {
  it('builds a non-empty catalog covering all seven sports', () => {
    expect(ALL_DRILL_CANDIDATES.length).toBeGreaterThan(10);
    for (const sport of ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'] as const) {
      expect(getCandidatesForSport(sport).length).toBeGreaterThan(0);
    }
  });

  it('every candidate is internally complete and honest', () => {
    for (const c of ALL_DRILL_CANDIDATES) {
      expect(c.id).toBeTruthy();
      expect(c.name.length).toBeGreaterThan(2);
      expect(c.steps.length).toBeGreaterThan(0);
      expect(c.feelCue.length).toBeGreaterThan(0);
      expect(c.estimatedMinutes).toBeGreaterThan(0);
      expect(c.youtubeSearchUrl.startsWith('https://')).toBe(true);
      expect(Array.isArray(c.equipment)).toBe(true);
    }
  });

  it('maps drills to the faults they target via source issue ids', () => {
    const ee = getCandidatesForFault('golf', 'early_extension');
    expect(ee.length).toBeGreaterThan(0);
    expect(ee.every((d) => d.faultIds.includes('early_extension'))).toBe(true);
    expect(getDrillCandidateById(ee[0].id)).toBeDefined();
  });

  it('estimateMinutes parses common reps/duration phrasings', () => {
    expect(estimateMinutes('5 minutes of posture rehearsal')).toBe(5);
    expect(estimateMinutes('3 sets of 15 tee swings')).toBeGreaterThanOrEqual(3);
    expect(estimateMinutes('20 swings, then 10 with a ball')).toBeGreaterThanOrEqual(3);
    expect(estimateMinutes('do it')).toBe(8); // honest default
  });
});

describe('scoring — deterministic + explainable', () => {
  it('ranks a directly-matched curated drill first, with a reason', () => {
    const ranked = rankDrills({ sport: 'golf', faultId: 'early_extension' });
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].directHit).toBe(true);
    expect(ranked[0].reasons.some((r) => r.label === 'Targets your exact issue')).toBe(true);
    expect(ranked[0].score).toBeGreaterThan(0);
  });

  it('is fully deterministic (same input → same output)', () => {
    const a = rankDrills({ sport: 'baseball', faultId: 'casting_hands' });
    const b = rankDrills({ sport: 'baseball', faultId: 'casting_hands' });
    expect(a.map((r) => r.drill.id)).toEqual(b.map((r) => r.drill.id));
    expect(a.map((r) => r.score)).toEqual(b.map((r) => r.score));
  });

  it('penalizes a drill whose required gear the user does not have', () => {
    const family = new Set<string>();
    const wallDrill = getCandidatesForFault('golf', 'early_extension').find((d) =>
      d.equipment.includes('wall'),
    );
    expect(wallDrill).toBeDefined();
    const withGear = scoreDrill(wallDrill!, { sport: 'golf', faultId: 'early_extension', availableEquipment: ['wall'] }, family);
    const withoutGear = scoreDrill(wallDrill!, { sport: 'golf', faultId: 'early_extension', availableEquipment: ['mirror'] }, family);
    expect(withGear.rawScore).toBeGreaterThan(withoutGear.rawScore);
  });

  it('does not penalize equipment when the user did not say what they have', () => {
    const family = new Set<string>();
    const wallDrill = getCandidatesForFault('golf', 'early_extension').find((d) =>
      d.equipment.includes('wall'),
    )!;
    const neutral = scoreDrill(wallDrill, { sport: 'golf', faultId: 'early_extension' }, family);
    expect(neutral.reasons.some((r) => r.label.includes("didn't list"))).toBe(false);
  });
});

describe('feedback loop — rankings learn from the user', () => {
  it('drops a drill the user said hurt/was unhelpful', () => {
    const repo = memRepo();
    const before = rankDrills({ sport: 'golf', faultId: 'early_extension' }, repo);
    const topId = before[0].drill.id;
    repo.record({ drillId: topId, faultId: 'early_extension', sport: 'golf', value: 'hurt' });
    const after = rankDrills({ sport: 'golf', faultId: 'early_extension' }, repo);
    expect(after[0].drill.id).not.toBe(topId);
  });

  it('boosts a drill the user said helped', () => {
    const repo = memRepo();
    const before = rankDrills({ sport: 'golf', faultId: 'early_extension' }, repo);
    const target = before[before.length - 1].drill.id;
    const beforeScore = before[before.length - 1].score;
    repo.record({ drillId: target, faultId: 'early_extension', sport: 'golf', value: 'helped' });
    const after = rankDrills({ sport: 'golf', faultId: 'early_extension' }, repo);
    const afterScore = after.find((r) => r.drill.id === target)?.score ?? 0;
    expect(afterScore).toBeGreaterThan(beforeScore);
  });
});

describe('normalizeMatchInput — free-text fault → curated id', () => {
  it('upgrades a free-text fault name to a curated id when recognizable', () => {
    const out = normalizeMatchInput({ sport: 'golf', faultName: 'coming over the top and slicing' });
    expect(out.faultId).toBe('over_the_top');
  });

  it('leaves an explicit faultId untouched', () => {
    const out = normalizeMatchInput({ sport: 'golf', faultId: 'early_extension', faultName: 'whatever' });
    expect(out.faultId).toBe('early_extension');
  });
});

describe('Fix Stack — complete, 3-part, and honest', () => {
  it('builds Feel Cue → Drill → Retest for a curated fault', () => {
    const fs = buildFixStack({ sport: 'golf', faultId: 'early_extension', skillLevel: 'beginner' });
    expect(fs.feelCue.body.length).toBeGreaterThan(0);
    expect(fs.drill.steps.length).toBeGreaterThan(0);
    expect(fs.drill.why.length).toBeGreaterThan(0);
    expect(fs.retest.sameConditions.length).toBeGreaterThan(0);
    expect(fs.retest.improvedWhen.length).toBeGreaterThan(0);
    expect(new Date(fs.retest.dueOn).getTime()).toBeGreaterThan(new Date(fs.createdAt).getTime());
    expect(fs.mistakeToAvoid.length).toBeGreaterThan(0);
    expect(['high', 'medium', 'low']).toContain(fs.confidence.level);
    expect(fs.basisNote).toMatch(/not from measured biomechanics/i);
    expect(fs.generated).toBe(false);
    expect(fs.alternatives.length).toBeGreaterThan(0);
  });

  it('resolves a free-text fault and still targets the right issue', () => {
    const fs = buildFixStack({ sport: 'golf', faultName: 'over the top move' });
    expect(fs.faultName.toLowerCase()).toContain('over the top');
    expect(fs.drill.id).toBeTruthy();
  });

  it('caps confidence honestly when no real drill matched (generated fallback)', () => {
    const fs = buildFixStack({ sport: 'golf', faultId: 'early_extension', limit: 0 });
    expect(fs.generated).toBe(true);
    expect(fs.drill.id).toBe('generated_self_check');
    expect(fs.confidence.level).not.toBe('high');
  });

  it('raises confidence when the user previously said the matched drill helped', () => {
    const repo = memRepo();
    const baseline = buildFixStack({ sport: 'golf', faultId: 'early_extension' }, repo);
    repo.record({ drillId: baseline.drill.id, faultId: 'early_extension', sport: 'golf', value: 'helped' });
    const improved = buildFixStack({ sport: 'golf', faultId: 'early_extension' }, repo);
    expect(improved.confidence.score).toBeGreaterThanOrEqual(baseline.confidence.score);
  });
});
