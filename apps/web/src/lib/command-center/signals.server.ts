// ============================================================
// Today's Command Center — signal gathering (SERVER-ONLY)
// ------------------------------------------------------------
// The ONE place the engine's inputs are read from live sources. Every
// source is wrapped defensively: a broken/empty source degrades to a safe
// default so one failure can never take down the scan. The engine itself
// (engine.ts) stays pure and is fed the bundle this produces.
//
// Sources (all already exist in the app — nothing is invented):
//   • Drill catalogs            → per-sport coverage
//   • Audit Reports snapshot     → open P0/P1 findings
//   • Feature Education roll-up   → tutorial/doc gaps & review queue
//   • Setup registry             → pending admin-config tasks
//   • Environment                → whether analytics is configured
// ============================================================

import 'server-only';

import { SPORT_TAXONOMY } from '@swingiq/core';
import { DRILLS_CONTENT } from '@/data/drills-content';
import { ALL_DRILL_CANDIDATES } from '@/lib/drillmatch/catalog';
import {
  aggregateDrillLibrary,
  type DrillContentLike,
  type DrillCandidateLike,
} from '@/lib/admin/drill-library/aggregate';
import { loadFindings } from '@/lib/admin/audits/data';
import { loadAlertCounts } from '@/lib/feature-education/server/data';
import { getPlatformMetrics } from '@/lib/admin/data/metrics';
import { runBranchGuardianScan } from '@/lib/branch-guardian/generate.server';
import { runSecurityScan } from '@/lib/security-os/generate.server';
import setupRegistry from '@/data/setup-registry.json';
import type {
  SignalBundle,
  SportCoverageSignal,
  AuditSignal,
  SetupSignal,
  FeatureEducationSignal,
  PlatformDataSignal,
  BranchHygieneSignal,
  SecurityPostureSignal,
} from './engine';

function safeSportCoverage(): { coverage: SportCoverageSignal[]; drills: number } {
  try {
    const library = aggregateDrillLibrary(
      DRILLS_CONTENT as unknown as DrillContentLike[],
      ALL_DRILL_CANDIDATES as unknown as DrillCandidateLike[],
    );
    const coverage: SportCoverageSignal[] = SPORT_TAXONOMY.map((s) => ({
      sportId: s.id,
      sportName: s.name,
      drillCount: library.stats.bySport[s.id] ?? 0,
    }));
    return { coverage, drills: library.stats.total };
  } catch {
    return { coverage: [], drills: 0 };
  }
}

function safeAuditFindings(): AuditSignal[] {
  try {
    return loadFindings()
      .filter((f) => f.trackStatus !== 'done')
      .map((f) => ({
        id: f.id,
        category: f.category,
        finding: f.finding,
        recommendation: f.recommendation,
        priority: f.priority,
        effort: f.effort,
        status: f.trackStatus,
      }));
  } catch {
    return [];
  }
}

async function safeFeatureEducation(): Promise<FeatureEducationSignal> {
  try {
    const c = await loadAlertCounts();
    return { gaps: c.gaps ?? 0, needsReview: c.needsReview ?? 0, drift: c.drift ?? 0 };
  } catch {
    return { gaps: 0, needsReview: 0, drift: 0 };
  }
}

interface RawSetupTask {
  id?: string;
  title?: string;
  plainEnglish?: string;
  category?: string;
  priority?: string;
}

function safeSetupTasks(): SetupSignal[] {
  try {
    const tasks = (setupRegistry as { tasks?: RawSetupTask[] }).tasks ?? [];
    return tasks
      .filter((t): t is Required<Pick<RawSetupTask, 'id' | 'title'>> & RawSetupTask => Boolean(t?.id && t?.title))
      .map((t) => ({
        id: t.id,
        title: t.title,
        plainEnglish: t.plainEnglish ?? '',
        category: t.category ?? 'setup',
        priority: t.priority ?? 'optional',
      }));
  } catch {
    return [];
  }
}

