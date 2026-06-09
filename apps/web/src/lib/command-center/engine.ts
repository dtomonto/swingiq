// ============================================================
// Today's Command Center — recommendation engine (PURE / deterministic)
// ------------------------------------------------------------
// Turns a SignalBundle (gathered server-side from live registries) into a
// scored, de-duplicated list of Recommendations. This module is pure: no
// fs, no env, no React — feed it signals, get recommendations. That makes
// every rule unit-testable and the output stable for a given input.
//
// Rule-based first, by design. Each rule is a small function that reads a
// slice of the bundle and emits zero or more recommendations. The shape is
// LLM-ready: a future rule can call a model to phrase/rank, but the scoring
// and dedupe contract stays the same.
// ============================================================

import type {
  Recommendation,
  RecommendationType,
  RecommendationCategory,
  Effort,
  Level,
  SourceEngine,
  ScoreFactors,
} from './types';
import { TYPE_CATEGORY } from './types';
import { EFFORT_PENALTY, scoreRecommendation } from './scoring';

// ── Signal inputs (gathered by signals.server.ts) ────────────────────────────

/** Per-sport drill coverage, from the real drill catalogs. */
export interface SportCoverageSignal {
  sportId: string;
  sportName: string;
  drillCount: number;
}

/** An open audit finding worth surfacing. */
export interface AuditSignal {
  id: string;
  category: string;
  finding: string;
  recommendation: string;
  /** P0 | P1 | P2 | P3. */
  priority: string;
  effort?: string;
  status: string;
}

/** A pending manual setup/admin-config task. */
export interface SetupSignal {
  id: string;
  title: string;
  plainEnglish: string;
  category: string;
  priority: string;
}

/** Feature-education coverage roll-up (already computed elsewhere). */
export interface FeatureEducationSignal {
  /** Features with no learning content. */
  gaps: number;
  /** Drafts awaiting review. */
  needsReview: number;
  /** Drift findings (docs out of date vs shipped feature). */
  drift: number;
}

/**
 * Live cross-user platform data (service-role counts), the raw fuel the
 * data-hungry intelligence features need. `null` counts mean "not available"
 * (live data is off) — never zero. This is what powers the data-readiness
 * rule: "feature X needs N more sessions/analyses before it works."
 */
export interface PlatformDataSignal {
  /** Whether the service-role client returned live cross-user data. */
  connected: boolean;
  /** Why live data is unavailable (only when !connected). */
  reason?: string;
  sessions: number | null;
  analyses: number | null;
  community: number | null;
  /** Distinct sports with at least one logged session. */
  activeSports: number;
}

/**
 * Git hygiene roll-up from the BranchGuardianOS snapshot (no git is run here —
 * the counts come from the committed snapshot). Drives the branch-hygiene rule.
 */
export interface BranchHygieneSignal {
  /** Whether a usable git snapshot exists. */
  available: boolean;
  staleBranches: number;
  mergedEligible: number;
  worktreesNeedingReview: number;
  /** Worst "commits behind main" among working branches. */
  maxBehindMain: number;
  /** Name of the branch that is furthest behind (for the copy). */
  worstBehindBranch: string | null;
  riskyUntracked: number;
  cleanliness: number;
}

/** Security posture roll-up from securityOS (overall score + open findings). */
export interface SecurityPostureSignal {
  /** Whether a usable scan was produced. */
  available: boolean;
  /** Overall 0–100 weighted security score. */
  score: number;
  /** 0–100 — share of checks that produced a real (non-unknown) signal. */
  confidence: number;
  /** Count of open critical-severity findings. */
  critical: number;
  /** Count of open high-severity findings. */
  high: number;
  /** Title of the most severe open finding, for the recommendation copy. */
  topFinding: string | null;
  /** True when at least one check could not be read (lowers confidence). */
  hasUnknowns: boolean;
}

/** Everything the engine needs, gathered once per scan. */
export interface SignalBundle {
  /** ISO date-time of the scan. */
  now: string;
  sportCoverage: SportCoverageSignal[];
  auditFindings: AuditSignal[];
  setupTasks: SetupSignal[];
  featureEducation: FeatureEducationSignal;
  /** Live platform data counts (drives data-readiness recommendations). */
  platformData: PlatformDataSignal;
  /** Whether a product-analytics provider key is configured. */
  analyticsConfigured: boolean;
  /** Git/worktree hygiene roll-up from BranchGuardianOS. */
  branchHygiene: BranchHygieneSignal;
  /**
   * Security posture roll-up from securityOS. Optional so existing bundle
   * builders/tests stay valid; the rule no-ops when it is absent/unavailable.
   */
  securityPosture?: SecurityPostureSignal;
  totals: { features: number; sports: number; drills: number };
}

/**
 * Data thresholds — the minimum live data each intelligence feature needs
 * before its output is trustworthy. Conservative on purpose: enough signal
 * to matter, low enough to reach early. Tuned here in one place.
 */
export const DATA_THRESHOLDS = {
  /** Swing analyses before quality queues / score trends are meaningful. */
  analysesForTrends: 10,
  /** Practice sessions before benchmark grading calibrates. */
  sessionsForGrading: 20,
  /** Practice sessions before the priority/progress engine is stable. */
  sessionsForPriority: 10,
  /** Distinct active sports before cross-sport (AGI) transfer applies. */
  sportsForCrossSport: 2,
  /** Community/XP records before Founding-Members momentum reads as real. */
  communityForMomentum: 5,
} as const;

// ── Rule helpers ─────────────────────────────────────────────────────────────

const LEVEL_FROM_SCORE = (n: number, hi: number): Level =>
  n >= hi * 0.66 ? 'high' : n >= hi * 0.33 ? 'medium' : 'low';

interface DraftInput {
  id: string;
  title: string;
  summary: string;
  recommendationType: RecommendationType;
  category?: RecommendationCategory;
  relatedFeature?: string;
  relatedSport?: string;
  relatedSystem?: string;
  effort: Effort;
  confidence: number;
  factors: Omit<ScoreFactors, 'effortPenalty'>;
  dueInDays: number;
  evidence: string[];
  reason: string;
  missingData?: string;
  requiredData?: string[];
  howToComplete: string;
  stepByStepActions: string[];
  expectedOutcome: string;
  riskIfIgnored: string;
  completionCriteria: string;
  sourceEngine: SourceEngine;
  relatedLinks?: { label: string; href: string }[];
  isSeed?: boolean;
}

