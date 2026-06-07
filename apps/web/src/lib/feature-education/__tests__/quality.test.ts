import { scoreAsset, withQuality } from '../quality';
import { generateAsset } from '../generators';
import { makeFeature } from './_factories';

describe('scoreAsset', () => {
  it('a clean, grounded, complete asset passes', () => {
    const tut = generateAsset(makeFeature(), 'tutorial');
    const q = scoreAsset(tut);
    expect(q.overall).toBeGreaterThanOrEqual(70);
    expect(q.passed).toBe(true);
    expect(q.dimensions.accuracy).toBeGreaterThan(70);
  });

  it('a forbidden brand claim tanks the brand dimension and fails the asset', () => {
    const tut = generateAsset(makeFeature(), 'tutorial');
    tut.sections[0].body.push('We guarantee you will lower your score.');
    const q = scoreAsset(tut);
    expect(q.dimensions.brand).toBeLessThan(50);
    expect(q.passed).toBe(false);
    expect(q.reasons.join(' ')).toMatch(/brand/i);
  });
});

describe('withQuality', () => {
  it('routes a failing draft to needs-review', () => {
    const tut = generateAsset(makeFeature(), 'tutorial');
    tut.sections[0].body.push('This is a guaranteed cure for your swing.');
    const scored = withQuality(tut);
    expect(scored.status).toBe('needs-review');
    expect(scored.needsHumanReview).toBe(true);
    expect(scored.quality?.passed).toBe(false);
  });

  it('attaches a security scan to the asset', () => {
    const scored = withQuality(generateAsset(makeFeature(), 'tutorial'));
    expect(scored.security).toBeDefined();
    expect(scored.quality).toBeDefined();
  });
});
