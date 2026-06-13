// ============================================================
// WS-04 — player-profile intelligence + archetype unit tests
// Verifies deterministic composition, honest handling of missing data
// (no fabrication), and archetype derivation. Uses minimal fixtures cast
// to the engine output types (we only read a subset of their fields).
// ============================================================

import { derivePlayerArchetype } from '../archetype';
import { buildProfileIntelligence } from '../intelligence';
import type { JourneyDashboard, CategoryScore, ClassificationCategory } from '@/lib/athletic-journey/types';
import type { PriorityResult, AthletePriority } from '@/lib/priority/types';

const cat = (
  category: ClassificationCategory,
  score: number | null,
  confidence = 0.7,
): CategoryScore => ({ category, score, confidence, basis: 'analyzed', signalCount: 3 });

function journeyFixture(over: Partial<JourneyDashboard> = {}): JourneyDashboard {
  return {
    categoryScores: [],
    primaryStrengths: [],
    developmentGaps: [],
    confidence: 'medium',
    confidenceScore: 0.6,
    currentStage: { code: 'G4', name: 'Developing', tier: 'developing' },
    momentum: { band: 'building', score: 55, drivers: [], note: '' },
    ...over,
  } as unknown as JourneyDashboard;
}

const priority = (top: AthletePriority | null, over: Partial<PriorityResult> = {}): PriorityResult => ({
  generatedAt: 'now',
  top,
  secondary: null,
  all: top ? [top] : [],
  whatsMissing: [],
  whatChanged: null,
  insufficientData: top === null,
  ...over,
});

const prio = (over: Partial<AthletePriority> = {}): AthletePriority => ({
  id: 'early_extension',
  label: 'Early extension',
  summary: 'Losing posture through impact.',
  severity: 'high',
  confidence: 72,
  score: 80,
  occurrences: 3,
  sampleSize: 40,
  trend: 'persisting',
  source: 'video',
  recommendedPlanHref: '/training?fix=early_extension',
  evidence: [],
  ...over,
});

describe('derivePlayerArchetype', () => {
  it('returns null when no scored dimensions are available', () => {
    expect(derivePlayerArchetype({})).toBeNull();
    expect(derivePlayerArchetype({ categoryScores: [cat('technique', null)] })).toBeNull();
  });

  it('flags Consistency Seeker when consistency is the clear weakness', () => {
    const a = derivePlayerArchetype({
      categoryScores: [cat('movement', 80), cat('technique', 78), cat('consistency', 40)],
    });
    expect(a?.id).toBe('consistency_seeker');
    expect(a?.evidence.join(' ')).toMatch(/consistency/i);
    expect(a?.confidence).toBeGreaterThan(0);
  });

  it('flags Power Developer when power leads with a real spread', () => {
    const a = derivePlayerArchetype({
      categoryScores: [cat('movement', 85), cat('technique', 60), cat('tactical', 58)],
    });
    expect(a?.id).toBe('power_developer');
  });

  it('returns All-Rounder when scores are flat (no over-claiming)', () => {
    const a = derivePlayerArchetype({
      categoryScores: [cat('movement', 70), cat('technique', 72), cat('consistency', 71)],
    });
    expect(a?.id).toBe('all_rounder');
  });

  it('is deterministic for identical inputs', () => {
    const input = { categoryScores: [cat('technique', 88), cat('consistency', 60)] };
    expect(derivePlayerArchetype(input)).toEqual(derivePlayerArchetype(input));
  });
});

describe('buildProfileIntelligence', () => {
  it('reports no-data honestly without fabricating', () => {
    const s = buildProfileIntelligence({ journey: null, priority: null, activity: { totalSessions: 0, lastActiveAt: null, streakDays: 0 } });
    expect(s.dataCoverage).toBe('none');
    expect(s.archetype).toBeNull();
    expect(s.currentFocus).toBeNull();
    expect(s.confidenceLevel).toBe('unknown');
    expect(s.confidenceScore).toBeNull();
    expect(s.recommendedNextStep?.href).toBe('/profile');
    expect(s.confidenceNote).toMatch(/not enough data/i);
  });

  it('uses the priority engine for current focus and surfaces recurring patterns', () => {
    const s = buildProfileIntelligence({
      journey: journeyFixture({ categoryScores: [cat('movement', 82), cat('consistency', 45)] }),
      priority: priority(prio({ trend: 'worsening' }), { whatsMissing: ['face-on video'] }),
      activity: { totalSessions: 5, lastActiveAt: '2026-06-10', streakDays: 2 },
    });
    expect(s.currentFocus?.label).toBe('Early extension');
    expect(s.currentFocus?.href).toBe('/training?fix=early_extension');
    expect(s.recurringPatterns.length).toBeGreaterThan(0);
    expect(s.recommendedNextStep?.href).toBe('/training?fix=early_extension');
    expect(s.confidenceNote).toMatch(/face-on video/);
    expect(s.stage?.code).toBe('G4');
    expect(s.momentumBand).toBe('building');
  });

  it('falls back to a journey development gap when no priority exists', () => {
    const s = buildProfileIntelligence({
      journey: journeyFixture({
        developmentGaps: [{ category: 'consistency', text: 'Tighten dispersion', basis: 'analyzed' }],
      }),
      priority: priority(null),
      activity: { totalSessions: 2, lastActiveAt: '2026-06-01', streakDays: 0 },
    });
    expect(s.currentFocus?.label).toBe('Tighten dispersion');
    expect(s.currentFocus?.href).toBe('/journey');
  });
});
