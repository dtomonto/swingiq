// ============================================================
// SwingIQ — Motion Lab: Coaching Report
// ------------------------------------------------------------
// Turns metrics + phases + scores into a useful, grounded coaching
// report. Every recommendation is tied to a detected metric and its
// confidence — no generic tips, and no claims beyond what the proxies
// support. Multiple tones reframe the SAME findings for different users.
// ============================================================

import type {
  CaptureContext,
  MotionMetric,
  MotionPhaseSegment,
  MotionScoreboard,
  DrillPlan,
  CoachingReport,
  CoachingFix,
  CoachingTone,
} from './types';
import { getSport, getMotion } from './taxonomy';

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

/** A heuristic root-cause hypothesis from which metric clusters are weak. */
function rootCauseHypothesis(weakIds: Set<string>): string {
  if (weakIds.has('sequencing') || weakIds.has('hip_shoulder_sep')) {
    return 'The most likely root cause is that the downswing starts with the arms and upper body instead of the lower body — so the stored stretch is released too early and out of order.';
  }
  if (weakIds.has('pelvis_sway') || weakIds.has('head_stability')) {
    return 'The most likely root cause is excess lateral movement — the body slides toward the target instead of rotating around a stable centre, which moves the low point and costs power.';
  }
  if (weakIds.has('spine_change')) {
    return 'The most likely root cause is a loss of posture (the torso lifts or thrusts toward the ball line through the strike), which changes where the implement bottoms out.';
  }
  if (weakIds.has('shoulder_turn') || weakIds.has('rom')) {
    return 'The most likely root cause is a restricted turn — there isn’t enough range to build and deliver speed, often a mobility or setup issue.';
  }
  if (weakIds.has('balance_finish')) {
    return 'The most likely root cause is that the sequence runs out of control before the finish — balance at the end is usually a symptom of timing earlier in the motion.';
  }
  return 'No single dominant fault stands out — the opportunities are spread across several areas, so small, broad improvements will add up.';
}

function fixFromMetric(m: MotionMetric, rank: number): CoachingFix {
  return {
    rank,
    title: m.name,
    problem: m.explanation + ' ' + m.whyItMatters,
    fix: m.recommendedFix,
    metricIds: [m.id],
    phase: m.phase,
    drillId: m.drillId,
  };
}

