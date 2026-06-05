import { buildBrief } from '../briefGenerator';
import { isOnBrand, MAX_DURATION_BY_TYPE } from '../brand';
import { scanForOpportunities } from '../opportunityEngine';
import { sampleOpp } from './_factories';

describe('buildBrief', () => {
  const opps = scanForOpportunities();

  it('produces a complete, on-brand brief for every scanned opportunity', () => {
    for (const opp of opps) {
      const brief = buildBrief(opp);

      expect(brief.script.length).toBeGreaterThan(0);
      expect(brief.captions.length).toBe(brief.script.length);
      expect(brief.seo.title.length).toBeGreaterThan(0);
      expect(brief.aeoSummary.length).toBeGreaterThan(0);
      expect(brief.accessibilityRequirements.length).toBeGreaterThan(0);

      // Honors the per-type max duration.
      expect(brief.durationTargetSec).toBeLessThanOrEqual(MAX_DURATION_BY_TYPE[opp.recommendedType]);

      // Storyboard covers the whole target duration.
      const sum = brief.storyboard.reduce((a, s) => a + s.durationSec, 0);
      expect(sum).toBeGreaterThanOrEqual(brief.durationTargetSec);
      expect(sum).toBeLessThanOrEqual(brief.durationTargetSec + 3);
      for (const scene of brief.storyboard) expect(scene.durationSec).toBeGreaterThanOrEqual(2);

      // No script ships a blocked claim.
      expect(isOnBrand(brief.script)).toBe(true);
    }
  });

  it('applies overrides and caps duration', () => {
    const brief = buildBrief(sampleOpp('home-hero'), { durationTargetSec: 999, aspectRatio: '9:16', cta: 'Go' });
    expect(brief.aspectRatio).toBe('9:16');
    expect(brief.cta).toBe('Go');
    expect(brief.durationTargetSec).toBeLessThanOrEqual(MAX_DURATION_BY_TYPE['hero_explainer']);
  });

  it('versions briefs deterministically', () => {
    const v2 = buildBrief(sampleOpp('upload-record'), {}, 2);
    expect(v2.version).toBe(2);
    expect(v2.id).toMatch(/_v2$/);
  });
});
