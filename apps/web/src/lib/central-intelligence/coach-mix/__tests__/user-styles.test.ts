// ============================================================
// Coach Mix — user-facing styles: resolution + ETHICS invariants
// ------------------------------------------------------------
// The athlete-selectable styles must (a) resolve to genuinely
// different coaching strategies, and (b) never expose a coach name or
// reference — only original SwingVantage house voices are user-visible.
// ============================================================

import {
  USER_COACHING_STYLES,
  USER_STYLE_PROFILES,
  DEFAULT_USER_STYLE_ID,
  getUserStyle,
  resolveUserStyleStrategy,
} from '@/lib/central-intelligence/coach-mix/user-styles';

describe('user coaching styles — catalogue', () => {
  it('offers the six expected styles', () => {
    expect(USER_COACHING_STYLES.map((s) => s.id)).toEqual([
      'default',
      'feel',
      'technical',
      'data',
      'precision',
      'blended',
    ]);
  });

  it('every style has a label, blurb and a non-empty blend', () => {
    for (const s of USER_COACHING_STYLES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.blurb.length).toBeGreaterThan(0);
      expect(s.entries.length).toBeGreaterThan(0);
      const total = s.entries.reduce((n, e) => n + e.weightPct, 0);
      expect(total).toBeGreaterThan(0);
    }
  });
});

describe('ETHICS — user-visible styles are original house voices', () => {
  it('no user-style profile carries a coach handle or reference', () => {
    for (const p of USER_STYLE_PROFILES) {
      expect(p.publicHandle).toBeUndefined();
      expect(p.reference).toBeUndefined();
      expect(p.visibility).toBe('user_visible');
      expect(p.status).toBe('active');
      expect(p.needsReview).toBe(false);
    }
  });

  it('every style entry references a known user-visible profile', () => {
    const ids = new Set(USER_STYLE_PROFILES.map((p) => p.id));
    for (const s of USER_COACHING_STYLES) {
      for (const e of s.entries) expect(ids.has(e.coachProfileId)).toBe(true);
    }
  });
});

describe('resolveUserStyleStrategy', () => {
  it('never reveals coach names (style_only label mode)', () => {
    for (const s of USER_COACHING_STYLES) {
      expect(resolveUserStyleStrategy(s.id).coachNamesVisible).toBe(false);
    }
  });

  it('feel-first and technical styles produce different explanation depth', () => {
    expect(resolveUserStyleStrategy('feel').explanationStyle).toBe('feel_first');
    expect(resolveUserStyleStrategy('technical').explanationStyle).toBe('technical');
    expect(resolveUserStyleStrategy('precision').explanationStyle).toBe('technical');
  });

  it('surfaces the chosen style as a neutral influence tag', () => {
    expect(resolveUserStyleStrategy('feel').influenceTags).toContain('Feel-Based Simplicity');
    expect(resolveUserStyleStrategy('data').influenceTags).toContain('Data-Driven Performance');
    expect(resolveUserStyleStrategy('precision').influenceTags).toContain('Technical Precision');
  });

  it('an unknown or null style falls back to the default', () => {
    expect(getUserStyle('not-a-style').id).toBe(DEFAULT_USER_STYLE_ID);
    expect(getUserStyle(null).id).toBe(DEFAULT_USER_STYLE_ID);
    // default resolves cleanly (house model), still no coach names
    const def = resolveUserStyleStrategy(null);
    expect(def.coachNamesVisible).toBe(false);
    expect(def.influenceTags.length).toBeGreaterThan(0);
  });
});
