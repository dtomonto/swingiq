// ============================================================
// SwingVantage — Fix Stack Builder
// ------------------------------------------------------------
// Turns a diagnosed fault into the branded 3-part intervention:
//   Feel Cue  →  Drill  →  Retest.
//
// It is the bridge between three existing systems:
//   - the fault ontology (retest criteria + how to explain it),
//   - DrillMatch (which drill, and why),
//   - the user's feedback history (what worked before).
// Confidence is always honest: rules-based matching is never
// dressed up as measured biomechanics.
// ============================================================

import { resolveFault } from '@/lib/faults';
import type { AgentConfidence } from '@/lib/agents';
import type {
  DrillFeedbackRepository,
  DrillMatchInput,
  FixStack,
  FixStackRetest,
  RankedDrill,
} from './types';
import { rankDrills, normalizeMatchInput } from './scoring';
import { localDrillFeedbackRepo } from './feedback';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function friendlyDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function addDays(iso: string, days: number): Date {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d;
}

function buildRetest(
  retest: { activeWindowDays: number; whatToReassess: string; sameConditions: string[]; improvedWhen: string },
  nowIso: string,
): FixStackRetest {
  const due = addDays(nowIso, retest.activeWindowDays);
  return {
    whatToReassess: retest.whatToReassess,
    sameConditions: retest.sameConditions,
    improvedWhen: retest.improvedWhen,
    activeWindowDays: retest.activeWindowDays,
    dueOn: due.toISOString(),
    dueLabel: `by ${friendlyDate(due)}`,
  };
}

/**
 * Honest confidence for the Fix Stack. Starts from the upstream analysis
 * confidence (rules-only defaults to low) and only nudges UP when there is a
 * real reason: a direct, curated fault match, or the user's own "this helped"
 * history. Never claims more than the evidence supports.
 */
function deriveConfidence(
  top: RankedDrill | null,
  faultGenerated: boolean,
  input: DrillMatchInput,
): AgentConfidence {
  const order: AgentConfidence['level'][] = ['low', 'medium', 'high'];
  let idx = order.indexOf(input.analysisConfidence ?? 'low');
  const notes: string[] = [];

  if (top?.directHit && !faultGenerated) {
    idx = Math.max(idx, 1); // at least medium when a curated drill targets the exact fault
    notes.push('a drill that targets your exact reported issue');
  } else {
    idx = Math.min(idx, 1); // no direct, curated match → cap at medium
    notes.push('drills matched to the skill area of your issue');
  }

  if (top?.feedbackApplied === 'helped') {
    idx = Math.min(order.length - 1, idx + 1);
    notes.push('your own "this helped" feedback');
  } else if (top?.feedbackApplied === 'hurt') {
    idx = 0;
  }

  const level = order[Math.max(0, Math.min(order.length - 1, idx))];
  const score = level === 'high' ? 80 : level === 'medium' ? 60 : 38;
  const reason = `Based on ${notes.join(' and ')} — matched by rules, not measured. Retesting will raise this.`;
  return { level, score, reason };
}

function buildMistakeToAvoid(rootCauses: string[]): string {
  const cause = rootCauses[0]?.trim();
  if (cause) {
    return `Don't rush it — "${cause.charAt(0).toLowerCase() + cause.slice(1)}" is the habit you're replacing, so keep reps slow and controlled until the new feel is automatic.`;
  }
  return "Don't chase speed. Keep reps slow and controlled until the new feel is automatic, then build pace.";
}

const BASIS_NOTE =
  'DrillMatch chooses this from rules based on your reported issue — not from measured biomechanics. Practise it, then retest to confirm it actually worked.';

/**
 * Build a complete Fix Stack for one fault. Always returns a usable stack:
 * if no drill matches (e.g. an unrecognized sport), it falls back to an
 * honest, clearly-`generated` stack built from the fault's own guidance.
 */
export function buildFixStack(
  rawInput: DrillMatchInput,
  repo: DrillFeedbackRepository = localDrillFeedbackRepo,
  nowIso: string = new Date().toISOString(),
): FixStack {
  const input = normalizeMatchInput(rawInput);
  const ranked = rankDrills(input, repo);
  const fault = resolveFault(input.faultId ?? '', { label: input.faultName, sport: input.sport });
  const retest = buildRetest(fault.retest, nowIso);
  const top = ranked[0] ?? null;

  // ── No drill matched — honest generated stack from the fault itself ──
  if (!top) {
    return {
      sport: input.sport,
      faultId: fault.id || (input.faultName ?? 'swing-focus'),
      faultName: fault.name,
      feelCue: {
        title: 'Feel Cue',
        body: `Work on one thing: "${fault.name.toLowerCase()}". Keep it smooth and athletic, not forced.`,
      },
      drill: {
        id: 'generated_self_check',
        name: 'Slow-motion mirror rehearsal',
        goal: `Groove a cleaner pattern for "${fault.name.toLowerCase()}" before adding speed.`,
        steps: [
          'Set up in front of a mirror or with your phone recording from the side.',
          'Rehearse the movement at quarter speed, watching the one thing above.',
          'Do short sets, resting between them — quality over quantity.',
        ],
        repsOrDuration: '3 sets of 8 slow reps',
        estimatedMinutes: 8,
        difficulty: 'beginner',
        skillLevel: input.skillLevel ?? 'beginner',
        equipment: [],
        coachingHint: 'Any reputable coach for your sport',
        youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${input.sport} ${fault.name} drill`,
        )}`,
        why: 'No specific curated drill matched this exact pattern yet, so this is a safe, general rehearsal.',
        safetyNote: fault.safetyCautions[0] ?? null,
      },
      retest,
      mistakeToAvoid: buildMistakeToAvoid(fault.likelyRootCauses),
      confidence: deriveConfidence(null, fault.generated ?? false, input),
      alternatives: [],
      basisNote: BASIS_NOTE,
      generated: true,
      createdAt: nowIso,
    };
  }

  const d = top.drill;
  const why = top.reasons
    .filter((r) => r.weight > 0)
    .slice(0, 2)
    .map((r) => r.label)
    .join(' · ');

  return {
    sport: input.sport,
    faultId: fault.id || (input.faultName ?? 'swing-focus'),
    faultName: fault.name,
    feelCue: {
      title: 'Feel Cue',
      body: d.feelCue,
    },
    drill: {
      id: d.id,
      name: d.name,
      goal: d.goal,
      steps: d.steps,
      repsOrDuration: d.repsOrDuration,
      estimatedMinutes: d.estimatedMinutes,
      difficulty: d.difficulty,
      skillLevel: d.skillLevel,
      equipment: d.equipment,
      coachingHint: d.coachingHint,
      youtubeSearchUrl: d.youtubeSearchUrl,
      why: why || 'Best rule-based match for your reported issue.',
      safetyNote: d.safetyNote,
    },
    retest,
    mistakeToAvoid: buildMistakeToAvoid(fault.likelyRootCauses),
    confidence: deriveConfidence(top, fault.generated ?? false, input),
    alternatives: ranked.slice(1),
    basisNote: BASIS_NOTE,
    generated: fault.generated ?? false,
    createdAt: nowIso,
  };
}