/** Finalize a draft into a fully-scored Recommendation. */
function build(now: string, d: DraftInput): Recommendation {
  const breakdown = scoreRecommendation({
    ...d.factors,
    effortPenalty: EFFORT_PENALTY[d.effort],
  });
  const due = new Date(now);
  due.setDate(due.getDate() + d.dueInDays);

  return {
    id: d.id,
    title: d.title,
    summary: d.summary,
    recommendationType: d.recommendationType,
    category: d.category ?? TYPE_CATEGORY[d.recommendationType],
    relatedFeature: d.relatedFeature,
    relatedSport: d.relatedSport,
    relatedSystem: d.relatedSystem,
    priorityScore: breakdown.score,
    priorityBand: breakdown.band,
    scoreBreakdown: breakdown,
    urgency: LEVEL_FROM_SCORE(d.factors.urgency, 20),
    impact: LEVEL_FROM_SCORE(d.factors.impact, 25),
    effort: d.effort,
    confidence: d.confidence,
    generatedAt: now,
    dueDate: due.toISOString().slice(0, 10),
    evidence: d.evidence,
    reason: d.reason,
    missingData: d.missingData,
    requiredData: d.requiredData,
    howToComplete: d.howToComplete,
    stepByStepActions: d.stepByStepActions,
    expectedOutcome: d.expectedOutcome,
    riskIfIgnored: d.riskIfIgnored,
    completionCriteria: d.completionCriteria,
    sourceEngine: d.sourceEngine,
    relatedLinks: d.relatedLinks ?? [],
    isSeed: d.isSeed,
  };
}

const AUDIT_FACTORS: Record<string, { urgency: number; risk: number; strategic: number }> = {
  P0: { urgency: 20, risk: 20, strategic: 12 },
  P1: { urgency: 15, risk: 15, strategic: 11 },
  P2: { urgency: 9, risk: 9, strategic: 8 },
  P3: { urgency: 4, risk: 5, strategic: 5 },
};

const AUDIT_TYPE: Array<[RegExp, RecommendationType]> = [
  [/secur|privacy|auth|rls/i, 'security'],
  [/seo|brand|geo|aeo/i, 'seo_growth'],
  [/perf|speed|bundle|latency/i, 'performance'],
  [/a11y|accessib/i, 'product_quality'],
  [/test|coverage/i, 'testing'],
];

function auditEffort(raw?: string): Effort {
  const s = (raw ?? '').toUpperCase();
  if (s.includes('XL')) return 'XL';
  if (s.includes('L')) return 'L';
  if (s.includes('M')) return 'M';
  return 'S';
}

// ── Rules ────────────────────────────────────────────────────────────────────

/**
 * Sport coverage gaps — REAL: computed from the shipped drill catalogs.
 * A sport whose drill count is far below the best-served sport (or simply
 * thin in absolute terms) gets a content/data-gap recommendation.
 */
export function ruleSportCoverage(bundle: SignalBundle): Recommendation[] {
  const cov = bundle.sportCoverage;
  if (cov.length === 0) return [];
  const leader = Math.max(...cov.map((c) => c.drillCount), 0);
  if (leader === 0) return [];

  const out: Recommendation[] = [];
  for (const s of cov) {
    const thin = s.drillCount < Math.max(6, leader * 0.4);
    if (!thin) continue;
    const deficit = Math.max(0, Math.round(leader * 0.4) - s.drillCount);
    out.push(
      build(bundle.now, {
        id: `sport-coverage:${s.sportId}`,
        title: `${s.sportName} drill coverage is thin — add ${Math.max(5, deficit)} drills`,
        summary: `${s.sportName} ships ${s.drillCount} drill${s.drillCount === 1 ? '' : 's'} vs ${leader} for the best-served sport. Thin coverage means weaker, repetitive practice plans and fewer fault→drill matches.`,
        recommendationType: 'content_gap',
        category: 'Content',
        relatedSport: s.sportName,
        relatedSystem: 'Drill Library / DrillMatch',
        effort: 'M',
        confidence: 90,
        factors: { impact: 16, urgency: 8, confidence: 14, affectedUsers: 11, strategic: 12, risk: 10 },
        dueInDays: 7,
        evidence: [
          `${s.sportName}: ${s.drillCount} drills in the unified catalog`,
          `Best-served sport: ${leader} drills`,
          `Target floor (40% of leader): ${Math.round(leader * 0.4)} drills`,
        ],
        reason: `Under-served sports produce thin, repetitive practice plans and miss fault→drill matches, which lowers perceived AI quality for those athletes.`,
        missingData: `Curated drills for ${s.sportName} across beginner/intermediate/advanced, each tagged to a target fault.`,
        requiredData: [
          `${Math.max(5, deficit)} drills with: title, target fault/skill, difficulty, duration/reps, equipment, ordered steps`,
          'At least one common mistake + correction per drill',
          'Coverage across the 3 difficulty levels',
        ],
        howToComplete: `Add drills for ${s.sportName} in data/drills-content.ts (and fault-matched candidates in the DrillMatch catalog), then re-check the Drill Library coverage view.`,
        stepByStepActions: [
          `Open the Drill Library (/admin/drills) and filter to ${s.sportName} to see what already exists.`,
          `Author ${Math.max(5, deficit)} new drills covering the most common faults for this sport.`,
          'Tag each drill with sport, target fault, difficulty, duration and ordered steps.',
          'Add fault-matched candidates so DrillMatch can recommend them on /fix.',
          'Re-run the Intelligence Scan to confirm the gap closes.',
        ],
        expectedOutcome: `${s.sportName} practice plans become varied and fault-targeted, raising AI usefulness for those athletes.`,
        riskIfIgnored: `${s.sportName} athletes keep getting repetitive plans, eroding trust in the product for that sport.`,
        completionCriteria: `${s.sportName} drill count reaches at least ${Math.round(leader * 0.4)} in the Drill Library and the scan no longer flags it.`,
        sourceEngine: 'sport-coverage',
        relatedLinks: [
          { label: 'Drill Library', href: '/admin/drills' },
          { label: 'Sports config', href: `/admin/sports` },
        ],
      }),
    );
  }
  return out;
}