/** Live cross-user platform counts → the data-readiness fuel. Defensive. */
async function safePlatformData(): Promise<PlatformDataSignal> {
  try {
    const m = await getPlatformMetrics();
    if (!m.connected) {
      return { connected: false, reason: m.reason, sessions: null, analyses: null, community: null, activeSports: 0 };
    }
    return {
      connected: true,
      sessions: m.counts.sessions,
      analyses: m.counts.analyses,
      community: m.counts.community,
      activeSports: m.sportUsage.filter((u) => u.sessions > 0).length,
    };
  } catch {
    return { connected: false, reason: 'Platform metrics unavailable.', sessions: null, analyses: null, community: null, activeSports: 0 };
  }
}

/** Git/worktree hygiene roll-up from BranchGuardianOS. Defensive. */
function safeBranchHygiene(now: Date): BranchHygieneSignal {
  try {
    const scan = runBranchGuardianScan(undefined, now);
    if (!scan.isGitRepo) {
      return { available: false, staleBranches: 0, mergedEligible: 0, worktreesNeedingReview: 0, maxBehindMain: 0, worstBehindBranch: null, riskyUntracked: 0, cleanliness: 0 };
    }
    let maxBehindMain = 0;
    let worstBehindBranch: string | null = null;
    for (const b of scan.branches) {
      if (b.isProtected || b.type === 'main') continue;
      const behind = b.behindMain ?? 0;
      if (behind > maxBehindMain) {
        maxBehindMain = behind;
        worstBehindBranch = b.name;
      }
    }
    return {
      available: true,
      staleBranches: scan.cleanliness.counts.staleBranches,
      mergedEligible: scan.cleanliness.counts.mergedEligible,
      worktreesNeedingReview: scan.cleanliness.counts.worktreesNeedingReview,
      maxBehindMain,
      worstBehindBranch,
      riskyUntracked: scan.cleanliness.counts.riskyUntracked,
      cleanliness: scan.cleanliness.value,
    };
  } catch {
    return { available: false, staleBranches: 0, mergedEligible: 0, worktreesNeedingReview: 0, maxBehindMain: 0, worstBehindBranch: null, riskyUntracked: 0, cleanliness: 0 };
  }
}

/** Security posture roll-up from securityOS. Defensive — never throws. */
function safeSecurityPosture(now: Date): SecurityPostureSignal {
  try {
    const scan = runSecurityScan(now);
    const sorted = [...scan.findings].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 } as const;
      return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
    });
    return {
      available: true,
      score: scan.score.overall,
      confidence: scan.score.confidence,
      critical: scan.score.counts.critical ?? 0,
      high: scan.score.counts.high ?? 0,
      topFinding: sorted[0]?.title ?? null,
      hasUnknowns: scan.hasUnknowns,
    };
  } catch {
    return { available: false, score: 0, confidence: 0, critical: 0, high: 0, topFinding: null, hasUnknowns: false };
  }
}

function analyticsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ||
      process.env.NEXT_PUBLIC_GA_ID ||
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
  );
}

/** Gather every live signal into the bundle the engine consumes. */
export async function gatherSignals(now: Date = new Date()): Promise<SignalBundle> {
  const { coverage, drills } = safeSportCoverage();
  const auditFindings = safeAuditFindings();
  const setupTasks = safeSetupTasks();
  const [featureEducation, platformData] = await Promise.all([
    safeFeatureEducation(),
    safePlatformData(),
  ]);

  return {
    now: now.toISOString(),
    sportCoverage: coverage,
    auditFindings,
    setupTasks,
    featureEducation,
    platformData,
    analyticsConfigured: analyticsConfigured(),
    branchHygiene: safeBranchHygiene(now),
    securityPosture: safeSecurityPosture(now),
    totals: {
      features: 0, // reserved — feature totals can feed future readiness rules
      sports: SPORT_TAXONOMY.length,
      drills,
    },
  };
}
