// ============================================================
// SwingVantage Admin — Copilot: intent registry & matcher (pure)
// ------------------------------------------------------------
// The set of questions the Copilot can answer deterministically, plus a
// lightweight keyword matcher that maps free-text to an intent. Each
// intent has a builder in engine.ts. Adding a question = one entry here
// + one case in the engine.
// ============================================================

export type CopilotIntent =
  | 'next-best-action'
  | 'system-overview'
  | 'fastest-sport'
  | 'urgent-tasks'
  | 'ai-review-queue'
  | 'recent-errors'
  | 'pages-to-optimize'
  | 'content-gaps'
  | 'users-stuck'
  | 'growth-priority'
  | 'central-intelligence'
  | 'features-in-development'
  | 'help';

export interface CopilotIntentDef {
  id: CopilotIntent;
  /** The canonical suggested question shown as a chip. */
  question: string;
  /** Keywords that route free-text to this intent (lowercased substrings). */
  keywords: string[];
  /** Tie-break priority when scores are equal (lower wins). */
  priority: number;
}

// Ordered roughly by how often a founder asks them.
export const COPILOT_INTENTS: CopilotIntentDef[] = [
  {
    id: 'next-best-action',
    question: 'What should I improve next?',
    keywords: ['next', 'improve next', 'what should i do', 'what to do', 'focus on', 'most important', 'priority right now'],
    priority: 1,
  },
  {
    id: 'system-overview',
    question: 'How is the platform doing overall?',
    keywords: ['overview', 'at a glance', 'how are we doing', 'how is the platform', 'summary', 'kpi', 'metrics', 'numbers', 'snapshot', 'status'],
    priority: 2,
  },
  {
    id: 'fastest-sport',
    question: 'Which sport is most active?',
    keywords: ['sport', 'fastest growing', 'most active', 'most used', 'popular sport', 'which sport', 'top sport'],
    priority: 3,
  },
  {
    id: 'urgent-tasks',
    question: 'Which admin tasks are most urgent?',
    keywords: ['urgent', 'needs my', 'needs me', 'attention', 'to-do', 'todo', 'to do', 'approve', 'approvals', 'inbox', 'pending', 'action center'],
    priority: 4,
  },
  {
    id: 'ai-review-queue',
    question: 'Which AI outputs need review?',
    keywords: ['ai output', 'ai outputs', 'need review', 'needs review', 'analyses need', 'quality queue', 'hallucinat', 'review queue', 'drafts'],
    priority: 5,
  },
  {
    id: 'recent-errors',
    question: 'What errors or outages happened recently?',
    keywords: ['error', 'errors', 'broken', 'outage', 'down', 'incident', 'failing', 'failure', 'health', 'integration'],
    priority: 6,
  },
  {
    id: 'pages-to-optimize',
    question: 'Which pages should I optimize first?',
    keywords: ['page', 'pages', 'optimize', 'seo', 'rank', 'ranking', 'traffic', 'search'],
    priority: 7,
  },
  {
    id: 'content-gaps',
    question: 'What content gaps exist?',
    keywords: ['content gap', 'gap', 'gaps', 'missing content', 'documentation', 'docs', 'tutorial', 'coverage'],
    priority: 8,
  },
  {
    id: 'users-stuck',
    question: 'Which users are stuck or dropping off?',
    keywords: ['stuck', 'drop off', 'drop-off', 'dropoff', 'churn', 'retention', 'activation', 'funnel', 'onboarding'],
    priority: 9,
  },
  {
    id: 'growth-priority',
    question: 'What should GrowthOS prioritize this week?',
    keywords: ['growth', 'grow', 'this week', 'acquisition', 'marketing', 'campaign', 'growthos'],
    priority: 10,
  },
  {
    id: 'central-intelligence',
    question: 'What is Central Intelligence learning?',
    keywords: ['central intelligence', 'cios', 'learning', 'brain', 'memory', 'intelligence'],
    priority: 11,
  },
  {
    id: 'features-in-development',
    question: 'What features are in development?',
    keywords: ['feature', 'features', 'development', 'roadmap', 'building', 'shipping', 'planned', 'in progress'],
    priority: 12,
  },
];

/** The suggested-question chips shown in the console (excludes the help fallback). */
export const SUGGESTED_QUESTIONS: { id: CopilotIntent; question: string }[] =
  COPILOT_INTENTS.map((i) => ({ id: i.id, question: i.question }));

/**
 * Resolve free-text to an intent by keyword scoring. Returns 'help' when
 * nothing matches so the Copilot degrades to an honest capabilities list
 * instead of guessing. Pure and deterministic.
 */
export function resolveIntent(query: string): CopilotIntent {
  const q = query.trim().toLowerCase();
  if (!q) return 'help';

  let best: { id: CopilotIntent; score: number; priority: number } | null = null;
  for (const def of COPILOT_INTENTS) {
    let score = 0;
    for (const kw of def.keywords) {
      if (q.includes(kw)) score += kw.includes(' ') ? 2 : 1; // phrase matches weigh more
    }
    if (score === 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && def.priority < best.priority)
    ) {
      best = { id: def.id, score, priority: def.priority };
    }
  }
  return best?.id ?? 'help';
}