/** Open audit findings → security / quality / SEO recommendations. */
export function ruleAuditFindings(bundle: SignalBundle): Recommendation[] {
  const open = bundle.auditFindings.filter(
    (f) => f.priority === 'P0' || f.priority === 'P1',
  );
  return open.slice(0, 8).map((f) => {
    const fac = AUDIT_FACTORS[f.priority] ?? AUDIT_FACTORS.P2;
    const type = AUDIT_TYPE.find(([re]) => re.test(`${f.category} ${f.finding}`))?.[1] ?? 'product_quality';
    return build(bundle.now, {
      id: `audit:${f.id}`,
      title: f.finding.length > 110 ? f.finding.slice(0, 107) + '…' : f.finding,
      summary: `Audit finding ${f.id} (${f.priority}, ${f.category}). ${f.recommendation}`,
      recommendationType: type,
      relatedSystem: f.category,
      effort: auditEffort(f.effort),
      confidence: 85,
      factors: { impact: f.priority === 'P0' ? 20 : 16, confidence: 13, affectedUsers: 10, ...fac },
      dueInDays: f.priority === 'P0' ? 1 : 4,
      evidence: [`Audit finding ${f.id}`, `Priority ${f.priority}`, `Category: ${f.category}`, `Status: ${f.status}`],
      reason: `Flagged by an internal audit robot. ${f.priority} findings are the highest-confidence, highest-leverage fixes available right now.`,
      howToComplete: f.recommendation || 'Resolve the finding, then mark it done in Audit Reports.',
      stepByStepActions: [
        'Open the finding in Audit Reports for full context.',
        f.recommendation || 'Apply the recommended fix.',
        'Verify the fix locally (build / lint / tests as appropriate).',
        'Mark the finding done in /admin/audits.',
      ],
      expectedOutcome: 'The audited risk is closed and the finding moves to done.',
      riskIfIgnored:
        f.priority === 'P0'
          ? 'A critical (P0) issue stays live — potential security, trust or correctness exposure.'
          : 'A high-priority issue lingers and compounds with future work.',
      completionCriteria: `Finding ${f.id} is marked done in Audit Reports.`,
      sourceEngine: 'audit',
      relatedLinks: [{ label: 'Audit Reports', href: '/admin/audits' }],
    });
  });
}

/** Feature-education coverage → tutorial/documentation gap. */
export function ruleFeatureEducation(bundle: SignalBundle): Recommendation[] {
  const { gaps, needsReview, drift } = bundle.featureEducation;
  const out: Recommendation[] = [];
  if (gaps > 0) {
    out.push(
      build(bundle.now, {
        id: 'feature-education:gaps',
        title: `${gaps} shipped feature${gaps === 1 ? '' : 's'} lack learning content`,
        summary: `New features were auto-detected without tutorials, how-tos or manuals. Undocumented features get lower adoption and generate avoidable support load.`,
        recommendationType: 'tutorial_gap',
        relatedSystem: 'Feature Education',
        effort: 'M',
        confidence: 88,
        factors: { impact: 13, urgency: 7, confidence: 14, affectedUsers: 12, strategic: 9, risk: 8 },
        dueInDays: 5,
        evidence: [`${gaps} feature(s) with no education coverage`, `${drift} drift finding(s)`],
        reason: 'Features users can\'t learn don\'t get used. Documentation also feeds SEO/AEO and reduces support tickets.',
        missingData: 'Tutorials, how-tos, manuals and FAQs for recently shipped features.',
        howToComplete: 'Open Feature Education, generate the learning package for each gap, review and publish.',
        stepByStepActions: [
          'Open Feature Education (/admin/feature-education).',
          'For each gap, generate the draft learning package.',
          'Review for accuracy and publish the approved pieces.',
        ],
        expectedOutcome: 'Every shipped feature has a tutorial + help content, raising adoption and search coverage.',
        riskIfIgnored: 'New features stay under-used and support questions accumulate.',
        completionCriteria: 'Feature Education reports zero coverage gaps.',
        sourceEngine: 'feature-readiness',
        relatedLinks: [{ label: 'Feature Education', href: '/admin/feature-education' }],
      }),
    );
  }
  if (needsReview > 0) {
    out.push(
      build(bundle.now, {
        id: 'feature-education:needs-review',
        title: `${needsReview} learning draft${needsReview === 1 ? '' : 's'} await your review`,
        summary: 'Auto-generated tutorials/how-tos/docs are ready to approve before publishing.',
        recommendationType: 'documentation',
        relatedSystem: 'Feature Education',
        effort: 'S',
        confidence: 95,
        factors: { impact: 9, urgency: 8, confidence: 15, affectedUsers: 8, strategic: 6, risk: 5 },
        dueInDays: 3,
        evidence: [`${needsReview} draft(s) in the review queue`],
        reason: 'Drafts only help users once published — a quick review unblocks them.',
        howToComplete: 'Review each draft in Feature Education and publish the ones that are accurate.',
        stepByStepActions: [
          'Open Feature Education.',
          'Read each draft for accuracy and tone.',
          'Publish the approved drafts.',
        ],
        expectedOutcome: 'Approved help content goes live for users.',
        riskIfIgnored: 'Useful, already-written content sits unpublished.',
        completionCriteria: 'The Feature Education review queue is empty.',
        sourceEngine: 'feature-readiness',
        relatedLinks: [{ label: 'Feature Education', href: '/admin/feature-education' }],
      }),
    );
  }
  return out;
}

