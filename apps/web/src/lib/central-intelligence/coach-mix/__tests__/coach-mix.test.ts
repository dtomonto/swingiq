// ============================================================
// CentralIntelligenceOS — Coach Mix: tests
// Focus: the ETHICAL invariants first (disclaimer, admin-gating, name
// hiding, the approval gate), then the blend math + extraction safety.
// ============================================================

import type { RankedDrill } from '@/lib/drillmatch';
import {
  COACH_MIX_DISCLAIMER,
  MAX_USER_DRILLS,
  MIX_TOTAL_WEIGHT,
  SEED_COACH_PROFILES,
  SWINGVANTAGE_DEFAULT_COACH_ID,
  GANKAS_INSPIRED_PROFILE,
  BENDER_INSPIRED_PROFILE,
  RUBYSTAR_INSPIRED_PROFILE,
  normalizeMixWeights,
  resolveCoachMix,
  biasRankedDrills,
  buildCuratedRecommendation,
  extractConcepts,
  canLearnFrom,
  approveConcept,
  rejectConcept,
  approvedInfluencingConcepts,
  pendingConcepts,
  type CoachMix,
  type LearningSource,
} from '..';

function mix(entries: CoachMix['entries'], overrides: Partial<CoachMix> = {}): CoachMix {
  return {
    id: 'mix_test',
    name: 'Test Mix',
    description: '',
    sport: 'golf',
    entries,
    visibility: 'admin_only',
    userLabelMode: 'style_only',
    createdAt: '2026-06-08T00:00:00.000Z',
    ...overrides,
  };
}

function rankedDrill(id: string, families: string[], score: number, directHit = false): RankedDrill {
  return {
    drill: {
      id,
      sport: 'golf',
      faultIds: ['early_extension'],
      families,
      name: `Drill ${id}`,
      goal: `improve ${families[0] ?? 'motion'}`,
      steps: ['step'],
      repsOrDuration: '10 reps',
      estimatedMinutes: 10,
      skillLevel: 'intermediate',
      difficulty: 'intermediate',
      equipment: [],
      location: 'either',
      feelCue: 'feel athletic',
      coachingHint: 'search drills',
      youtubeSearchUrl: 'https://www.youtube.com/results',
      safetyNote: null,
      source: 'sport',
    },
    score,
    reasons: [],
    feedbackApplied: null,
    directHit,
  };
}

const source = (overrides: Partial<LearningSource> = {}): LearningSource => ({
  id: 'src_1',
  coachProfileId: GANKAS_INSPIRED_PROFILE.id,
  title: 'Approved note',
  urlOrUploadRef: 'internal://note',
  type: 'admin_notes',
  sport: 'golf',
  topic: 'shallowing',
  techniqueCategory: 'pivot-driven movement',
  drillCategory: 'rotation & sequencing',
  permissionStatus: 'public',
  copyrightStatus: 'cleared',
  approvedForLearning: true,
  createdAt: '2026-06-08T00:00:00.000Z',
  ...overrides,
});

// ── Ethics invariants ───────────────────────────────────────

describe('Coach Mix — ethical invariants', () => {
  it('every seed profile carries the exact required disclaimer', () => {
    for (const p of SEED_COACH_PROFILES) {
      expect(p.disclaimer).toBe(COACH_MIX_DISCLAIMER);
    }
  });

  it('every non-default seed starts admin-only and needs review', () => {
    const inspired = SEED_COACH_PROFILES.filter((p) => p.id !== SWINGVANTAGE_DEFAULT_COACH_ID);
    expect(inspired.length).toBe(6); // 4 golf coach-inspired + 2 house-authored (baseball, tennis)
    for (const p of inspired) {
      expect(p.visibility).toBe('admin_only');
      expect(p.needsReview).toBe(true);
    }
  });

  it('the RubyStar placeholder explicitly needs admin review before use', () => {
    expect(RUBYSTAR_INSPIRED_PROFILE.needsReview).toBe(true);
    expect(RUBYSTAR_INSPIRED_PROFILE.adminNote?.toLowerCase()).toContain('needs admin review');
  });

  it('coach names stay hidden by default and never appear in the recommendation "why"', () => {
    const strategy = resolveCoachMix(mix([{ coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 100 }]), SEED_COACH_PROFILES);
    expect(strategy.coachNamesVisible).toBe(false);
    const drills = biasRankedDrills([rankedDrill('a', ['rotation & sequencing'], 80)], strategy);
    for (const d of drills) {
      expect(d.why.toLowerCase()).not.toContain('gankas');
      expect(d.why).not.toContain(GANKAS_INSPIRED_PROFILE.publicHandle!);
    }
  });

  it('coach names only become visible with the explicit full_mix opt-in', () => {
    const styleOnly = resolveCoachMix(mix([{ coachProfileId: BENDER_INSPIRED_PROFILE.id, weightPct: 100 }]), SEED_COACH_PROFILES);
    expect(styleOnly.coachNamesVisible).toBe(false);
    const fullMix = resolveCoachMix(
      mix([{ coachProfileId: BENDER_INSPIRED_PROFILE.id, weightPct: 100 }], { userLabelMode: 'full_mix' }),
      SEED_COACH_PROFILES,
    );
    expect(fullMix.coachNamesVisible).toBe(true);
  });
});

// ── Blend math ──────────────────────────────────────────────

