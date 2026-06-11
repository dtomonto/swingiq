// ============================================================
// Development Roadmap — content + flag-registration invariants
// ------------------------------------------------------------
// Guards the HONESTY of /admin/development: every brief section is
// present and populated, the coach-inspired ethics + disclaimer are
// intact, and every flag the page references is actually registered
// (so the page can never list a flag the operator can't manage).
// ============================================================

import { COACH_MIX_DISCLAIMER } from '@/lib/central-intelligence/coach-mix/config';
import { findFlagDef } from '@/lib/admin/flags';
import {
  ROADMAP_SECTIONS,
  ROADMAP_COACH_DISCLAIMER,
  COACHING_INTELLIGENCE_FLAGS,
  roadmapStatusCounts,
  openFollowUpCount,
  sectionsWithOpenFollowUps,
} from '@/lib/admin/development-roadmap';

describe('development roadmap content', () => {
  it('covers all eight brief sections A–H with unique ids', () => {
    expect(ROADMAP_SECTIONS).toHaveLength(8);
    const letters = ROADMAP_SECTIONS.map((s) => s.letter);
    expect(letters).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    const ids = ROADMAP_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('populates every section (no empty product copy)', () => {
    for (const s of ROADMAP_SECTIONS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.tagline.length).toBeGreaterThan(0);
      expect(s.whatItIs.length).toBeGreaterThan(20);
      expect(s.capabilities.length).toBeGreaterThan(0);
      expect(s.todayStatus.length).toBeGreaterThan(20);
      expect(['live', 'in_development', 'planned']).toContain(s.status);
    }
  });

  it('keeps the required initiatives present', () => {
    const ids = new Set(ROADMAP_SECTIONS.map((s) => s.id));
    expect(ids).toContain('coaching-intelligence-system');
    expect(ids).toContain('coach-inspired-teaching-styles');
    expect(ids).toContain('curated-swing-drills');
    expect(ids).toContain('trend-intelligence');
    expect(ids).toContain('privacy-and-ethics');
  });
});

describe('coach-inspired ethics', () => {
  it('the coach-inspired section carries ethics guarantees', () => {
    const c = ROADMAP_SECTIONS.find((s) => s.id === 'coach-inspired-teaching-styles');
    expect(c?.ethics?.length).toBeGreaterThanOrEqual(3);
    const joined = (c?.ethics ?? []).join(' ').toLowerCase();
    expect(joined).toContain('impersonate');
    expect(joined).toContain('endorsement');
  });

  it('re-exports the verbatim non-affiliation disclaimer (single source of truth)', () => {
    expect(ROADMAP_COACH_DISCLAIMER).toBe(COACH_MIX_DISCLAIMER);
    expect(ROADMAP_COACH_DISCLAIMER.toLowerCase()).toContain('not');
    expect(ROADMAP_COACH_DISCLAIMER.toLowerCase()).toContain('endorsed');
  });
});

describe('status counts', () => {
  it('sum to the number of sections', () => {
    const counts = roadmapStatusCounts();
    expect(counts.live + counts.in_development + counts.planned).toBe(ROADMAP_SECTIONS.length);
  });
});

describe('open follow-ups (the "what\'s left" backlog)', () => {
  it('gives every not-yet-live initiative a populated follow-up list', () => {
    for (const s of ROADMAP_SECTIONS) {
      if (s.status === 'live') continue;
      expect(s.followUps && s.followUps.length).toBeGreaterThan(0);
      for (const f of s.followUps!) expect(f.length).toBeGreaterThan(0);
    }
  });

  it('live initiatives carry no open follow-ups', () => {
    for (const s of ROADMAP_SECTIONS) {
      if (s.status !== 'live') continue;
      expect(s.followUps ?? []).toHaveLength(0);
    }
  });

  it('openFollowUpCount sums every section\'s follow-ups', () => {
    const manual = ROADMAP_SECTIONS.reduce((n, s) => n + (s.followUps?.length ?? 0), 0);
    expect(openFollowUpCount()).toBe(manual);
    expect(openFollowUpCount()).toBeGreaterThan(0);
  });

  it('sectionsWithOpenFollowUps returns exactly the sections that have them', () => {
    const got = sectionsWithOpenFollowUps();
    expect(got.length).toBeGreaterThan(0);
    expect(got.every((s) => (s.followUps?.length ?? 0) > 0)).toBe(true);
  });

  it('surfaces the Motion Lab racquet-sport follow-ups under the 3D-motion initiative', () => {
    const g = ROADMAP_SECTIONS.find((s) => s.id === 'integrations-motion-launch-sim');
    const joined = (g?.followUps ?? []).join(' ').toLowerCase();
    expect(joined).toContain('demo skeleton');
    expect(joined).toContain('by sport');
  });
});

describe('feature-flag registration (drift guard)', () => {
  it('declares exactly the six initiative flags from the brief', () => {
    expect([...COACHING_INTELLIGENCE_FLAGS]).toEqual([
      'coaching_intelligence_enabled',
      'admin_coach_strategy_lab_enabled',
      'curated_drills_widget_enabled',
      'ai_video_learning_pipeline_enabled',
      'development_roadmap_visible_to_admin',
      'development_roadmap_visible_to_public',
    ]);
  });

  it('every referenced flag is actually registered and manageable', () => {
    for (const key of COACHING_INTELLIGENCE_FLAGS) {
      const def = findFlagDef(key);
      expect(def).toBeDefined();
      expect(['wired', 'registry']).toContain(def!.status);
      expect(def!.label.length).toBeGreaterThan(0);
    }
  });
});
