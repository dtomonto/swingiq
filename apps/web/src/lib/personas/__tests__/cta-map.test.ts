import { PERSONA_CTA_MAP, ALL_PERSONA_CTAS, personaCta, type PersonaId } from '../cta-map';

const PERSONAS: PersonaId[] = ['athlete', 'parents', 'coaches', 'teams', 'creators', 'partners'];

describe('personas/cta-map', () => {
  it('covers every persona with a keyed entry', () => {
    expect(ALL_PERSONA_CTAS).toHaveLength(PERSONAS.length);
    for (const p of PERSONAS) {
      expect(PERSONA_CTA_MAP[p].persona).toBe(p);
      expect(personaCta(p)).toBe(PERSONA_CTA_MAP[p]);
    }
  });

  it('every persona has a non-empty CTA label + a valid target', () => {
    for (const cta of ALL_PERSONA_CTAS) {
      expect(cta.ctaLabel.length).toBeGreaterThan(0);
      expect(cta.audience.length).toBeGreaterThan(0);
      // Target is either a route or an in-page anchor.
      expect(cta.ctaTarget).toMatch(/^(\/|#)/);
    }
  });

  it('routes are unique and rooted at "/"', () => {
    const routes = ALL_PERSONA_CTAS.map((c) => c.route).filter(Boolean) as string[];
    expect(new Set(routes).size).toBe(routes.length);
    for (const r of routes) expect(r).toMatch(/^\//);
  });

  it('classifies funnel intent', () => {
    expect(PERSONA_CTA_MAP.athlete.intent).toBe('product');
    expect(PERSONA_CTA_MAP.coaches.intent).toBe('capture');
    expect(PERSONA_CTA_MAP.partners.intent).toBe('partnership');
  });
});