describe('Coach Mix — weight normalization', () => {
  it('an empty mix resolves to 100% house default', () => {
    const resolved = normalizeMixWeights(mix([]), SEED_COACH_PROFILES);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].profile.id).toBe(SWINGVANTAGE_DEFAULT_COACH_ID);
    expect(resolved[0].weightPct).toBe(MIX_TOTAL_WEIGHT);
  });

  it('a shortfall is topped up by the house default', () => {
    const resolved = normalizeMixWeights(
      mix([{ coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 60 }]),
      SEED_COACH_PROFILES,
    );
    const total = resolved.reduce((s, r) => s + r.weightPct, 0);
    expect(total).toBe(MIX_TOTAL_WEIGHT);
    expect(resolved.some((r) => r.profile.id === SWINGVANTAGE_DEFAULT_COACH_ID && r.weightPct === 40)).toBe(true);
  });

  it('over-allocation past 100 is scaled back down', () => {
    const resolved = normalizeMixWeights(
      mix([
        { coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 80 },
        { coachProfileId: BENDER_INSPIRED_PROFILE.id, weightPct: 80 },
      ]),
      SEED_COACH_PROFILES,
    );
    const total = resolved.reduce((s, r) => s + r.weightPct, 0);
    expect(total).toBeLessThanOrEqual(MIX_TOTAL_WEIGHT + 1); // rounding slack
  });

  it('sub-threshold weights are dropped', () => {
    const resolved = normalizeMixWeights(
      mix([{ coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 2 }]),
      SEED_COACH_PROFILES,
    );
    expect(resolved.every((r) => r.profile.id !== GANKAS_INSPIRED_PROFILE.id)).toBe(true);
  });
});

describe('Coach Mix — resolveCoachMix', () => {
  it('is deterministic and blends trait weights to ~1', () => {
    const m = mix([
      { coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 50 },
      { coachProfileId: BENDER_INSPIRED_PROFILE.id, weightPct: 50 },
    ]);
    const a = resolveCoachMix(m, SEED_COACH_PROFILES);
    const b = resolveCoachMix(m, SEED_COACH_PROFILES);
    expect(a).toEqual(b);
    const sum = Object.values(a.traitWeights).reduce((s, w) => s + (w ?? 0), 0);
    expect(sum).toBeGreaterThan(0.9);
    expect(sum).toBeLessThanOrEqual(1.01);
  });

  it('surfaces a user-safe influence summary naming the dominant style', () => {
    const strategy = resolveCoachMix(mix([{ coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 100 }]), SEED_COACH_PROFILES);
    expect(strategy.influenceSummary.toLowerCase()).toMatch(/rotational|athletic/);
    expect(strategy.influenceTags).toContain('Athletic Rotation');
  });
});

// ── Extraction + review gate ────────────────────────────────

describe('Coach Mix — extraction safety', () => {
  it('refuses to learn from un-approved or restricted sources', () => {
    expect(canLearnFrom(source({ approvedForLearning: false }))).toBe(false);
    expect(canLearnFrom(source({ permissionStatus: 'restricted' }))).toBe(false);
    expect(canLearnFrom(source({ permissionStatus: 'unknown' }))).toBe(false);
    expect(canLearnFrom(source({ copyrightStatus: 'restricted' }))).toBe(false);
    expect(extractConcepts(source({ approvedForLearning: false }))).toEqual([]);
  });

  it('extracts only PENDING concepts (nothing auto-published)', () => {
    const concepts = extractConcepts(source());
    expect(concepts.length).toBeGreaterThan(0);
    for (const c of concepts) expect(c.reviewStatus).toBe('pending');
  });

  it('grades public social posts as high IP-risk', () => {
    const concepts = extractConcepts(source({ type: 'public_social_post' }));
    expect(concepts.every((c) => c.ipRisk === 'high')).toBe(true);
  });
});

describe('Coach Mix — review queue gate', () => {
  it('only approved concepts may influence the product', () => {
    const [c1, c2, c3] = extractConcepts(source());
    const approved = approveConcept(c1);
    const rejected = rejectConcept(c2);
    const all = [approved, rejected, c3]; // c3 still pending
    const influencing = approvedInfluencingConcepts(all);
    expect(influencing).toHaveLength(1);
    expect(influencing[0].id).toBe(approved.id);
    expect(pendingConcepts(all).map((c) => c.id)).toContain(c3.id);
  });
});

// ── Recommendation integration ──────────────────────────────

describe('Coach Mix — recommendation integration', () => {
  const strategy = resolveCoachMix(mix([{ coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 100 }]), SEED_COACH_PROFILES);

  it('never returns more than the user-drill cap and sorts by coach score', () => {
    const ranked = [
      rankedDrill('a', ['putting'], 70),
      rankedDrill('b', ['rotation & sequencing'], 60),
      rankedDrill('c', ['tempo'], 50),
      rankedDrill('d', ['ground force'], 55),
      rankedDrill('e', ['grip'], 40),
      rankedDrill('f', ['stance'], 30),
    ];
    const out = biasRankedDrills(ranked, strategy);
    expect(out.length).toBeLessThanOrEqual(MAX_USER_DRILLS);
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].coachScore).toBeGreaterThanOrEqual(out[i].coachScore);
    }
  });

  it('boosts drills in favored categories above their base score', () => {
    const rotation = rankedDrill('rot', ['rotation & sequencing'], 60);
    const [out] = biasRankedDrills([rotation], strategy);
    expect(out.influenceMultiplier).toBeGreaterThan(1);
    expect(out.coachScore).toBeGreaterThan(out.baseScore);
  });

  it('builds a focused, 7-part curated recommendation', () => {
    const rec = buildCuratedRecommendation(
      { topIssue: 'Early extension', whyItMatters: 'It costs you center contact.' },
      strategy,
      [rankedDrill('rot', ['rotation & sequencing'], 60)],
    );
    expect(rec.topIssue).toBe('Early extension');
    expect(rec.firstDrill).not.toBeNull();
    expect(rec.howToRetest.length).toBeGreaterThan(0);
    expect(rec.influenceSummary).toBe(strategy.influenceSummary);
    expect(rec.coachNamesVisible).toBe(false);
  });
});