/** Missing product-analytics provider key → analytics gap (REAL: env-derived). */
export function ruleAnalytics(bundle: SignalBundle): Recommendation[] {
  if (bundle.analyticsConfigured) return [];
  return [
    build(bundle.now, {
      id: 'analytics:provider-key',
      title: 'Connect a product-analytics provider to start measuring behaviour',
      summary:
        'No analytics provider key is configured, so the platform can\'t measure funnels, retention or feature adoption — which means future recommendations stay rule-based instead of behaviour-driven.',
      recommendationType: 'analytics_gap',
      relatedSystem: 'Analytics OS',
      effort: 'S',
      confidence: 92,
      factors: { impact: 18, urgency: 11, confidence: 14, affectedUsers: 13, strategic: 14, risk: 12 },
      dueInDays: 2,
      evidence: [
        'No NEXT_PUBLIC_PLAUSIBLE_DOMAIN / GA / PostHog key detected in the environment',
        'Analytics-driven recommendations are blocked until events flow',
      ],
      reason:
        'Without analytics the system is flying blind on adoption and retention. This is the single highest-leverage unlock for data-driven recommendations.',
      missingData: 'A live product-analytics stream (page views, funnels, feature events, retention).',
      requiredData: ['One provider key: Plausible domain, GA measurement id, or PostHog project key'],
      howToComplete: 'Paste one analytics provider key into the environment, redeploy, and confirm events arrive.',
      stepByStepActions: [
        'Pick a provider (Plausible, GA4 or PostHog).',
        'Set the matching NEXT_PUBLIC_* env var (see /admin/setup for the exact name).',
        'Redeploy and open Analytics OS to confirm events are flowing.',
      ],
      expectedOutcome: 'Funnels, retention and feature adoption become measurable; the engine can move from rules to behaviour.',
      riskIfIgnored: 'Every product decision stays a guess and behaviour-driven recommendations remain impossible.',
      completionCriteria: 'A provider key is set and Analytics OS shows live events.',
      sourceEngine: 'analytics',
      relatedLinks: [
        { label: 'Setup & Next Steps', href: '/admin/setup' },
        { label: 'Analytics OS', href: '/admin/analytics' },
      ],
    }),
  ];
}

/** Pending manual setup tasks → admin configuration roll-up. */
export function ruleSetup(bundle: SignalBundle): Recommendation[] {
  const pending = bundle.setupTasks.filter((t) => t.priority !== 'optional');
  if (pending.length === 0) return [];
  const top = pending[0];
  return [
    build(bundle.now, {
      id: 'setup:pending',
      title: `${pending.length} setup step${pending.length === 1 ? '' : 's'} still need you`,
      summary: `Recommended setup tasks are unfinished (e.g. "${top.title}"). These unlock or harden features.`,
      recommendationType: 'admin_configuration',
      relatedSystem: 'Setup & Next Steps',
      effort: 'S',
      confidence: 80,
      factors: { impact: 11, urgency: 7, confidence: 12, affectedUsers: 9, strategic: 9, risk: 8 },
      dueInDays: 5,
      evidence: pending.slice(0, 4).map((t) => `${t.priority}: ${t.title}`),
      reason: 'Unfinished setup leaves features half-configured — keys missing, schema unapplied, integrations dark.',
      howToComplete: 'Work the recommended cards in Setup & Next Steps; each has copy-paste values and live "done" detection.',
      stepByStepActions: [
        'Open Setup & Next Steps (/admin/setup).',
        'Complete the recommended (non-optional) cards.',
        'Confirm each card auto-detects as done.',
      ],
      expectedOutcome: 'Features are fully configured and stop silently degrading.',
      riskIfIgnored: 'Features appear broken or stay disabled because a one-time setup step was skipped.',
      completionCriteria: 'No recommended setup tasks remain pending in /admin/setup.',
      sourceEngine: 'setup',
      relatedLinks: [{ label: 'Setup & Next Steps', href: '/admin/setup' }],
    }),
  ];
}

/**
 * Always-on baseline recommendations. These are operator best-practices that
 * stay valuable even when live analytics are thin. They are flagged isSeed so
 * the UI labels them "Initial system recommendation" — never mistaken for
 * measured analytics. Owners can dismiss any that don't apply.
 */
