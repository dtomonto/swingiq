// ============================================================
// Coach Mix — Phase 3: trends, video pipeline, AI seam
// ============================================================

import {
  SEED_COACH_PROFILES,
  GANKAS_INSPIRED_PROFILE,
  resolveCoachMix,
  analyzeTrends,
  sampleTrendInput,
  buildVideoConcept,
  extractConcepts,
  approveConcept,
  enhanceConceptRewrites,
  type CoachMix,
  type LearningSource,
  type TrendInput,
  type ConceptRewriter,
} from '..';

const strategy = resolveCoachMix(
  {
    id: 'm', name: 'Athletic', description: '', sport: 'golf',
    entries: [{ coachProfileId: GANKAS_INSPIRED_PROFILE.id, weightPct: 100 }],
    visibility: 'admin_only', userLabelMode: 'style_only', createdAt: '',
  } as CoachMix,
  SEED_COACH_PROFILES,
);

const approvedSource: LearningSource = {
  id: 'src', coachProfileId: GANKAS_INSPIRED_PROFILE.id, title: 'note',
  urlOrUploadRef: 'internal://n', type: 'admin_notes', sport: 'golf', topic: 'shallowing',
  techniqueCategory: 'pivot-driven movement', drillCategory: 'rotation & sequencing',
  permissionStatus: 'public', copyrightStatus: 'cleared', approvedForLearning: true,
  createdAt: '2026-06-08T00:00:00.000Z',
};

// ── Trend intelligence ──────────────────────────────────────

describe('Coach Mix — trend intelligence', () => {
  it('turns sample aggregates into actionable recommendations', () => {
    const out = analyzeTrends(sampleTrendInput());
    expect(out.videosToProduce.length).toBeGreaterThan(0);
    expect(out.drillsToCreate.length).toBeGreaterThan(0);
    expect(out.suppressedForPrivacy).toBe(false);
    // most-common fault leads the video list
    expect(out.videosToProduce[0].suggestion.toLowerCase()).toContain('early extension');
  });

  it('promotes low-abandonment drills and flags high-abandonment ones', () => {
    const out = analyzeTrends(sampleTrendInput());
    expect(out.drillsToPromote.some((s) => s.suggestion.includes('pump drill'))).toBe(true);
    expect(out.dashboardImprovements.some((s) => s.suggestion.includes('shallowing'))).toBe(true);
  });

  it('suppresses cohorts below the k-anonymity threshold', () => {
    const tiny: TrendInput = {
      faultFrequency: { slice: 3 },
      repeatedAfterRetest: { slice: 2 },
      drillEngagement: { x: { started: 4, abandoned: 1 } },
      completionByStyle: { 'Athletic Rotation': { plansStarted: 5, plansCompleted: 4 } },
    };
    const out = analyzeTrends(tiny);
    expect(out.suppressedForPrivacy).toBe(true);
    expect(out.videosToProduce).toHaveLength(0);
    expect(out.drillsToPromote).toHaveLength(0);
  });
});

// ── Video pipeline ──────────────────────────────────────────

describe('Coach Mix — video concept pipeline', () => {
  it('builds an original draft concept from an approved learned concept', () => {
    const approved = approveConcept(extractConcepts(approvedSource)[0]);
    const concept = buildVideoConcept({
      sport: 'golf', targetProblem: 'early extension', strategy,
      drills: ['Pump drill', 'Wall drill'], sourceConcept: approved,
    });
    expect(concept).not.toBeNull();
    expect(concept!.approvalStatus).toBe('draft');
    expect(concept!.drillProgression).toContain('Pump drill');
    expect(concept!.seoKeywords.length).toBeGreaterThan(0);
    expect(concept!.scriptOutline.join(' ')).toContain('early extension');
    // no coach name leaks (style_only)
    expect(concept!.title.toLowerCase()).not.toContain('gankas');
  });

  it('refuses to seed a video from an un-approved concept', () => {
    const pending = extractConcepts(approvedSource)[0]; // still pending
    const concept = buildVideoConcept({
      sport: 'golf', targetProblem: 'slice', strategy, drills: [], sourceConcept: pending,
    });
    expect(concept).toBeNull();
  });
});

// ── Optional AI extraction seam ─────────────────────────────

describe('Coach Mix — AI rewrite seam (off by default)', () => {
  it('is a no-op without a rewriter', async () => {
    const concepts = extractConcepts(approvedSource);
    const out = await enhanceConceptRewrites(concepts);
    expect(out).toEqual(concepts);
  });

  it('only rewrites pending concepts and preserves type/confidence/risk', async () => {
    const concepts = extractConcepts(approvedSource);
    const approved = approveConcept(concepts[1]);
    const rewriter: ConceptRewriter = { rewrite: async () => 'REWRITTEN' };
    const out = await enhanceConceptRewrites([concepts[0], approved], rewriter);
    expect(out[0].suggestedRewrite).toBe('REWRITTEN');
    expect(out[0].type).toBe(concepts[0].type);
    expect(out[0].confidence).toBe(concepts[0].confidence);
    expect(out[0].ipRisk).toBe(concepts[0].ipRisk);
    expect(out[1].suggestedRewrite).toBe(approved.suggestedRewrite); // approved untouched
  });

  it('falls back to the draft when the rewriter throws', async () => {
    const concepts = extractConcepts(approvedSource);
    const rewriter: ConceptRewriter = { rewrite: async () => { throw new Error('down'); } };
    const out = await enhanceConceptRewrites(concepts, rewriter);
    expect(out[0].suggestedRewrite).toBe(concepts[0].suggestedRewrite);
  });
});
