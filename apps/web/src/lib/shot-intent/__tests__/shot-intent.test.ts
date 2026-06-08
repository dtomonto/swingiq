import { classifyShotIntent } from '../classify';
import { buildBaselineResolver, percentile, PROVISIONAL_FULL_CARRY, type ClubBaseline } from '../baselines';

const userBaseline = (fullCarry: number): ClubBaseline => ({ fullCarry, source: 'user', sampleSize: 10 });

describe('classifyShotIntent', () => {
  it('calls a near-baseline driver a full swing (high confidence from user data)', () => {
    const r = classifyShotIntent({ carry: 250, clubSpeed: 113, ballSpeed: 167, launchAngle: 13, category: 'driver' }, userBaseline(250));
    expect(r.intent).toBe('full');
    expect(r.swingType).toBe('full');
    expect(r.confidence).toBe('high');
    expect(r.isOutlier).toBe(false);
  });

  it('calls a half-distance wedge a pitch', () => {
    const r = classifyShotIntent({ carry: 50, clubSpeed: 80, ballSpeed: 95, launchAngle: 30, category: 'wedge' }, { fullCarry: 105, source: 'bag', sampleSize: 0 });
    expect(r.intent).toBe('pitch');
    expect(r.confidence).toBe('medium');
  });

  it('calls ~75% an iron a three-quarter shot', () => {
    const r = classifyShotIntent({ carry: 120, clubSpeed: 85, ballSpeed: 120, launchAngle: 17, category: 'mid_iron' }, userBaseline(165));
    expect(r.intent).toBe('three_quarter');
  });

  it('calls a very short wedge a chip', () => {
    expect(classifyShotIntent({ carry: 30, clubSpeed: 60, ballSpeed: 70, launchAngle: 28, category: 'wedge' }, userBaseline(105)).intent).toBe('chip');
  });

  it('flags an implausibly short driver as a mishit + outlier', () => {
    const r = classifyShotIntent({ carry: 120, clubSpeed: 110, ballSpeed: 150, launchAngle: 12, category: 'driver' }, userBaseline(250));
    expect(r.intent).toBe('mishit');
    expect(r.isOutlier).toBe(true);
    expect(r.swingType).toBe('full'); // mishit keeps best-guess swing
  });

  it('detects a punch / knockdown from low launch + reduced carry', () => {
    const r = classifyShotIntent({ carry: 140, clubSpeed: 85, ballSpeed: 120, launchAngle: 9, category: 'mid_iron' }, userBaseline(165));
    expect(r.intent).toBe('punch');
  });

  it('flags a flier (over-carry) as an outlier', () => {
    const r = classifyShotIntent({ carry: 320, clubSpeed: 120, ballSpeed: 175, launchAngle: 14, category: 'driver' }, userBaseline(250));
    expect(r.isOutlier).toBe(true);
  });

  it('defaults to full at low confidence when no baseline/carry exists', () => {
    const r = classifyShotIntent({ carry: 150, clubSpeed: null, ballSpeed: null, launchAngle: null, category: 'mid_iron' }, { fullCarry: null, source: 'provisional', sampleSize: 0 });
    expect(r.intent).toBe('full');
    expect(r.confidence).toBe('low');
    expect(r.ratio).toBeNull();
  });
});

describe('baselines', () => {
  it('percentile interpolates', () => {
    expect(percentile([100, 200], 0.5)).toBe(150);
    expect(percentile([], 0.8)).toBeNull();
  });

  it('derives a user baseline from ≥4 same-club shots (80th pct)', () => {
    const resolve = buildBaselineResolver([
      { shots: [
        { club_name: '7 Iron', club_category: 'mid_iron', ball_data: { carry_distance: 150 } },
        { club_name: '7 Iron', club_category: 'mid_iron', ball_data: { carry_distance: 155 } },
        { club_name: '7 Iron', club_category: 'mid_iron', ball_data: { carry_distance: 160 } },
        { club_name: '7 Iron', club_category: 'mid_iron', ball_data: { carry_distance: 165 } },
      ] },
    ]);
    const b = resolve('7 Iron', 'mid_iron');
    expect(b.source).toBe('user');
    expect(b.sampleSize).toBe(4);
    expect(b.fullCarry).toBeGreaterThanOrEqual(160);
  });

  it('falls back to the bag carry, then the provisional benchmark', () => {
    const resolve = buildBaselineResolver([], { Driver: 270 });
    expect(resolve('Driver', 'driver')).toMatchObject({ source: 'bag', fullCarry: 270 });
    expect(resolve('5 Wood', 'fairway_wood')).toMatchObject({ source: 'provisional', fullCarry: PROVISIONAL_FULL_CARRY.fairway_wood });
  });
});
