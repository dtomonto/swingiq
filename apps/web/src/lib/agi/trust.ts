// ============================================================
// SwingIQ — AGI: Trust grade (meta-confidence)
// ------------------------------------------------------------
// One honest "how much should I trust this whole picture?" grade. It blends
// coverage, the basis quality of the evidence (measured vs single-camera
// estimate), sample depth, and cross-sport breadth — and always says what
// would raise it. This is the meta-layer the product's honesty ethos calls
// for: never present conclusions without a clear read on their certainty.
// ============================================================

import { CAPABILITIES } from './capabilities';
import { AGI_THRESHOLDS } from './config/thresholds';
import type { AthleteWorldModel, Basis, TrustGrade } from './types';

const BASIS_RANK: Record<Basis, number> = {
  measured: 4,
  estimated: 3,
  ai_inferred: 2,
  user_entered: 1,
  placeholder: 0,
};

export function gradeModel(model: AthleteWorldModel): TrustGrade {
  const observed = model.capabilities.filter((c) => c.score !== null);

  const T = AGI_THRESHOLDS.trust;
  const coveragePts = model.coverage * T.weights.coverage; // breadth of what we know
  const basisAvg = observed.length
    ? observed.reduce((s, c) => s + BASIS_RANK[c.basis], 0) / observed.length
    : 0;
  const basisPts = (basisAvg / 4) * T.weights.basis; // quality of the evidence
  const depthPts = Math.min(1, model.dataMap.totalSessions / T.depthFullAt) * T.weights.depth;
  const breadthPts = Math.min(1, model.sports.length / 2) * T.weights.breadth; // multi-sport

  const score = Math.round(coveragePts + basisPts + depthPts + breadthPts);
  const grade = score >= T.grade.A ? 'A' : score >= T.grade.B ? 'B' : score >= T.grade.C ? 'C' : 'D';

  const reasons: string[] = [];
  if (model.dataMap.totalSessions === 0) {
    reasons.push('No analysed sessions yet — this is a blank slate.');
  } else if (model.dataMap.totalSessions < 4) {
    reasons.push('Only a few sessions so far — more captures firm this up.');
  }
  if (observed.length < CAPABILITIES.length) {
    reasons.push(
      `${CAPABILITIES.length - observed.length} of ${CAPABILITIES.length} capabilities not yet observed.`,
    );
  }
  if (basisAvg > 0 && basisAvg < T.basisEstimateCutoff) {
    reasons.push('Scores are single-camera estimates — a 2-camera (true-3D) capture raises certainty.');
  }
  if (model.sports.length < 2 && model.dataMap.totalSessions > 0) {
    reasons.push('Only one sport has data — a second sport sharpens the cross-sport read.');
  }
  if (reasons.length === 0) {
    reasons.push('Good coverage across capabilities, sessions, and basis quality.');
  }

  const headline =
    grade === 'A'
      ? 'Strong, well-evidenced picture.'
      : grade === 'B'
        ? 'Solid picture with a few gaps.'
        : grade === 'C'
          ? 'Early picture — directional, not definitive.'
          : 'Thin picture — treat it as a first sketch.';

  // The single highest-impact action to raise the grade, with a deep link.
  let nextStep: TrustGrade['nextStep'];
  if (model.dataMap.totalSessions === 0) {
    nextStep = { text: 'Run your first Motion Lab analysis to seed your model.', href: '/motion-lab' };
  } else if (basisAvg > 0 && basisAvg < T.basisEstimateCutoff) {
    nextStep = {
      text: 'Capture a 2-camera “true 3D” analysis — it measures depth instead of estimating it, which raises the certainty of every score.',
      href: '/motion-lab',
    };
  } else if (model.sports.length < 2) {
    nextStep = {
      text: 'Analyse a second sport so the engine can find what transfers between them.',
      href: '/motion-lab',
    };
  } else if (observed.length < CAPABILITIES.length) {
    nextStep = {
      text: 'A few more captures will fill in the capabilities not yet observed.',
      href: '/motion-lab',
    };
  }

  return { grade, score, headline, reasons: reasons.slice(0, 4), nextStep };
}
