// ============================================================
// SwingVantage — Agent: Activation Concierge — Engine
// ------------------------------------------------------------
// Computes where a new user is in the activation funnel and the
// single next micro-step to move them forward. Pure, deterministic,
// SSR-safe, never throws. Stall detection is honest: it only fires
// when there is real time-on-step signal to back it.
// ============================================================

import { getSportAgentProfile } from '../sport-profiles';
import { buildActionLibrary } from '../scoring';
import type { AgentAction, AgentContext } from '../types';
import type {
  ActivationNudge,
  ActivationOptions,
  ActivationState,
  ActivationStep,
  ActivationStepId,
} from './types';

/** Days on a step before we call it "stalled" (when we can tell). */
const STALL_DAYS = 3;

// ── Step model (sport-aware) ──────────────────────────────────

function stepLabels(ctx: AgentContext): Array<{ id: ActivationStepId; label: string }> {
  const isGolf = ctx.activeSport === 'golf';
  const sp = getSportAgentProfile(ctx.activeSport);
  const upload = isGolf ? 'Import your first session' : 'Upload your first video';
  const steps: Array<{ id: ActivationStepId; label: string }> = [
    { id: 'profile', label: 'Complete your profile' },
    { id: 'first_upload', label: upload },
  ];
  // Non-golf video already carries the finding, so there is no separate step.
  if (isGolf) steps.push({ id: 'first_diagnosis', label: 'Find your #1 priority' });
  steps.push({ id: 'first_plan', label: 'Build your practice plan' });
  steps.push({
    id: 'first_retest',
    label: isGolf ? 'Re-test to measure progress' : `Re-record to measure progress (${sp.motion})`,
  });
  return steps;
}

function isStepDone(id: ActivationStepId, ctx: AgentContext): boolean {
  switch (id) {
    case 'profile':
      return ctx.profile.exists;
    case 'first_upload':
      return ctx.sessionCount >= 1;
    case 'first_diagnosis':
      return !!ctx.latestDiagnosedSession;
    case 'first_plan':
      return ctx.planStatus !== 'none';
    case 'first_retest':
      // A follow-up logged after the plan started closes the first loop.
      return ctx.planStatus === 'completed';
    default:
      return false;
  }
}

// ── Nudge copy ────────────────────────────────────────────────

function nudgeFor(id: ActivationStepId, ctx: AgentContext, action: AgentAction): ActivationNudge {
  const sp = getSportAgentProfile(ctx.activeSport);
  const isGolf = ctx.activeSport === 'golf';
  const focus = ctx.latestSession?.primaryFocus ?? null;

  switch (id) {
    case 'profile':
      return {
        headline: 'Let’s set you up',
        body: `Tell SwingVantage your skill level and goal so every tip is tailored to your ${sp.motion}. Takes about a minute.`,
        action,
        microStep: 'Just pick your skill level to start.',
      };
    case 'first_upload':
      return {
        headline: isGolf ? 'Add your first session' : 'Record your first swing',
        body: isGolf
          ? 'Import one launch-monitor session — even a handful of shots is enough to find your first priority.'
          : `Film one ${sp.motion} from the side. That single clip is all SwingVantage needs to start.`,
        action,
        microStep: isGolf ? 'A 6-shot baseline is plenty.' : 'One 10-second clip is plenty.',
      };
    case 'first_diagnosis':
      return {
        headline: 'See your #1 priority',
        body: 'Run the diagnosis on your session to find the single thing worth working on first.',
        action,
        microStep: 'It takes under a minute.',
      };
    case 'first_plan':
      return {
        headline: 'Turn it into a plan',
        body: `Build a short routine${focus ? ` for ${focus}` : ''} you can actually do this week.`,
        action,
        microStep: 'Pick a 15-minute plan to start small.',
      };
    case 'first_retest':
      return {
        headline: 'Prove it’s working',
        body: isGolf
          ? 'Log a follow-up session with the same setup so SwingVantage can measure your progress.'
          : `Re-record the same ${sp.motion} so SwingVantage can measure what changed.`,
        action,
        microStep: 'Same setup as last time keeps it a fair comparison.',
      };
    default:
      return { headline: 'Keep going', body: '', action, microStep: '' };
  }
}

/** Map a step to its concrete action from the shared action library. */
function actionFor(id: ActivationStepId, ctx: AgentContext): AgentAction {
  const lib = buildActionLibrary(ctx);
  switch (id) {
    case 'profile':
      return lib.finishProfile;
    case 'first_upload':
      return lib.uploadBaseline;
    case 'first_diagnosis':
      return lib.runDiagnosis;
    case 'first_plan':
      return lib.createPlan;
    case 'first_retest':
      return lib.uploadFollowUp;
    default:
      return lib.uploadBaseline;
  }
}

// ── Main builder ──────────────────────────────────────────────

/**
 * Build the activation state for the active sport. `accountAgeDays` (optional)
 * unlocks honest stall detection for users who have not produced any activity
 * timestamp yet (e.g. signed up but never uploaded).
 */
export function buildActivation(ctx: AgentContext, opts: ActivationOptions = {}): ActivationState {
  const defs = stepLabels(ctx);
  const dones = defs.map((d) => isStepDone(d.id, ctx));
  const currentIndex = dones.findIndex((d) => !d);

  const steps: ActivationStep[] = defs.map((d, i) => ({
    id: d.id,
    label: d.label,
    done: dones[i],
    current: i === currentIndex,
  }));

  const completedCount = dones.filter(Boolean).length;
  const totalCount = defs.length;
  const percent = Math.round((completedCount / totalCount) * 100);
  const activated = currentIndex === -1;

  const status: ActivationState['status'] = activated
    ? 'activated'
    : completedCount <= 1
      ? 'new'
      : 'activating';

  // Honest stall detection: prefer real activity recency; fall back to
  // account age only when provided. Never guesses without a signal.
  const stallSignalDays =
    ctx.daysSinceLastActivity ?? (opts.accountAgeDays ?? null);
  const stalled = !activated && stallSignalDays !== null && stallSignalDays >= STALL_DAYS;
  const stalledDays = stalled ? stallSignalDays : null;

  let nudge: ActivationNudge | null = null;
  let currentStepId: ActivationStepId | null = null;
  if (!activated) {
    currentStepId = defs[currentIndex].id;
    nudge = nudgeFor(currentStepId, ctx, actionFor(currentStepId, ctx));
  }

  return {
    status,
    steps,
    currentStepId,
    completedCount,
    totalCount,
    percent,
    stalled,
    stalledDays,
    nudge,
  };
}