export function ruleBaseline(bundle: SignalBundle): Recommendation[] {
  const seeds: DraftInput[] = [
    {
      id: 'baseline:feedback-loop',
      title: 'Add a post-drill feedback prompt to close the learning loop',
      summary:
        'After a user completes a recommended drill, ask whether it helped, whether the diagnosis felt accurate, and whether they want it easier or harder. This is the outcome signal CentralIntelligenceOS needs to actually learn.',
      recommendationType: 'user_feedback',
      relatedSystem: 'CentralIntelligenceOS',
      effort: 'M',
      confidence: 70,
      factors: { impact: 17, urgency: 8, confidence: 10, affectedUsers: 13, strategic: 14, risk: 9 },
      dueInDays: 14,
      evidence: ['No post-recommendation outcome feedback is collected today', 'Outcome data is the moat for issue→drill→result learning'],
      reason: 'Without outcome feedback the AI can recommend but never learn what worked — the single biggest gap in the learning loop.',
      missingData: 'Did-this-help / accuracy / difficulty signals after each completed drill.',
      requiredData: ['Helpful (yes/no)', 'Diagnosis accurate (yes/no)', 'Wanted easier/harder', 'Optional free-text'],
      howToComplete: 'Add a lightweight feedback prompt at drill completion and persist it to the outcome store CentralIntelligenceOS reads.',
      stepByStepActions: [
        'Add a 3-tap feedback prompt at the end of a drill on /fix.',
        'Persist the answer locally + to the synced store.',
        'Surface the aggregate in CentralIntelligenceOS and Coach Mix trends.',
      ],
      expectedOutcome: 'The product starts learning which drills resolve which faults for which players.',
      riskIfIgnored: 'The recommendation engine never improves from real outcomes.',
      completionCriteria: 'Post-drill feedback is captured and visible in CentralIntelligenceOS.',
      sourceEngine: 'baseline',
      relatedLinks: [{ label: 'Central Intelligence', href: '/admin/central-intelligence' }],
      isSeed: true,
    },
    {
      id: 'baseline:onboarding-skill-level',
      title: 'Validate that onboarding always captures skill level',
      summary:
        'AI recommendations and profile-aware grading depend on skill level. Confirm onboarding captures it consistently (required, not optional) for every sport.',
      recommendationType: 'user_onboarding',
      relatedSystem: 'Onboarding',
      effort: 'S',
      confidence: 65,
      factors: { impact: 15, urgency: 7, confidence: 9, affectedUsers: 13, strategic: 11, risk: 9 },
      dueInDays: 7,
      evidence: ['Grading + recommendations are profile-aware and degrade without skill level'],
      reason: 'Missing skill level forces the AI to grade against generic benchmarks, lowering accuracy and trust.',
      missingData: 'Consistent, required skill-level capture across all sports at onboarding.',
      howToComplete: 'Audit the onboarding flow; make skill level a required step for every sport; backfill prompts for existing users.',
      stepByStepActions: [
        'Review the onboarding state machine for the skill-level step.',
        'Make it required (with an honest "not sure" path that still records a band).',
        'Add a dashboard nudge for users missing skill level.',
      ],
      expectedOutcome: 'Every athlete is graded against the right benchmark from day one.',
      riskIfIgnored: 'Recommendations feel generic and grading feels wrong for many users.',
      completionCriteria: 'Onboarding records a skill level (or explicit band) for 100% of new users.',
      sourceEngine: 'baseline',
      relatedLinks: [{ label: 'Athletes', href: '/admin/athletes' }],
      isSeed: true,
    },
    {
      id: 'baseline:sample-reports',
      title: 'Create at least one sample report per sport',
      summary:
        'Sample reports are the highest-converting proof surface. Ensure each of the 7 sports has a representative sample report a prospect can see before signing up.',
      recommendationType: 'conversion',
      relatedSystem: 'Marketing / Reports',
      effort: 'M',
      confidence: 68,
      factors: { impact: 14, urgency: 6, confidence: 9, affectedUsers: 10, strategic: 12, risk: 7 },
      dueInDays: 14,
      evidence: ['Sample reports drive conversion; coverage by sport is uneven'],
      reason: 'Prospects convert when they can see exactly what they\'ll get for their sport.',
      missingData: 'A polished sample report for every supported sport.',
      howToComplete: 'Generate a representative report per sport and publish it on the relevant sport hub.',
      stepByStepActions: [
        'List which sports already have a sample report.',
        'Generate a representative report for each missing sport.',
        'Link each from its sport hub and the pricing page.',
      ],
      expectedOutcome: 'Every sport hub has concrete proof, lifting signup conversion.',
      riskIfIgnored: 'Under-served sports convert worse because prospects can\'t picture the value.',
      completionCriteria: 'All 7 sports have a linked sample report.',
      sourceEngine: 'baseline',
      relatedLinks: [{ label: 'Sports config', href: '/admin/sports' }],
      isSeed: true,
    },
    {
      id: 'baseline:ai-confidence-explanation',
      title: 'Surface AI confidence explanations to admins',
      summary:
        'Make it visible WHY the AI scored a swing recommendation high/medium/low confidence, so you can spot diagnostic categories with thin sample coverage.',
      recommendationType: 'ai_quality',
      relatedSystem: 'AI Analyses',
      effort: 'M',
      confidence: 66,
      factors: { impact: 13, urgency: 6, confidence: 9, affectedUsers: 9, strategic: 11, risk: 8 },
      dueInDays: 14,
      evidence: ['Confidence scoring exists but its drivers aren\'t exposed to operators'],
      reason: 'Confidence without an explanation layer hides which diagnostic categories need more training examples.',
      missingData: 'A per-analysis explanation of the confidence drivers, visible in /admin/ai-analyses.',
      howToComplete: 'Log the confidence drivers per analysis and render them in the AI Analyses review view.',
      stepByStepActions: [
        'Capture the factors behind each confidence score.',
        'Render them in the AI Analyses detail view.',
        'Flag categories where confidence is consistently low.',
      ],
      expectedOutcome: 'You can see exactly which diagnostic categories need more data.',
      riskIfIgnored: 'Low-confidence categories stay invisible and never get the data they need.',
      completionCriteria: 'AI Analyses shows a confidence explanation for each reviewed analysis.',
      sourceEngine: 'baseline',
      relatedLinks: [{ label: 'AI Analyses', href: '/admin/ai-analyses' }],
      isSeed: true,
    },
  ];
  return seeds.map((s) => build(bundle.now, s));
}

/**
 * Live DATA-READINESS — REAL: derived from service-role platform counts.
 * This is the engine's answer to "the system needs more data for feature X
 * to work — what data, and how do I get it?" Each data-hungry feature is
 * checked against its threshold; if it's short, a fully-laid-out
 * recommendation is emitted with the exact gap, progress and how-to.
 *
 * When live data is OFF we never guess counts — we emit a single
 * connect-the-service-role recommendation instead, so the owner isn't told
 * to chase numbers the app can't read yet.
 */
