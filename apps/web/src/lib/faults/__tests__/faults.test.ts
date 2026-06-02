// ============================================================
// SwingIQ — Fault Ontology: Unit Tests
// ------------------------------------------------------------
// Guarantees that every fault id (curated or not) resolves to a
// usable entry, that fallbacks are honestly flagged, and that the
// audience mapping picks the right voice.
// ============================================================

import {
  getCuratedFaults,
  getFault,
  getFaultsForSport,
  resolveFault,
  retestCriteriaFor,
  explainFault,
  audienceFromTone,
  audienceFromUsageCategory,
} from '..';

describe('fault ontology — curated entries', () => {
  it('every curated entry is internally complete', () => {
    for (const e of getCuratedFaults()) {
      expect(e.id).toBeTruthy();
      expect(e.sports.length).toBeGreaterThan(0);
      expect(e.name).toBeTruthy();
      expect(e.description.length).toBeGreaterThan(10);
      expect(e.drillFamilies.length).toBeGreaterThan(0);
      expect(e.retest.activeWindowDays).toBeGreaterThan(0);
      expect(e.retest.sameConditions.length).toBeGreaterThan(0);
      // All three audience explanations are present and distinct.
      const { parent, coach, advanced } = e.explanations;
      expect(parent && coach && advanced).toBeTruthy();
      expect(new Set([parent, coach, advanced]).size).toBe(3);
      expect(e.generated).toBeFalsy();
    }
  });

  it('looks up a known curated fault by id', () => {
    const f = getFault('casting_hands');
    expect(f).not.toBeNull();
    expect(f?.sports).toContain('baseball');
    expect(f?.defaultSeverity).toBe('critical');
  });

  it('returns null for an unknown id (curated lookup only)', () => {
    expect(getFault('not_a_real_fault')).toBeNull();
  });

  it('filters curated faults by sport', () => {
    const golf = getFaultsForSport('golf');
    expect(golf.length).toBeGreaterThan(0);
    expect(golf.every((f) => f.sports.includes('golf'))).toBe(true);
  });
});

describe('fault ontology — honest fallback', () => {
  it('synthesizes a clearly-flagged entry for an unknown id', () => {
    const f = resolveFault('mystery_fault_xyz');
    expect(f.generated).toBe(true);
    expect(f.name).toBe('Mystery Fault Xyz');
    expect(f.retest.activeWindowDays).toBeGreaterThan(0);
    // Honest language — does not claim measured precision.
    expect(f.description.toLowerCase()).toContain('estimated');
  });

  it('uses a provided label over the humanized id', () => {
    const f = resolveFault('weird_id', { label: 'Trailing Elbow Collapse' });
    expect(f.name).toBe('Trailing Elbow Collapse');
  });

  it('infers softball sport from id prefix', () => {
    expect(resolveFault('sp_some_thing').sports).toEqual(['softball_slow']);
    expect(resolveFault('fp_some_thing').sports).toEqual(['softball_fast']);
  });

  it('constrains synthesized sports when a sport is given', () => {
    expect(resolveFault('generic_thing', { sport: 'tennis' }).sports).toEqual(['tennis']);
  });

  it('resolveFault never returns null and always carries retest criteria', () => {
    const ids = ['casting_hands', 'totally_unknown', 'fp_late_load'];
    for (const id of ids) {
      const r = retestCriteriaFor(id);
      expect(r.activeWindowDays).toBeGreaterThan(0);
      expect(r.improvedWhen).toBeTruthy();
    }
  });
});

describe('fault ontology — audience-aware explanations', () => {
  it('returns the right voice for each audience', () => {
    const parent = explainFault('casting_hands', 'parent');
    const coach = explainFault('casting_hands', 'coach');
    const advanced = explainFault('casting_hands', 'advanced');
    expect(parent).not.toEqual(coach);
    expect(coach).not.toEqual(advanced);
  });

  it('maps coaching tone to an audience', () => {
    expect(audienceFromTone('parent')).toBe('parent');
    expect(audienceFromTone('competitive')).toBe('advanced');
    expect(audienceFromTone('coach')).toBe('coach');
    expect(audienceFromTone('team')).toBe('coach');
    expect(audienceFromTone('beginner')).toBe('parent');
    expect(audienceFromTone(null)).toBe('parent');
  });

  it('maps usage category to an audience', () => {
    expect(audienceFromUsageCategory('coach')).toBe('coach');
    expect(audienceFromUsageCategory('parent_guardian')).toBe('parent');
    expect(audienceFromUsageCategory('minor_under_13')).toBe('parent');
    expect(audienceFromUsageCategory('adult')).toBe('advanced');
    expect(audienceFromUsageCategory(null)).toBe('advanced');
  });
});
