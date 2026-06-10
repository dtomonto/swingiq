import {
  classifyRisk,
  confirmationDepth,
  allowsInstantPublish,
  maxRisk,
  explainRisk,
} from '../risk';

describe('publishing/risk', () => {
  it('classifies baseline risk per surface', () => {
    expect(classifyRisk('update', 'publish')).toBe('low');
    expect(classifyRisk('seo-page', 'publish')).toBe('medium');
    expect(classifyRisk('sport-config', 'publish')).toBe('high');
    expect(classifyRisk('feature-flag', 'publish')).toBe('high');
  });

  it('escalates high-stakes removals one notch', () => {
    // feature-flag base is high; unpublishing it escalates to critical.
    expect(classifyRisk('feature-flag', 'unpublish')).toBe('critical');
    expect(classifyRisk('trust-copy', 'rollback')).toBe('critical');
    // a low-stakes surface does not escalate.
    expect(classifyRisk('update', 'unpublish')).toBe('low');
  });

  it('maps risk to confirmation depth', () => {
    expect(confirmationDepth('low')).toBe('simple');
    expect(confirmationDepth('medium')).toBe('preview');
    expect(confirmationDepth('high')).toBe('explicit');
    expect(confirmationDepth('critical')).toBe('blocked');
  });

  it('blocks instant publish only for critical', () => {
    expect(allowsInstantPublish('high')).toBe(true);
    expect(allowsInstantPublish('critical')).toBe(false);
  });

  it('maxRisk returns the higher level', () => {
    expect(maxRisk('low', 'high')).toBe('high');
    expect(maxRisk('critical', 'medium')).toBe('critical');
  });

  it('explains risk in plain English', () => {
    expect(explainRisk('trust-copy', 'critical')).toMatch(/engineering review/i);
    expect(explainRisk('update', 'low')).toMatch(/simple confirmation/i);
  });
});