export function ruleDataReadiness(bundle: SignalBundle): Recommendation[] {
  const pd = bundle.platformData;

  if (!pd.connected) {
    return [
      build(bundle.now, {
        id: 'data-readiness:connect-live-data',
        title: 'Connect live platform data so feature-readiness can be measured',
        summary:
          'The service-role key isn\'t set, so the app can\'t count sessions, analyses or sport usage — and the data-hungry features (trends, grading, the priority engine, cross-sport) can\'t be assessed or improved.',
        recommendationType: 'data_gap',
        category: 'Data',
        relatedSystem: 'Supabase / Platform metrics',
        effort: 'S',
        confidence: 95,
        factors: { impact: 22, urgency: 14, confidence: 15, affectedUsers: 14, strategic: 14, risk: 14 },
        dueInDays: 1,
        evidence: [
          pd.reason ?? 'SUPABASE_SERVICE_ROLE_KEY is not configured.',
          'Cross-user counts (sessions, analyses, community) are unavailable',
        ],
        reason:
          'Live counts are the foundation every data-readiness check reads from. Without them the intelligence layer can silently under-perform with no visibility.',
        missingData: 'Cross-user platform counts (sessions, swing analyses, community/XP records).',
        requiredData: ['SUPABASE_SERVICE_ROLE_KEY set server-side (plus the public Supabase keys)'],
        howToComplete:
          'Add the service-role key to your environment so the admin can read aggregate counts (it is never exposed to the browser).',
        stepByStepActions: [
          'Open your Supabase project → Project Settings → API.',
          'Copy the service_role key (NOT the anon key — keep it server-side only).',
          'Set SUPABASE_SERVICE_ROLE_KEY in your environment (Vercel → Environment Variables, or .env.local for local dev).',
          'Redeploy / restart, then re-run the Intelligence Scan — readiness checks will populate.',
        ],
        expectedOutcome: 'The cockpit can measure how much data each feature has and exactly how much more it needs.',
        riskIfIgnored: 'Data-driven features stay un-assessable; you can\'t tell what\'s working or what to feed.',
        completionCriteria: 'The service role is connected and live counts appear on the Command Center.',
        sourceEngine: 'data-gap',
        relatedLinks: [{ label: 'Integrations', href: '/admin/integrations' }],
      }),
    ];
  }

  interface DataFeature {
    id: string;
    name: string;
    /** Plural unit noun for the progress copy. */
    unit: string;
    have: number;
    need: number;
    /** What the feature does for the athlete. */
    does: string;
    /** Ordered steps to feed it. */
    steps: string[];
    relatedSystem: string;
    relatedLinks: { label: string; href: string }[];
  }

  const known = (n: number | null): n is number => typeof n === 'number';
  const sessions = known(pd.sessions) ? pd.sessions : 0;
  const analyses = known(pd.analyses) ? pd.analyses : 0;
  const community = known(pd.community) ? pd.community : 0;

  const features: DataFeature[] = [
    {
      id: 'swing-trends',
      name: 'Swing analysis trends & quality queues',
      unit: 'swing analyses',
      have: analyses,
      need: DATA_THRESHOLDS.analysesForTrends,
      does: 'Surfaces score trends and low-confidence outputs to review across swing analyses.',
      steps: [
        'Make sure AI Swing Vision is connected (Integrations) so uploads get scored.',
        'Record or upload swings from the athlete app: Analyze → upload a video or photo.',
        `Each analyzed swing writes a row to video_analyses — aim for ${DATA_THRESHOLDS.analysesForTrends}+ to unlock trends and the review queue.`,
      ],
      relatedSystem: 'AI Analyses',
      relatedLinks: [{ label: 'AI Analyses', href: '/admin/ai-analyses' }],
    },
    {
      id: 'benchmark-grading',
      name: 'Profile-aware benchmark grading',
      unit: 'practice sessions',
      have: sessions,
      need: DATA_THRESHOLDS.sessionsForGrading,
      does: 'Grades each athlete against THEIR level (Beginner→Pro) instead of tour pros — needs a base of sessions to calibrate.',
      steps: [
        'Have athletes log practice sessions (Practice → log a session, or import launch-monitor data).',
        'Each session writes a row to sessions, feeding the grading benchmarks.',
        `Around ${DATA_THRESHOLDS.sessionsForGrading} sessions, per-dimension grades become reliable (review bands at Admin → Benchmarks).`,
      ],
      relatedSystem: 'Athletes / Benchmarks',
      relatedLinks: [{ label: 'Athletes', href: '/admin/athletes' }],
    },
    {
      id: 'priority-engine',
      name: 'Athlete priority & progress engine',
      unit: 'practice sessions',
      have: sessions,
      need: DATA_THRESHOLDS.sessionsForPriority,
      does: 'Ranks what each athlete should fix next and tracks progress over time across all their sessions.',
      steps: [
        'Encourage repeat logging — priorities sharpen as the same athlete logs more sessions.',
        'Diagnose swings (athlete app → Diagnose) so faults are recorded and fed into the engine.',
        `Around ${DATA_THRESHOLDS.sessionsForPriority} sessions, the "what to fix next" ranking becomes trustworthy.`,
      ],
      relatedSystem: 'Athletes',
      relatedLinks: [{ label: 'Athletes', href: '/admin/athletes' }],
    },
    {
      id: 'cross-sport',
      name: 'Cross-sport (AGI) skill transfer',
      unit: 'active sports',
      have: pd.activeSports,
      need: DATA_THRESHOLDS.sportsForCrossSport,
      does: 'Finds the keystone skill that transfers across an athlete\'s sports — needs activity in 2+ sports.',
      steps: [
        'Get sessions logged in a second sport (e.g. an athlete who plays golf and tennis).',
        'Cross-sport reasoning is opt-in per athlete (Settings → "allow cross-sport") and only activates with 2+ sports.',
        'Once a second sport has activity, the AGI layer can surface shared keystone skills.',
      ],
      relatedSystem: 'Sports',
      relatedLinks: [{ label: 'Sports', href: '/admin/sports' }],
    },
    {
      id: 'founding-momentum',
      name: 'Founding Members momentum',
      unit: 'community records',
      have: community,
      need: DATA_THRESHOLDS.communityForMomentum,
      does: 'Tracks qualified founding members and community/XP momentum for the launch campaign.',
      steps: [
        'Drive qualification: a member qualifies at 100% profile + 10 valid sessions (server-ordered #001…).',
        'Invite early athletes to complete their profile and log sessions.',
        'Track progress on Central Intelligence → Founding Members.',
      ],
      relatedSystem: 'Central Intelligence',
      relatedLinks: [{ label: 'Central Intelligence', href: '/admin/central-intelligence' }],
    },
  ];

  const out: Recommendation[] = [];
  for (const f of features) {
    const remaining = Math.max(0, f.need - f.have);
    if (remaining === 0) continue; // threshold met — feature works
    const empty = f.have === 0;
    out.push(
      build(bundle.now, {
        id: `data-readiness:${f.id}`,
        title: empty
          ? `${f.name} has no data yet — needs ${f.need} ${f.unit}`
          : `${f.name} needs ${remaining} more ${f.unit} (${f.have}/${f.need})`,
        summary: `${f.does} It produces trustworthy output once it has ~${f.need} ${f.unit}; right now it has ${f.have}.`,
        recommendationType: empty ? 'data_gap' : 'feature_readiness',
        category: 'Data',
        relatedFeature: f.name,
        relatedSystem: f.relatedSystem,
        effort: 'M',
        confidence: 90,
        factors: empty
          ? { impact: 18, urgency: 12, confidence: 14, affectedUsers: 13, strategic: 13, risk: 10 }
          : { impact: 14, urgency: 8, confidence: 14, affectedUsers: 11, strategic: 11, risk: 7 },
        dueInDays: empty ? 7 : 14,
        evidence: [
          `${f.have} / ${f.need} ${f.unit} recorded (live, cross-user)`,
          `${remaining} more ${f.unit} to reach the threshold`,
        ],
        reason: empty
          ? `No ${f.unit} exist yet, so this feature has nothing to work with and silently produces nothing.`
          : `Below the data threshold, this feature's output is unreliable — ${remaining} more ${f.unit} make it trustworthy.`,
        missingData: `${remaining} more ${f.unit} (currently ${f.have}, need ${f.need}).`,
        requiredData: [`${remaining}+ additional ${f.unit} across any athletes`],
        howToComplete: `Drive more ${f.unit}. ${f.steps[0]}`,
        stepByStepActions: f.steps,
        expectedOutcome: `${f.name} reaches its data threshold and starts producing trustworthy output.`,
        riskIfIgnored: `${f.name} keeps under-performing without it being obvious why.`,
        completionCriteria: `${f.unit} recorded reaches at least ${f.need} and the scan no longer flags it.`,
        sourceEngine: 'data-gap',
        relatedLinks: f.relatedLinks,
        isSeed: false,
      }),
    );
  }
  return out;
}

