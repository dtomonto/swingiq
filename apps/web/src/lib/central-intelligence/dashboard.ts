// ============================================================
// CentralIntelligenceOS — Admin dashboard composer (SERVER-ONLY)
// ------------------------------------------------------------
// Assembles the command center: REAL Founding campaign data (from the
// server member records) + aggregate intelligence. Aggregates use the
// labelled sample population until the relational aggregate is wired
// (dataSource: 'sample'); the Founding campaign numbers are always live.
// ============================================================

import type {
  AggregateDistribution,
  FoundingCampaignProgress,
  IntelligenceRecommendation,
} from './types';
import { buildDistribution, buildFunnel, biggestDropOff, type FunnelStep } from './aggregate';
import { generateRecommendations } from './recommendations';
import {
  getFoundingCampaignProgress,
  getFoundingConfig,
  listFoundingMembers,
  getQualifiedCount,
  isFoundingPersistent,
  type FoundingConfigRecord,
  type FoundingMemberRecord,
} from './founding-server';
import {
  SAMPLE_SIGNALS,
  SAMPLE_SPORT_VALUES,
  SAMPLE_SKILL_VALUES,
  SAMPLE_GOAL_VALUES,
  SAMPLE_COMPLETION_FUNNEL,
  SAMPLE_RECURRING_ISSUES,
  SAMPLE_DRILL_EFFECTIVENESS,
  SAMPLE_SESSION_SOURCES,
  SAMPLE_GOVERNANCE,
  SAMPLE_USERS,
  SAMPLE_EXECUTIVE_EXTRAS,
  type SampleUserRow,
} from './sample-data';

export interface CIDashboard {
  generatedAt: string;
  /** 'sample' = aggregate panels use illustrative data; founding is always live. */
  dataSource: 'sample' | 'real';
  founding: {
    progress: FoundingCampaignProgress;
    config: FoundingConfigRecord;
    members: FoundingMemberRecord[];
    membersCount: number;
    persistent: boolean;
  };
  executive: {
    totalUsers: number;
    profilesComplete: number;
    profileCompletionRate: number;
    totalSessions: number;
    avgSessionsPerUser: number;
    newThisWeek: number;
    returningUsers: number;
    retestRate: number;
    aiDiagnosticCompletionRate: number;
    dataQualityScorePct: number;
    topSports: Array<{ sport: string; sessions: number }>;
  };
  profileIntel: {
    distributions: AggregateDistribution[];
    topMissingFields: Array<{ label: string; count: number }>;
    completionFunnel: FunnelStep[];
    biggestDropOff: ReturnType<typeof biggestDropOff>;
  };
  sessionIntel: {
    sessionsBySport: Array<{ sport: string; sessions: number }>;
    sourceBreakdown: Record<string, number>;
    uploadFailureRate: number;
    avgSessionsPerUser: number;
    topRecurringIssues: Array<{ issue: string; count: number }>;
  };
  coachingMemory: {
    recurringIssues: Array<{ issue: string; count: number }>;
    drillEffectiveness: typeof SAMPLE_DRILL_EFFECTIVENESS;
    planCompletionRate: number;
    helpfulnessPct: number;
  };
  governance: typeof SAMPLE_GOVERNANCE;
  recommendations: IntelligenceRecommendation[];
  users: SampleUserRow[];
}

export async function getCentralIntelligenceDashboard(): Promise<CIDashboard> {
  const [progress, config, members, qualifiedCount] = await Promise.all([
    getFoundingCampaignProgress(),
    getFoundingConfig(),
    listFoundingMembers(50),
    getQualifiedCount(),
  ]);

  // Signals = sample aggregates + the REAL founding progress.
  const signals = { ...SAMPLE_SIGNALS, founding: progress };
  const recommendations = generateRecommendations(signals);

  const distributions = [
    buildDistribution('Primary sport', SAMPLE_SPORT_VALUES),
    buildDistribution('Skill level', SAMPLE_SKILL_VALUES),
    buildDistribution('Top goal', SAMPLE_GOAL_VALUES),
  ];
  const completionFunnel = buildFunnel(SAMPLE_COMPLETION_FUNNEL);

  const helpfulnessPct = Math.round(
    SAMPLE_DRILL_EFFECTIVENESS.reduce((s, d) => s + d.helpfulPct, 0) / SAMPLE_DRILL_EFFECTIVENESS.length,
  );
  const planCompletionRate = Math.round(
    SAMPLE_DRILL_EFFECTIVENESS.reduce((s, d) => s + d.completionRate, 0) / SAMPLE_DRILL_EFFECTIVENESS.length,
  );

  return {
    generatedAt: new Date().toISOString(),
    dataSource: 'sample',
    founding: {
      progress,
      config,
      members,
      membersCount: qualifiedCount,
      persistent: isFoundingPersistent(),
    },
    executive: {
      totalUsers: signals.totalUsers,
      profilesComplete: signals.profilesComplete,
      profileCompletionRate: signals.profileCompletionRate,
      totalSessions: signals.totalSessions,
      avgSessionsPerUser: signals.avgSessionsPerUser,
      newThisWeek: SAMPLE_EXECUTIVE_EXTRAS.newThisWeek,
      returningUsers: SAMPLE_EXECUTIVE_EXTRAS.returningUsers,
      retestRate: signals.retestRate,
      aiDiagnosticCompletionRate: SAMPLE_EXECUTIVE_EXTRAS.aiDiagnosticCompletionRate,
      dataQualityScorePct: SAMPLE_EXECUTIVE_EXTRAS.dataQualityScorePct,
      topSports: [...signals.sessionsBySport].sort((a, b) => b.sessions - a.sessions).slice(0, 4),
    },
    profileIntel: {
      distributions,
      topMissingFields: signals.topMissingFields,
      completionFunnel,
      biggestDropOff: biggestDropOff(completionFunnel),
    },
    sessionIntel: {
      sessionsBySport: signals.sessionsBySport,
      sourceBreakdown: SAMPLE_SESSION_SOURCES,
      uploadFailureRate: signals.uploadFailureRate,
      avgSessionsPerUser: signals.avgSessionsPerUser,
      topRecurringIssues: SAMPLE_RECURRING_ISSUES,
    },
    coachingMemory: {
      recurringIssues: SAMPLE_RECURRING_ISSUES,
      drillEffectiveness: SAMPLE_DRILL_EFFECTIVENESS,
      planCompletionRate,
      helpfulnessPct,
    },
    governance: SAMPLE_GOVERNANCE,
    recommendations,
    users: SAMPLE_USERS,
  };
}
