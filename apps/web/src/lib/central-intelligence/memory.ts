// ============================================================
// CentralIntelligenceOS — Ethical user memory + coaching continuity
// ------------------------------------------------------------
// Builders and read-models over the six memory layers. The goal: the
// AI should never treat a session like a brand-new interaction. From a
// user's stored memories we assemble a compact, grounded coaching
// context — recurring issues, past drills, constraints, preferences,
// recent trend — that a coach (human or AI) reads BEFORE the next
// session, producing continuity like:
//
//   "Your last three driver sessions show the same open face-to-path
//    pattern. We worked on face control last time, so today we prioritize
//    clubface closure before path changes."
//
// HONESTY: memories are only ever grounded in the user's own data. We
// never fabricate a pattern to manufacture a recommendation.
// ============================================================

import type { SportId } from '@swingiq/core';
import type {
  ConsentBasis,
  MemoryLayer,
  MemoryType,
  SessionSummaryForMemory,
  UserMemory,
  VisibilityScope,
} from './types';

let memCounter = 0;
function memId(): string {
  memCounter += 1;
  return `mem_${Date.now().toString(36)}_${memCounter.toString(36)}`;
}

export interface BuildMemoryInput {
  userId: string;
  layer: MemoryLayer;
  memoryType: MemoryType;
  title: string;
  summary: string;
  sport?: SportId | null;
  data?: Record<string, unknown>;
  sourceType?: UserMemory['sourceType'];
  sourceId?: string | null;
  confidence?: number;
  importance?: number;
  visibility?: VisibilityScope;
  consentBasis?: ConsentBasis;
  expiresAt?: string | null;
  now?: Date;
}

