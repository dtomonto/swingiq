// ============================================================
// Founding Journey (#campaign) — the navigational "become a Founding Member"
// path. A guided tour of the whole product as a checklist: each step sends the
// athlete to a real feature and is marked done from REAL store data (never a
// self-check). The REQUIRED steps are exactly the server-verifiable founding
// gate (complete profile + FOUNDING_REQUIRED_SESSIONS valid sessions); the
// RECOMMENDED steps deepen engagement across the app. PURE / framework-agnostic
// so it's unit-testable and reused by the page + the dashboard nudge.
// ============================================================

import { FOUNDING_REQUIRED_SESSIONS } from '@/lib/central-intelligence/config';

export interface JourneyStepDef {
  id: string;
  title: string;
  blurb: string;
  cta: { label: string; href: string };
  /** Required steps form the actual founding gate; recommended ones enrich it. */
  required: boolean;
}

/** Real signals derived from the store (no self-reporting). */
export interface JourneySignals {
  authed: boolean;
  profileComplete: boolean;
  profilePercent: number;
  validSessionCount: number;
  /** Distinct sports the athlete has logged sessions in. */
  distinctSports: number;
  /** A session has a saved diagnosis / top fault. */
  hasDiagnosis: boolean;
  /** Their bag / equipment has at least one item. */
  hasEquipment: boolean;
  /** They've logged a BodySync / physical-readiness check. */
  hasReadiness: boolean;
}

export const FOUNDING_JOURNEY_STEPS: JourneyStepDef[] = [
  { id: 'account', required: true, title: 'Create your free account', blurb: 'Your spot — and your free-for-life membership — is tied to your account.', cta: { label: 'Sign up free', href: '/signup' } },
  { id: 'profile', required: true, title: 'Complete your athlete profile', blurb: 'Sport, level and goals so every analysis is graded against YOU, not tour pros.', cta: { label: 'Complete profile', href: '/profile' } },
  { id: 'first-analysis', required: true, title: 'Run your first swing analysis', blurb: 'Upload a video or import data — get your single top fix in about a minute.', cta: { label: 'Analyze a swing', href: '/start' } },
  { id: 'diagnosis', required: false, title: 'Review your top fault', blurb: 'See the one issue to fix first, why it matters, and the drills tied to it.', cta: { label: 'Open your diagnosis', href: '/diagnose' } },
  { id: 'equipment', required: false, title: 'Set up your bag', blurb: 'Add your clubs or gear so distances and recommendations fit your equipment.', cta: { label: 'Manage your bag', href: '/bag' } },
  { id: 'readiness', required: false, title: 'Check your physical readiness', blurb: 'Run a BodySync check — your readiness feeds the priority of what to work on.', cta: { label: 'Open BodySync', href: '/bodysync' } },
  { id: 'multi-sport', required: false, title: 'Explore a second sport', blurb: 'SwingVantage analyzes golf, tennis, baseball, softball, pickleball & padel.', cta: { label: 'Switch sports', href: '/sports' } },
  { id: 'ten-sessions', required: true, title: `Track ${FOUNDING_REQUIRED_SESSIONS} sessions of progress`, blurb: `Log ${FOUNDING_REQUIRED_SESSIONS} valid sessions so your trend — and your Founding place — is earned.`, cta: { label: 'Record a session', href: '/sessions' } },
];

export interface JourneyStepResult {
  def: JourneyStepDef;
  done: boolean;
  /** For the sessions step: e.g. "7 / 10". */
  progressLabel?: string;
}

export interface JourneyResult {
  steps: JourneyStepResult[];
  completed: number;
  total: number;
  /** 0–100 across ALL steps (required + recommended). */
  percent: number;
  /** Required-only progress. */
  requiredCompleted: number;
  requiredTotal: number;
  /** True when every REQUIRED step is done = eligible to be a Founding Member. */
  ready: boolean;
}

function isStepDone(id: string, s: JourneySignals): boolean {
  switch (id) {
    case 'account': return s.authed;
    case 'profile': return s.profileComplete;
    case 'first-analysis': return s.validSessionCount >= 1;
    case 'diagnosis': return s.hasDiagnosis;
    case 'equipment': return s.hasEquipment;
    case 'readiness': return s.hasReadiness;
    case 'multi-sport': return s.distinctSports >= 2;
    case 'ten-sessions': return s.validSessionCount >= FOUNDING_REQUIRED_SESSIONS;
    default: return false;
  }
}

/** Compute the journey from real signals. */
export function computeJourney(signals: JourneySignals): JourneyResult {
  const steps: JourneyStepResult[] = FOUNDING_JOURNEY_STEPS.map((def) => {
    const done = isStepDone(def.id, signals);
    const progressLabel =
      def.id === 'ten-sessions'
        ? `${Math.min(signals.validSessionCount, FOUNDING_REQUIRED_SESSIONS)} / ${FOUNDING_REQUIRED_SESSIONS}`
        : undefined;
    return { def, done, progressLabel };
  });

  const total = steps.length;
  const completed = steps.filter((s) => s.done).length;
  const required = steps.filter((s) => s.def.required);
  const requiredCompleted = required.filter((s) => s.done).length;

  return {
    steps,
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    requiredCompleted,
    requiredTotal: required.length,
    ready: requiredCompleted === required.length,
  };
}
