import { IMPROVE_INTENTS } from '../intents';

describe('IMPROVE_INTENTS', () => {
  it('offers a focused set (not the whole feature grid)', () => {
    // The point of the intent picker is low cognition — keep it small.
    expect(IMPROVE_INTENTS.length).toBeGreaterThanOrEqual(2);
    expect(IMPROVE_INTENTS.length).toBeLessThanOrEqual(4);
  });

  it('has unique ids', () => {
    const ids = IMPROVE_INTENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('routes only to internal app destinations', () => {
    for (const intent of IMPROVE_INTENTS) {
      expect(intent.href.startsWith('/')).toBe(true);
      expect(intent.href.startsWith('//')).toBe(false); // not protocol-relative
    }
  });

  it('every intent has a label and a welcoming description', () => {
    for (const intent of IMPROVE_INTENTS) {
      expect(intent.label.trim().length).toBeGreaterThan(0);
      expect(intent.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps the core analyze → Motion Lab destination (sport-agnostic dispatch)', () => {
    const analyze = IMPROVE_INTENTS.find((i) => i.id === 'analyze');
    expect(analyze?.href).toBe('/motion-lab');
  });
});
