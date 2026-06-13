// ============================================================
// Player Experience Overhaul — Skill tree (WS-03)
// ------------------------------------------------------------
// A per-player skill tree COMPOSED from the athletic-journey skill branches
// (which already fold in sessions, reports, and retests). We map each branch
// to a node with a deterministic status + structured evidence. No scoring is
// recomputed and nothing is fabricated: a node with no data is honestly
// 'available', not given a made-up score.
// ============================================================

import type {
  SkillBranchState,
  CategoryScore,
  ClassificationCategory,
  SportAvailability,
} from '@/lib/athletic-journey/types';
import type { SkillNodeStatus } from '@/lib/db/shared-enums';

export type { SkillNodeStatus };

export interface NodeEvidence {
  /** Why the node is in its current state. */
  summary: string;
  /** 0..1 confidence in the node's score (from the category signal). */
  confidence: number;
  sourceSessionIds: string[];
  sourceReportIds: string[];
  retestDates: string[];
  lastUpdatedAt: string;
}

export interface SkillNode {
  id: string;
  sport: string;
  category: ClassificationCategory;
  name: string;
  status: SkillNodeStatus;
  /** Coarse 0..5 level for display (derived from progress). */
  level: number;
  /** 0..100 progress, or null when there is no data yet. */
  progressScore: number | null;
  /** 0..1 confidence, or null. */
  confidenceScore: number | null;
  evidence: NodeEvidence;
}

export type SkillTreeCoverage = 'none' | 'starter' | 'partial' | 'rich';

export interface SkillTree {
  sport: string;
  availability: SportAvailability | 'unknown';
  nodes: SkillNode[];
  coverage: SkillTreeCoverage;
  generatedAt: string;
}

export interface BuildSkillTreeInput {
  sport: string;
  availability?: SportAvailability | 'unknown';
  branches: SkillBranchState[];
  categoryScores?: CategoryScore[];
  /** Categories currently regressing (from priority/momentum), if known. */
  regressedCategories?: ClassificationCategory[];
  now?: string;
}

/**
 * Deterministic status from a branch's score, evidence, and flags.
 * Pure + exhaustive over the SkillNodeStatus set.
 */
export function deriveNodeStatus(opts: {
  score: number | null;
  evidenceCount: number;
  flagged: boolean;
  regressed?: boolean;
}): SkillNodeStatus {
  if (opts.regressed) return 'regressed';
  if (opts.score === null) {
    // No measured score yet: available to start once there's any evidence,
    // otherwise still available (no prerequisite gating in the MVP).
    return opts.evidenceCount > 0 ? 'active' : 'available';
  }
  if (opts.score >= 80) return 'mastered';
  if (opts.flagged) return 'needs_attention';
  if (opts.score >= 60) return 'improving';
  if (opts.score >= 40) return 'active';
  return 'needs_attention';
}

function levelFromScore(score: number | null): number {
  if (score === null) return 0;
  return Math.max(0, Math.min(5, Math.round(score / 20)));
}

function statusSummary(status: SkillNodeStatus, name: string): string {
  switch (status) {
    case 'mastered': return `${name} is a clear strength.`;
    case 'improving': return `${name} is trending up — keep it going.`;
    case 'active': return `${name} is in active development.`;
    case 'needs_attention': return `${name} is a current focus area.`;
    case 'regressed': return `${name} has slipped recently — worth a retest.`;
    case 'available': return `${name} is ready to start — add data to unlock insights.`;
    case 'locked': return `${name} unlocks as you progress.`;
    default: return name;
  }
}

function coverageOf(nodes: SkillNode[]): SkillTreeCoverage {
  const withData = nodes.filter((n) => n.progressScore !== null).length;
  if (nodes.length === 0) return 'none';
  if (withData === 0) return 'starter';
  const ratio = withData / nodes.length;
  return ratio >= 0.6 ? 'rich' : 'partial';
}

/**
 * Build the skill tree from journey branch state. Works for a brand-new
 * player (a "starter tree" of available nodes) and a data-rich one alike.
 */
export function buildSkillTree(input: BuildSkillTreeInput): SkillTree {
  const now = input.now ?? new Date().toISOString();
  const regressed = new Set(input.regressedCategories ?? []);
  const confidenceFor = (c: ClassificationCategory): number =>
    input.categoryScores?.find((s) => s.category === c)?.confidence ?? 0;

  const nodes: SkillNode[] = input.branches.map((b) => {
    const status = deriveNodeStatus({
      score: b.score,
      evidenceCount: b.evidenceCount,
      flagged: b.flagged,
      regressed: regressed.has(b.category),
    });
    const confidence = b.score === null ? null : confidenceFor(b.category);
    return {
      id: b.id,
      sport: input.sport,
      category: b.category,
      name: b.name,
      status,
      level: levelFromScore(b.score),
      progressScore: b.score,
      confidenceScore: confidence,
      evidence: {
        summary: statusSummary(status, b.name),
        confidence: confidence ?? 0,
        sourceSessionIds: [],
        sourceReportIds: [],
        retestDates: [],
        lastUpdatedAt: now,
      },
    };
  });

  return {
    sport: input.sport,
    availability: input.availability ?? 'unknown',
    nodes,
    coverage: coverageOf(nodes),
    generatedAt: now,
  };
}
