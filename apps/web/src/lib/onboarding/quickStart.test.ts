// ============================================================
// Quick-Start Engine — deterministic diagnosis enrichment tests
// ============================================================

import { buildQuickResult } from './quickStart';

describe('buildQuickResult — base output is preserved', () => {
  it('still returns a complete quick result', () => {
    const r = buildQuickResult({ sportId: 'golf', symptom: 'slice', userType: 'athlete', skill: 'developing' });
    expect(r).not.toBeNull();
    expect(r!.issue).toBeTruthy();
    expect(r!.drills.length).toBeGreaterThan(0);
    expect(r!.plan.length).toBeGreaterThan(0);
    expect(r!.confidence.level).toBe('low'); // quiz path stays honestly low
    expect(r!.videoAnalyzed).toBe(false);
  });

  it('returns null for an unknown sport or symptom', () => {
    expect(buildQuickResult({ sportId: 'golf', symptom: 'not-a-symptom', userType: 'athlete', skill: 'new' })).toBeNull();
  });
});

describe('buildQuickResult — deterministic diagnosis enrichment', () => {
  it('attaches a ranked, non-generated diagnosis for a recognized miss', () => {
    const r = buildQuickResult({ sportId: 'golf', symptom: 'slice', userType: 'athlete', skill: 'developing' });
    expect(r!.diagnosis).toBeDefined();
    expect(r!.diagnosis!.primary.faultId).toBe('slice');
    expect(r!.diagnosis!.primary.generated).toBe(false);
    expect(r!.diagnosis!.confidenceReason).toBeTruthy();
    expect(r!.diagnosis!.supportingEvidence.length).toBeGreaterThan(0);
  });

  it('maps onboarding skill buckets onto engine skill levels', () => {
    const r = buildQuickResult({ sportId: 'golf', symptom: 'slice', userType: 'athlete', skill: 'experienced' });
    expect(r!.diagnosis!.skillLevel).toBe('advanced');
  });

  it('omits the diagnosis when the engine cannot match a curated cause', () => {
    // A pickleball "popping dinks" miss has no curated engine rule → generated → omitted.
    const r = buildQuickResult({ sportId: 'pickleball', symptom: 'popping_dinks', userType: 'athlete', skill: 'new' });
    expect(r).not.toBeNull();
    // Base content still present even without an engine match.
    expect(r!.drills.length).toBeGreaterThan(0);
    if (r!.diagnosis) expect(r!.diagnosis.primary.generated).toBe(false);
  });
});