/** Construct a well-formed UserMemory with sensible privacy-safe defaults. */
export function buildUserMemory(input: BuildMemoryInput): UserMemory {
  const now = (input.now ?? new Date()).toISOString();
  // Aggregate/governance layers are not private to the user; everything else is.
  const defaultVisibility: VisibilityScope =
    input.layer === 'aggregate' ? 'anonymized' : input.layer === 'governance' ? 'admin' : 'private';
  return {
    id: memId(),
    userId: input.userId,
    layer: input.layer,
    memoryType: input.memoryType,
    sport: input.sport ?? null,
    title: input.title,
    summary: input.summary,
    data: input.data,
    sourceType: input.sourceType ?? 'system',
    sourceId: input.sourceId ?? null,
    confidence: clamp01(input.confidence ?? 0.8),
    importance: clamp01(input.importance ?? 0.5),
    visibility: input.visibility ?? defaultVisibility,
    consentBasis: input.consentBasis ?? 'personalization',
    createdAt: now,
    updatedAt: now,
    expiresAt: input.expiresAt ?? null,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

// ── Coaching context read-model ───────────────────────────────

export interface CoachingMemoryContext {
  sport: SportId | null;
  recurringIssues: Array<{ issue: string; occurrences: number }>;
  highestPriorityIssue: string | null;
  pastDrills: string[];
  preferences: string[];
  constraints: string[];
  goals: string[];
  recentTrend: string | null;
  lastRecommendation: string | null;
  /** A short, grounded paragraph for a coach/AI to read before next session. */
  summary: string;
}

/** Filter a user's memories to one user (and optionally one sport). */
export function selectUserMemories(
  memories: UserMemory[],
  userId: string,
  sport?: SportId | null,
): UserMemory[] {
  return memories.filter(
    (m) => m.userId === userId && (sport == null || m.sport === sport || m.sport == null),
  );
}

/**
 * Assemble the coaching context for a user (optionally scoped to a sport).
 * Recurring issues are detected by counting repeated issue summaries across
 * session/recurring_issue memories; an issue seen ≥2 times is "recurring".
 */
export function getUserMemoryContext(
  memories: UserMemory[],
  userId: string,
  sport?: SportId | null,
): CoachingMemoryContext {
  const scoped = selectUserMemories(memories, userId, sport).filter((m) => m.visibility === 'private');

  const issueCounts = new Map<string, number>();
  for (const m of scoped) {
    if (m.memoryType === 'recurring_issue' || m.memoryType === 'session') {
      const issue = (m.data?.issue as string) || (m.memoryType === 'recurring_issue' ? m.summary : null);
      if (issue) issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }
  const recurringIssues = Array.from(issueCounts.entries())
    .map(([issue, occurrences]) => ({ issue, occurrences }))
    .filter((r) => r.occurrences >= 2)
    .sort((a, b) => b.occurrences - a.occurrences);

  const pastDrills = unique(
    scoped.filter((m) => m.memoryType === 'coaching' && m.data?.drill).map((m) => String(m.data!.drill)),
  );
  const preferences = unique(scoped.filter((m) => m.memoryType === 'preference').map((m) => m.summary));
  const constraints = unique(scoped.filter((m) => m.memoryType === 'constraint').map((m) => m.summary));
  const goals = unique(scoped.filter((m) => m.memoryType === 'goal').map((m) => m.summary));

  // Most-important recurring issue, falling back to the single most-important
  // session issue, drives the "prioritize this first" line.
  const byImportance = [...scoped].sort(
    (a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt),
  );
  const highestPriorityIssue =
    recurringIssues[0]?.issue ??
    (byImportance.find((m) => m.data?.issue)?.data?.issue as string | undefined) ??
    null;

  const lastRecommendationMem = byImportance.find((m) => m.memoryType === 'coaching' && m.data?.recommendation);
  const lastRecommendation = lastRecommendationMem
    ? String(lastRecommendationMem.data!.recommendation)
    : null;

  const recentTrend = (byImportance.find((m) => m.memoryType === 'session' && m.data?.trend)?.data?.trend as
    | string
    | undefined) ?? null;

  return {
    sport: sport ?? null,
    recurringIssues,
    highestPriorityIssue,
    pastDrills,
    preferences,
    constraints,
    goals,
    recentTrend,
    lastRecommendation,
    summary: buildContinuityParagraph({
      sport: sport ?? null,
      recurringIssues,
      highestPriorityIssue,
      pastDrills,
      lastRecommendation,
      goals,
      constraints,
    }),
  };
}

/** Sport-scoped convenience wrapper. */
export function getSportMemoryContext(
  memories: UserMemory[],
  userId: string,
  sport: SportId,
): CoachingMemoryContext {
  return getUserMemoryContext(memories, userId, sport);
}

function buildContinuityParagraph(c: {
  sport: SportId | null;
  recurringIssues: Array<{ issue: string; occurrences: number }>;
  highestPriorityIssue: string | null;
  pastDrills: string[];
  lastRecommendation: string | null;
  goals: string[];
  constraints: string[];
}): string {
  const parts: string[] = [];
  if (c.recurringIssues[0]) {
    const r = c.recurringIssues[0];
    parts.push(`Across your last ${r.occurrences} sessions the same pattern keeps showing up: ${r.issue}.`);
  } else if (c.highestPriorityIssue) {
    parts.push(`Your current priority is ${c.highestPriorityIssue}.`);
  }
  if (c.lastRecommendation) parts.push(`Last time we worked on ${c.lastRecommendation}.`);
  if (c.pastDrills.length) parts.push(`Drills you've already tried: ${c.pastDrills.slice(0, 3).join(', ')}.`);
  if (c.constraints.length) parts.push(`Keeping in mind: ${c.constraints[0]}.`);
  if (c.goals[0]) parts.push(`Your goal: ${c.goals[0]}.`);
  if (parts.length === 0) {
    return 'No prior coaching history yet — this looks like a fresh start. Record a session to begin building continuity.';
  }
  return parts.join(' ');
}

// ── Updating memory from a new session ────────────────────────

/**
 * Derive the coaching memories to append after a session. Returns NEW memory
 * objects (caller persists them). A repeated primary issue is stored as a
 * `recurring_issue` with higher importance so it surfaces first next time.
 */
export function updateCoachingMemoryFromSession(
  userId: string,
  session: SessionSummaryForMemory,
  priorContext: CoachingMemoryContext,
  now?: Date,
): UserMemory[] {
  const out: UserMemory[] = [];

  // Always record a session-layer memory.
  out.push(
    buildUserMemory({
      userId,
      layer: 'session',
      memoryType: 'session',
      sport: session.sport,
      title: `Session ${session.date || ''}`.trim(),
      summary: session.headline,
      data: {
        issue: session.primaryIssue ?? undefined,
        score: session.score ?? undefined,
        shotCount: session.shotCount,
      },
      sourceType: 'session',
      sourceId: session.id,
      confidence: 0.95,
      importance: 0.5,
      consentBasis: 'personalization',
      now,
    }),
  );

  // If this session's primary issue was already seen, escalate it to a
  // recurring-issue memory with higher importance (so coaching prioritizes it).
  if (session.primaryIssue) {
    const seenBefore = priorContext.recurringIssues.some((r) => r.issue === session.primaryIssue)
      || priorContext.highestPriorityIssue === session.primaryIssue;
    if (seenBefore) {
      out.push(
        buildUserMemory({
          userId,
          layer: 'longitudinal',
          memoryType: 'recurring_issue',
          sport: session.sport,
          title: 'Recurring issue',
          summary: session.primaryIssue,
          data: { issue: session.primaryIssue },
          sourceType: 'session',
          sourceId: session.id,
          confidence: 0.9,
          importance: 0.85,
          consentBasis: 'personalization',
          now,
        }),
      );
    }
  }

  return out;
}

// ── Next best action ──────────────────────────────────────────

export interface NextBestAction {
  title: string;
  detail: string;
  cta: { label: string; href: string };
  /** Why this is the recommended next step (grounded). */
  rationale: string;
}

/**
 * The single most useful next step for a user, grounded in their context and
 * progress. Ordered: finish profile → record first/next session → keep a
 * recurring issue moving → maintain momentum.
 */
export function generateNextBestAction(input: {
  profileCompleted: boolean;
  profileCompletionPercent: number;
  validSessionCount: number;
  requiredSessions: number;
  context: CoachingMemoryContext;
}): NextBestAction {
  if (!input.profileCompleted) {
    return {
      title: 'Finish your player profile',
      detail: `You're ${input.profileCompletionPercent}% there. A complete profile makes every diagnosis sharper.`,
      cta: { label: 'Complete profile', href: '/profile' },
      rationale: 'Profile incomplete — the highest-leverage step for better coaching.',
    };
  }
  if (input.validSessionCount === 0) {
    return {
      title: 'Record your first session',
      detail: 'Upload a swing or import launch-monitor data to get your first diagnosis.',
      cta: { label: 'Record a session', href: '/analyze' },
      rationale: 'No sessions yet — the product learns nothing until the first one.',
    };
  }
  if (input.context.highestPriorityIssue) {
    return {
      title: `Keep working your top priority`,
      detail: `Focus area: ${input.context.highestPriorityIssue}. Run a focused session and retest.`,
      cta: { label: 'Open your fix plan', href: '/fix' },
      rationale: 'A recurring issue is the fastest path to measurable improvement.',
    };
  }
  if (input.validSessionCount < input.requiredSessions) {
    const left = input.requiredSessions - input.validSessionCount;
    return {
      title: 'Build your session history',
      detail: `${input.validSessionCount} of ${input.requiredSessions} sessions recorded — ${left} to go.`,
      cta: { label: 'Record a session', href: '/analyze' },
      rationale: 'More sessions unlock trend detection and Founding Member status.',
    };
  }
  return {
    title: 'Review your progress',
    detail: 'You have a rich history — check your trends and lock in the next goal.',
    cta: { label: 'Open your progress', href: '/arc' },
    rationale: 'Enough history exists to make trend review worthwhile.',
  };
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.filter((s) => s && s.trim() !== '')));
}