/**
 * Git/worktree hygiene → developer-operations recommendations (REAL: from the
 * committed BranchGuardianOS snapshot). Surfaces the highest-leverage cleanup
 * items in the daily "to do today" list, each linking back to BranchGuardianOS
 * where the safe, non-destructive commands live.
 */
export function ruleBranchHygiene(bundle: SignalBundle): Recommendation[] {
  const h = bundle.branchHygiene;
  if (!h.available) return [];
  const out: Recommendation[] = [];

  if (h.riskyUntracked > 0) {
    out.push(
      build(bundle.now, {
        id: 'branch-guardian:risky-untracked',
        title: `${h.riskyUntracked} risky untracked file(s) sit in git worktrees`,
        summary:
          'BranchGuardianOS found untracked files that look like secrets (.env, keys, dumps) in your worktrees. They are one stray commit away from leaking.',
        recommendationType: 'security',
        category: 'Security',
        relatedSystem: 'BranchGuardianOS',
        effort: 'S',
        confidence: 90,
        factors: { impact: 18, urgency: 13, confidence: 14, affectedUsers: 8, strategic: 9, risk: 16 },
        dueInDays: 1,
        evidence: [`${h.riskyUntracked} risky untracked file(s) across worktrees (shown by path in BranchGuardianOS)`],
        reason: 'Untracked secret-like files can be committed by accident and harvested within minutes of a push.',
        howToComplete: 'Open BranchGuardianOS, review the flagged paths, add them to .gitignore (or remove them), and rotate anything exposed.',
        stepByStepActions: [
          'Open BranchGuardianOS → Recommendations.',
          'Review each flagged untracked file (shown by path only).',
          'Add to .gitignore or move out of the repo; rotate any exposed credential.',
        ],
        expectedOutcome: 'No secret-like untracked files remain in any worktree.',
        riskIfIgnored: 'A secret is committed and scraped, compromising an integration or user data.',
        completionCriteria: 'BranchGuardianOS shows zero risky untracked files and securityOS marks the check Pass.',
        sourceEngine: 'branch-guardian',
        relatedLinks: [
          { label: 'BranchGuardianOS', href: '/admin/branch-guardian' },
          { label: 'securityOS', href: '/admin/security-os' },
        ],
      }),
    );
  }

  if (h.worktreesNeedingReview > 0 || h.staleBranches > 0 || h.mergedEligible > 0) {
    const bits: string[] = [];
    if (h.staleBranches > 0) bits.push(`${h.staleBranches} stale branch(es)`);
    if (h.mergedEligible > 0) bits.push(`${h.mergedEligible} merged branch(es) eligible for deletion`);
    if (h.worktreesNeedingReview > 0) bits.push(`${h.worktreesNeedingReview} worktree(s) needing review`);
    out.push(
      build(bundle.now, {
        id: 'branch-guardian:hygiene',
        title: `Git hygiene: ${bits.join(', ')}`,
        summary: `BranchGuardianOS flagged ${bits.join(', ')}. Cleaning these up reduces clutter and merge risk. All actions are non-destructive and require your confirmation.`,
        recommendationType: 'system_health',
        category: 'Engineering',
        relatedSystem: 'BranchGuardianOS',
        effort: 'S',
        confidence: 88,
        factors: { impact: 10, urgency: 6, confidence: 13, affectedUsers: 4, strategic: 8, risk: 7 },
        dueInDays: 7,
        evidence: [
          ...bits,
          `Current Git cleanliness score: ${h.cleanliness}/100`,
        ],
        reason: 'Stale, merged and orphaned branches/worktrees obscure what is actually in flight and accumulate merge debt.',
        howToComplete: 'Open BranchGuardianOS, work the ranked recommendations, and copy the safe commands it generates (nothing runs automatically).',
        stepByStepActions: [
          'Open BranchGuardianOS → Recommendations.',
          'Back up before any deletion (the tool generates the backup command).',
          'Copy and run the suggested commands in your terminal after confirming.',
        ],
        expectedOutcome: 'Merged/stale branches are cleaned up and worktrees are consolidated; the cleanliness score rises.',
        riskIfIgnored: 'Branch sprawl grows, making releases and reviews harder and increasing the chance of losing work.',
        completionCriteria: 'BranchGuardianOS shows no merged-eligible branches and no worktrees needing review.',
        sourceEngine: 'branch-guardian',
        relatedLinks: [{ label: 'BranchGuardianOS', href: '/admin/branch-guardian' }],
      }),
    );
  } else if (h.maxBehindMain > 30 && h.worstBehindBranch) {
    out.push(
      build(bundle.now, {
        id: 'branch-guardian:behind-main',
        title: `"${h.worstBehindBranch}" is ${h.maxBehindMain} commits behind main`,
        summary: `A working branch has drifted ${h.maxBehindMain} commits behind main and may need rebasing before further work.`,
        recommendationType: 'system_health',
        category: 'Engineering',
        relatedSystem: 'BranchGuardianOS',
        effort: 'S',
        confidence: 85,
        factors: { impact: 8, urgency: 6, confidence: 12, affectedUsers: 3, strategic: 7, risk: 8 },
        dueInDays: 7,
        evidence: [`${h.worstBehindBranch}: ${h.maxBehindMain} commits behind main`],
        reason: 'A branch far behind main accumulates conflict risk; rebasing now is cheaper than at merge time.',
        howToComplete: 'Open BranchGuardianOS and use the generated rebase commands (back up first).',
        stepByStepActions: ['Open BranchGuardianOS → Recommendations.', 'Back up the branch.', 'Rebase onto main with the suggested command.'],
        expectedOutcome: 'The branch is current with main and merges cleanly.',
        riskIfIgnored: 'The eventual merge becomes a large, error-prone conflict resolution.',
        completionCriteria: 'No working branch is more than ~30 commits behind main.',
        sourceEngine: 'branch-guardian',
        relatedLinks: [{ label: 'BranchGuardianOS', href: '/admin/branch-guardian' }],
      }),
    );
  }

  return out;
}

