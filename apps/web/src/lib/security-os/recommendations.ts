// ============================================================
// securityOS — recommendation engine (PURE)
// ------------------------------------------------------------
// Turns the derived findings into a prioritized, bucketed "what to do" list
// for the operator: Do Today / This Week / Monitor / Needs Manual Setup /
// Waiting on Credentials. Each recommendation explains why it matters, the
// business impact, the exact steps, whether Claude Code can fix it now, and
// whether it needs credentials or belongs in CI. PURE + deterministic.
// ============================================================

import type {
  PriorityBand,
  RecommendationBucket,
  SecurityFinding,
  SecurityRecommendation,
  Severity,
} from './types';
import { SEVERITY_RANK } from './types';

/** Severity → base priority score (0–100). Higher = more urgent. */
const SEVERITY_SCORE: Record<Severity, number> = {
  critical: 95,
  high: 78,
  medium: 55,
  low: 32,
  informational: 14,
};

function priorityBand(score: number): PriorityBand {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Decide which bucket a finding's recommendation belongs in. Order matters:
 * blocked-on-credentials and manual-setup are surfaced distinctly so the
 * operator knows what they (vs Claude Code) must do.
 */
export function bucketFor(f: SecurityFinding): RecommendationBucket {
  if (f.needsCredentials) return 'waiting_on_credentials';
  if (!f.canClaudeFix) return 'needs_manual_setup';
  if (f.severity === 'critical' || f.severity === 'high') return 'do_today';
  if (f.severity === 'medium') return 'this_week';
  return 'monitor';
}

const RELATED_LINKS = [
  { label: 'Findings', href: '/admin/security-os/findings' },
  { label: 'Security & Roles', href: '/admin/security' },
];

/** Build a recommendation from a single finding. */
export function recommendationFromFinding(f: SecurityFinding): SecurityRecommendation {
  const base = SEVERITY_SCORE[f.severity];
  // Ease-of-fix nudges priority up slightly when Claude can fix it now.
  const easeBonus = f.canClaudeFix && !f.needsCredentials ? 4 : 0;
  const score = Math.min(100, Math.round(base * 0.85 + f.riskScore * 0.15) + easeBonus);
  return {
    id: `rec:${f.id}`,
    title: f.title,
    summary: f.description,
    category: f.category,
    riskDomain: f.riskDomain,
    priorityScore: score,
    priorityBand: priorityBand(score),
    bucket: bucketFor(f),
    effort: f.effort,
    confidence: f.source === 'posture-scan' ? 90 : 82,
    whyItMatters: f.businessImpact,
    whatCouldHappen: f.technicalImpact,
    businessImpact: f.businessImpact,
    stepByStepActions: f.stepByStepActions,
    canClaudeFix: f.canClaudeFix,
    needsCredentials: f.needsCredentials,
    addToCi: Boolean(f.addToCi),
    relatedFindingId: f.id,
    relatedLinks: [{ label: 'Open finding', href: `/admin/security-os/findings/${encodeURIComponent(f.id)}` }, ...RELATED_LINKS],
    dueDate: f.dueDate,
    isSeed: f.isSeed,
  };
}

/**
 * Generate the prioritized recommendation list from findings. Only OPEN
 * findings produce recommendations — resolved/accepted ones drop out (the
 * caller passes the already-overlaid open set, or raw findings pre-triage).
 */
export function generateRecommendations(findings: SecurityFinding[]): SecurityRecommendation[] {
  return findings
    .map(recommendationFromFinding)
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        a.dueDate.localeCompare(b.dueDate) ||
        a.id.localeCompare(b.id),
    );
}

export type BucketedRecommendations = Record<RecommendationBucket, SecurityRecommendation[]>;

/** Group recommendations by bucket for the Recommendations page. */
export function bucketRecommendations(recs: SecurityRecommendation[]): BucketedRecommendations {
  const out: BucketedRecommendations = {
    do_today: [],
    this_week: [],
    monitor: [],
    needs_manual_setup: [],
    waiting_on_credentials: [],
  };
  for (const r of recs) out[r.bucket].push(r);
  return out;
}

/** The single highest-priority recommendation — "do this first today". */
export function topRecommendation(recs: SecurityRecommendation[]): SecurityRecommendation | null {
  return (
    [...recs].sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        SEVERITY_RANK[severityOf(a)] - SEVERITY_RANK[severityOf(b)],
    )[0] ?? null
  );
}

// Recommendations don't carry severity directly; infer band→severity for ties.
function severityOf(r: SecurityRecommendation): Severity {
  if (r.priorityBand === 'critical') return 'critical';
  if (r.priorityBand === 'high') return 'high';
  if (r.priorityBand === 'medium') return 'medium';
  return 'low';
}
