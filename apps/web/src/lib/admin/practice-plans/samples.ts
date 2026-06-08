// ============================================================
// SwingVantage Admin — Practice Plan samples (isomorphic, pure)
// ------------------------------------------------------------
// There is no static practice-plan registry — plans are GENERATED per
// athlete by the deterministic practice-planner workflow. To give the
// admin a "Practice Plan Management" view without inventing data, this
// invokes the REAL planner (lib/agents/workflows/practice-planner) with
// representative sample contexts (per sport × skill level, plus a youth
// variant) and returns the resulting plans for review.
//
// Pure + deterministic (fixed `now`, no I/O) so it is fully testable and
// keyless. If the planner or AgentContext shape changes, this fails at
// type-check — by design, so the preview never drifts from reality.
// ============================================================

import type { SkillLevel } from '@swingiq/core';
import type { UsageCategory } from '@/store';
import { buildPracticePlan } from '@/lib/agents/workflows/practice-planner';
import { SPORT_AGENT_PROFILES, getSportAgentProfile } from '@/lib/agents/sport-profiles';
import type { AgentContext, PracticePlan } from '@/lib/agents/types';

// Stable timestamp so generated samples are deterministic across runs.
const SAMPLE_NOW = '2026-06-08T12:00:00.000Z';

export interface PlanVariant {
  label: string;
  skillLevel: SkillLevel;
  usageCategory: UsageCategory;
  minutes: number;
  youth: boolean;
}

/** The representative variants previewed per sport. */
export const PLAN_VARIANTS: PlanVariant[] = [
  { label: 'Beginner', skillLevel: 'beginner', usageCategory: 'adult', minutes: 20, youth: false },
  { label: 'Intermediate', skillLevel: 'intermediate', usageCategory: 'adult', minutes: 30, youth: false },
  { label: 'Advanced', skillLevel: 'advanced', usageCategory: 'adult', minutes: 45, youth: false },
  { label: 'Youth (13–17)', skillLevel: 'beginner', usageCategory: 'minor_13_17', minutes: 20, youth: true },
];

/** Build a minimal, valid AgentContext for previewing a plan. No real data. */
export function makeSampleContext(
  sport: string,
  skillLevel: SkillLevel,
  usageCategory: UsageCategory,
): AgentContext {
  const sportId = sport as AgentContext['activeSport'];
  const sp = getSportAgentProfile(sportId);
  return {
    now: SAMPLE_NOW,
    activeSport: sportId,
    sportLabel: sp.label,
    profile: { firstName: null, sport: sportId, skillLevel, goal: null, usageCategory, exists: true },
    golfProfile: null,
    sportProfiles: {},
    hasGolfProfile: sport === 'golf',
    hasSportProfile: sport !== 'golf',
    clubCount: 0,
    equipment: { sport: sportId, completeness: 0, itemCount: 0, sufficientForFit: false },
    sessions: [],
    sportSessions: [],
    latestSession: null,
    latestDiagnosedSession: null,
    sessionCount: 0,
    planStatus: 'none',
    hasActivePlan: false,
    streakDays: 0,
    lastPracticeDate: null,
    lastActivityAt: null,
    daysSinceLastActivity: null,
    usageCategory,
    coachingStyle: 'balanced',
    units: 'yards',
  };
}

export interface SamplePlan {
  sport: string;
  sportLabel: string;
  variant: string;
  youth: boolean;
  plan: PracticePlan;
}

export interface PracticePlanCatalog {
  generatedAt: string;
  samples: SamplePlan[];
  stats: {
    sports: number;
    samples: number;
    variants: number;
    avgDrills: number;
  };
}

/** All sports the agent layer knows about. */
export function samplePlanSports(): string[] {
  return Object.keys(SPORT_AGENT_PROFILES);
}

/**
 * Generate the full sample-plan catalog by invoking the real planner for
 * every sport × variant. Deterministic and dependency-light.
 */
export function buildSamplePlans(sports: string[] = samplePlanSports()): PracticePlanCatalog {
  const samples: SamplePlan[] = [];
  for (const sport of sports) {
    const sp = getSportAgentProfile(sport as AgentContext['activeSport']);
    for (const v of PLAN_VARIANTS) {
      const ctx = makeSampleContext(sport, v.skillLevel, v.usageCategory);
      const plan = buildPracticePlan(ctx, v.minutes);
      samples.push({ sport, sportLabel: sp.label, variant: v.label, youth: v.youth, plan });
    }
  }

  const totalDrills = samples.reduce((n, s) => n + s.plan.mainDrills.length, 0);
  return {
    generatedAt: SAMPLE_NOW,
    samples,
    stats: {
      sports: sports.length,
      samples: samples.length,
      variants: PLAN_VARIANTS.length,
      avgDrills: samples.length ? Math.round((totalDrills / samples.length) * 10) / 10 : 0,
    },
  };
}

/** Group the sample plans by sport for rendering. */
export function groupSamplesBySport(catalog: PracticePlanCatalog): { sport: string; sportLabel: string; samples: SamplePlan[] }[] {
  const order = [...new Set(catalog.samples.map((s) => s.sport))];
  return order.map((sport) => ({
    sport,
    sportLabel: catalog.samples.find((s) => s.sport === sport)!.sportLabel,
    samples: catalog.samples.filter((s) => s.sport === sport),
  }));
}