/**
 * securityOS posture → Command Center. Surfaces the single most important
 * security signal on the owner's one screen: open critical/high findings get
 * an urgent recommendation; otherwise a sub-"good" overall score gets a nudge
 * to raise posture. No-ops when securityOS produced no usable scan.
 */
export function ruleSecurityPosture(bundle: SignalBundle): Recommendation[] {
  const s = bundle.securityPosture;
  if (!s?.available) return [];
  const out: Recommendation[] = [];

  if (s.critical > 0 || s.high > 0) {
    const bits: string[] = [];
    if (s.critical > 0) bits.push(`${s.critical} critical`);
    if (s.high > 0) bits.push(`${s.high} high`);
    const urgent = s.critical > 0;
    out.push(
      build(bundle.now, {
        id: 'security-os:open-findings',
        title: `securityOS: ${bits.join(' + ')} open security finding(s)`,
        summary: `securityOS found ${bits.join(' and ')}-severity finding(s) in the current posture${s.topFinding ? ` — most severe: "${s.topFinding}"` : ''}. These are the highest-leverage fixes for protecting user data.`,
        recommendationType: 'security',
        category: 'Security',
        relatedSystem: 'securityOS',
        effort: 'M',
        confidence: Math.max(60, Math.min(95, s.confidence)),
        factors: {
          impact: urgent ? 20 : 15,
          urgency: urgent ? 16 : 11,
          confidence: 13,
          affectedUsers: 9,
          strategic: 9,
          risk: urgent ? 18 : 13,
        },
        dueInDays: urgent ? 2 : 7,
        evidence: [
          `${bits.join(', ')} open finding(s)`,
          `Overall security score: ${s.score}/100 (confidence ${s.confidence}%)`,
          ...(s.topFinding ? [`Most severe: ${s.topFinding}`] : []),
        ],
        reason: 'Open critical/high findings are the most direct path to a breach or data-exposure incident; fixing them retires the most risk per hour.',
        howToComplete: 'Open securityOS, work the ranked recommendations top-down, and mark each finding resolved as you verify the fix.',
        stepByStepActions: [
          'Open securityOS → Findings, filter to Critical + High.',
          'Work each finding using its recommendation + runbook.',
          'Re-run the scan and confirm the finding flips to Pass.',
        ],
        expectedOutcome: 'No open critical/high findings remain and the overall security score rises.',
        riskIfIgnored: 'An unaddressed critical/high finding is exploited, exposing user data or an integration secret.',
        completionCriteria: 'securityOS shows zero open critical and high findings.',
        sourceEngine: 'security-os',
        relatedLinks: [{ label: 'securityOS', href: '/admin/security-os' }],
      }),
    );
  } else if (s.score < 70) {
    out.push(
      build(bundle.now, {
        id: 'security-os:raise-posture',
        title: `Security score is ${s.score}/100 — raise it above 70`,
        summary: `No critical/high findings are open, but the overall securityOS score is ${s.score}/100${s.hasUnknowns ? ' (some checks could not be read, which lowers confidence)' : ''}. Closing medium findings and resolving unknowns hardens the baseline.`,
        recommendationType: 'security',
        category: 'Security',
        relatedSystem: 'securityOS',
        effort: 'M',
        confidence: Math.max(55, Math.min(90, s.confidence)),
        factors: { impact: 11, urgency: 7, confidence: 11, affectedUsers: 6, strategic: 9, risk: 10 },
        dueInDays: 14,
        evidence: [
          `Overall security score: ${s.score}/100 (confidence ${s.confidence}%)`,
          ...(s.hasUnknowns ? ['Some posture checks returned "unknown" — resolving them raises confidence'] : []),
        ],
        reason: 'A sub-"good" posture score signals accumulated medium findings or unread checks; addressing them now is cheaper than after an incident.',
        howToComplete: 'Open securityOS, resolve medium findings and any "unknown" checks, then re-score.',
        stepByStepActions: [
          'Open securityOS → review medium findings and unknown checks.',
          'Apply the recommended fix / provide the missing signal.',
          'Re-run the scan and confirm the score climbs above 70.',
        ],
        expectedOutcome: 'Overall security score is in the "good" band (≥70) with higher confidence.',
        riskIfIgnored: 'A drifting baseline accumulates risk and makes the next real finding harder to spot.',
        completionCriteria: 'securityOS overall score ≥ 70 with no open high/critical findings.',
        sourceEngine: 'security-os',
        relatedLinks: [{ label: 'securityOS', href: '/admin/security-os' }],
      }),
    );
  }

  return out;
}

const RULES: Array<(b: SignalBundle) => Recommendation[]> = [
  ruleDataReadiness,
  ruleAnalytics,
  ruleAuditFindings,
  ruleSportCoverage,
  ruleFeatureEducation,
  ruleSetup,
  ruleBranchHygiene,
  ruleSecurityPosture,
  ruleBaseline,
];

/**
 * De-duplicate by id. When two rules emit the same id, keep the
 * higher-scoring one but merge in any extra evidence — this is how a
 * worsening signal "updates" an existing recommendation instead of spamming.
 */
export function dedupeRecommendations(recs: Recommendation[]): Recommendation[] {
  const byId = new Map<string, Recommendation>();
  for (const r of recs) {
    const existing = byId.get(r.id);
    if (!existing) {
      byId.set(r.id, r);
      continue;
    }
    const winner = r.priorityScore >= existing.priorityScore ? r : existing;
    const other = winner === r ? existing : r;
    winner.evidence = Array.from(new Set([...winner.evidence, ...other.evidence]));
    byId.set(r.id, winner);
  }
  return [...byId.values()];
}

export interface GenerateOptions {
  includeBaseline?: boolean;
}

/**
 * Run every rule over the bundle, dedupe, and sort by priority (desc),
 * then by sooner due date. Pure & deterministic for a given bundle.
 */
export function generateRecommendations(
  bundle: SignalBundle,
  opts: GenerateOptions = {},
): Recommendation[] {
  const includeBaseline = opts.includeBaseline ?? true;
  const all: Recommendation[] = [];
  for (const rule of RULES) {
    if (rule === ruleBaseline && !includeBaseline) continue;
    try {
      all.push(...rule(bundle));
    } catch {
      // A broken rule must never take down the whole scan.
    }
  }
  return dedupeRecommendations(all).sort(
    (a, b) => b.priorityScore - a.priorityScore || a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id),
  );
}