export function buildReport(
  capture: CaptureContext,
  metrics: MotionMetric[],
  phases: MotionPhaseSegment[],
  scoreboard: MotionScoreboard,
  _drills: DrillPlan,
): CoachingReport {
  const sport = getSport(capture.sport);
  const motion = getMotion(capture.sport, capture.motionType).label.toLowerCase();

  const scored = metrics.filter((m) => m.normalizedScore != null);
  const byScoreAsc = [...scored].sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100));
  const byScoreDesc = [...scored].sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0));

  const weakest = byScoreAsc.slice(0, 3);
  const strongest = byScoreDesc.slice(0, 3);
  const weakIds = new Set(weakest.map((m) => m.id));

  const biggestOpportunity = weakest[0];
  const keyStrength = strongest[0];

  const executiveSummary =
    `Your ${motion} scored ${scoreboard.overall}/100 overall. ` +
    (keyStrength ? `Your standout is ${keyStrength.name.toLowerCase()}. ` : '') +
    (biggestOpportunity
      ? `The single biggest opportunity is ${biggestOpportunity.name.toLowerCase()} — improving it will move the most other numbers.`
      : 'Keep grooving what’s working.');

  const diagnosis = biggestOpportunity
    ? `The clearest pattern is in your ${biggestOpportunity.name.toLowerCase()}: ${biggestOpportunity.explanation} On a ${scoreboard.confidence < 0.4 ? 'lower-confidence' : 'moderate-confidence'} read of this video, that’s where focused work pays off fastest.`
    : 'No dominant fault was detected — this is a clean, well-sequenced motion for the data available.';

  const rootCause = rootCauseHypothesis(weakIds);

  const phaseBreakdown = phases.map((p) => {
    const phaseMetric = scored.find((m) => m.phase === p.key);
    const note = phaseMetric
      ? `${p.interpretation} Key read here: ${phaseMetric.name.toLowerCase()} (${phaseMetric.value}${phaseMetric.unit}).`
      : p.interpretation;
    return { phase: p.key, label: p.label, note, confidence: p.confidence };
  });

  const topFixes: CoachingFix[] = weakest
    .filter((m) => m.drillId || m.recommendedFix)
    .slice(0, 3)
    .map((m, i) => fixFromMetric(m, i + 1));

  const whatNotToChange = strongest
    .filter((m) => (m.normalizedScore ?? 0) >= 60)
    .map((m) => `${m.name} (${m.value}${m.unit}) is working — don’t trade it away chasing something else.`);
  if (whatNotToChange.length === 0) {
    whatNotToChange.push('Keep your overall intent and athleticism — rebuild the details around your natural motion, not against it.');
  }

  const practicePlan = [
    `Start each session with the #1 fix: ${topFixes[0]?.title ?? 'your highlighted focus'} — slow and deliberate first.`,
    'Do 10–15 minutes of focused drill work before any full-speed reps.',
    `Re-film the same ${motion} from the same angle once a week and re-analyse to track change.`,
    'Change one thing at a time — give each fix at least a week before judging it.',
  ];

  const headline = biggestOpportunity
    ? `${biggestOpportunity.name}: ${biggestOpportunity.recommendedFix}`
    : 'Solid motion — keep it repeatable.';

  const tones: Record<CoachingTone, string> = {
    beginner: biggestOpportunity
      ? `In plain terms: work on your ${biggestOpportunity.name.toLowerCase()}. ${biggestOpportunity.recommendedFix} One change, lots of slow reps.`
      : 'Nice motion — keep practising the way you are and stay relaxed.',
    athlete: headline + ' Train it with intent, then test under speed.',
    coach: `Primary fault: ${biggestOpportunity?.name ?? 'none dominant'} (${biggestOpportunity?.value ?? '—'}${biggestOpportunity?.unit ?? ''}, conf ${pct((biggestOpportunity?.confidence ?? 0) * 100)}). Root-cause hypothesis: ${rootCause}`,
    youth: biggestOpportunity
      ? `Great effort! One fun thing to practise: ${biggestOpportunity.recommendedFix} Make it a game and try it slowly first. 🎯`
      : 'Awesome job — your move looks great! Keep having fun out there. 🎉',
    data: `Overall ${scoreboard.overall}/100 · confidence ${pct(scoreboard.confidence * 100)} · weakest: ${weakest.map((m) => `${m.id}=${m.normalizedScore}`).join(', ')}.`,
  };

  const limitations = [
    'This analysis comes from a single-camera video using estimated 3D pose — it is directional, not a lab measurement.',
    `Capture confidence for this clip was ${pct(scoreboard.confidence * 100)}. Better light, a clean side or face-on angle, and the full body in frame all raise it.`,
    'Reference ranges are starter heuristics, not validated norms. They are editable and sport-/level-dependent.',
    'No medical, injury-risk, or guaranteed-improvement claims are made. For competitive decisions, confirm with a qualified coach.',
  ];
  if (capture.view === 'unknown') {
    limitations.push('Camera view was not specified — confirming a side or face-on angle would improve rotation and separation reads.');
  }

  return {
    executiveSummary,
    diagnosis,
    rootCause,
    phaseBreakdown,
    topFixes,
    whatNotToChange,
    practicePlan,
    tones,
    limitations,
    confidence: scoreboard.confidence,
  };
}

/** A one-line key-fault headline for list cards. */
export function keyFaultLine(metrics: MotionMetric[]): string {
  const weakest = metrics
    .filter((m) => m.normalizedScore != null)
    .sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100))[0];
  return weakest ? `Focus: ${weakest.name}` : 'Balanced motion';
}
