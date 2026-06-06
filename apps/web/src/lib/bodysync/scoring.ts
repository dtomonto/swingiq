// ============================================================
// SwingVantage — BodySync: derived scoring engine
//
// Pure, conservative, confidence-scored. Turns a daily check-in (+ any
// objective device samples + baselines + recent history) into Readiness,
// Recovery, Training-Load, Performance-Opportunity scores, an Injury-Risk
// flag, and a Green/Yellow/Orange/Red zone.
//
// Principles: never overstate precision; degrade gracefully when inputs are
// missing (confidence drops, scores stay neutral); every score exposes its
// signed contributors so the UI can explain itself. No medical claims.
// ============================================================

import type {
  ManualCheckin, HealthMetricSample, HealthBaselines, MetricType,
  ScoreResult, ReadinessZone, InjuryRiskFlag, ReadinessAssessment, Confidence,
} from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const r0 = (n: number) => Math.round(n);

const DEFAULT_SLEEP_TARGET = 7.5;

interface ScoreInput {
  today: ManualCheckin | null;
  history: ManualCheckin[]; // recent check-ins, excluding today, newest-first OK
  samples: HealthMetricSample[]; // objective device samples (may be empty)
  baselines: HealthBaselines;
}

// ── sample helpers ───────────────────────────────────────────
function latestSample(samples: HealthMetricSample[], type: MetricType): number | null {
  let best: HealthMetricSample | null = null;
  for (const s of samples) {
    if (s.metricType !== type) continue;
    if (!best || s.timestamp > best.timestamp) best = s;
  }
  return best ? best.value : null;
}

function confidenceFrom(objectiveSignals: number, subjectiveFields: number): Confidence {
  if (objectiveSignals >= 2) return 'high';
  if (objectiveSignals >= 1 || subjectiveFields >= 5) return 'moderate';
  return 'low';
}

function countAnswered(c: ManualCheckin | null): number {
  if (!c) return 0;
  const fields = [c.sleepHours, c.sleepQuality, c.energy, c.soreness, c.pain, c.stress, c.hydration, c.mentalFocus];
  return fields.filter((v) => v !== null && v !== undefined).length;
}

// ════════════════════════════════════════════════════════════
//  RECOVERY — how recovered the body is right now
// ════════════════════════════════════════════════════════════
export function recoveryScore(input: ScoreInput): ScoreResult {
  const { today, samples, baselines } = input;
  const contributors: ScoreResult['contributors'] = [];
  const missing: string[] = [];
  let score = 60; // neutral baseline
  let objective = 0;

  // Sleep hours vs baseline (objective if entered or sampled)
  const sleepHours = today?.sleepHours ?? latestSample(samples, 'sleep_duration');
  const sleepTarget = baselines.sleepHours ?? DEFAULT_SLEEP_TARGET;
  if (sleepHours !== null) {
    const d = clamp((sleepHours - sleepTarget) * 6, -18, 18);
    score += d; contributors.push({ label: `Sleep ${sleepHours}h vs ${sleepTarget}h target`, impact: r0(d) });
    if (today?.sleepHours == null) objective++;
  } else missing.push('sleep duration');

  // Sleep quality (subjective 1–5)
  if (today?.sleepQuality != null) {
    const d = clamp((today.sleepQuality - 3) * 8, -16, 16);
    score += d; contributors.push({ label: 'Sleep quality', impact: r0(d) });
  }

  // Soreness (1–5, higher worse)
  if (today?.soreness != null) {
    const d = clamp((3 - today.soreness) * 7, -14, 14);
    score += d; contributors.push({ label: 'Soreness', impact: r0(d) });
  }

  // HRV vs baseline (objective)
  const hrv = latestSample(samples, 'hrv');
  if (hrv !== null && baselines.hrv) {
    const d = clamp(((hrv - baselines.hrv) / baselines.hrv) * 100 * 0.4, -15, 15);
    score += d; contributors.push({ label: 'HRV vs baseline', impact: r0(d) }); objective++;
  } else missing.push('HRV');

  // Resting HR vs baseline (objective, lower better)
  const rhr = latestSample(samples, 'resting_hr');
  if (rhr !== null && baselines.restingHr) {
    const d = clamp(((baselines.restingHr - rhr) / baselines.restingHr) * 100 * 0.6, -15, 15);
    score += d; contributors.push({ label: 'Resting HR vs baseline', impact: r0(d) }); objective++;
  } else missing.push('resting heart rate');

  // Device-provided recovery score, if any (trusted, blended)
  const devRecovery = latestSample(samples, 'recovery_score');
  if (devRecovery !== null) {
    score = score * 0.5 + devRecovery * 0.5;
    contributors.push({ label: 'Device recovery score', impact: r0(devRecovery - 60) }); objective++;
  }

  if (today?.illness) { score -= 20; contributors.push({ label: 'Feeling ill', impact: -20 }); }
  if (today?.alcohol) { score -= 8; contributors.push({ label: 'Alcohol', impact: -8 }); }
  if (today?.travelFatigue) { score -= 6; contributors.push({ label: 'Travel fatigue', impact: -6 }); }

  return {
    score: clamp(r0(score)),
    confidence: confidenceFrom(objective, countAnswered(today)),
    contributors,
    missing,
  };
}

// ════════════════════════════════════════════════════════════
//  TRAINING LOAD — accumulated stress (higher = more load)
// ════════════════════════════════════════════════════════════
export function trainingLoadScore(input: ScoreInput): ScoreResult {
  const { today, history, samples } = input;
  const contributors: ScoreResult['contributors'] = [];
  const missing: string[] = [];
  let score = 25;
  let objective = 0;

  const recent = [today, ...history].filter(Boolean) as ManualCheckin[];
  const last7 = recent.slice(0, 7);
  const intensities = last7.map((c) => c.practiceIntensity).filter((v): v is number => v != null);

  if (intensities.length) {
    const avg = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const d = clamp(avg * 9, 0, 45);
    score += d; contributors.push({ label: `Avg practice intensity (${avg.toFixed(1)}/5)`, impact: r0(d) });

    const hardDays = intensities.filter((i) => i >= 4).length;
    if (hardDays >= 2) { score += hardDays * 5; contributors.push({ label: `${hardDays} hard days this week`, impact: hardDays * 5 }); }

    // Acute spike: today well above the recent average.
    if (today?.practiceIntensity != null && today.practiceIntensity - avg >= 2) {
      score += 15; contributors.push({ label: 'Sharp workload spike today', impact: 15 });
    }
  } else missing.push('recent practice intensity');

  // Objective load from device exercise minutes (acute proxy)
  const exMin = latestSample(samples, 'exercise_minutes');
  if (exMin !== null) {
    const d = clamp(exMin / 6, 0, 25);
    score += d; contributors.push({ label: 'Exercise minutes (device)', impact: r0(d) }); objective++;
  }
  const devLoad = latestSample(samples, 'training_load') ?? latestSample(samples, 'acute_load');
  if (devLoad !== null) { score = score * 0.6 + clamp(devLoad) * 0.4; objective++; }

  return {
    score: clamp(r0(score)),
    confidence: confidenceFrom(objective, intensities.length),
    contributors,
    missing,
  };
}

// ════════════════════════════════════════════════════════════
//  READINESS — composite "ready to train hard today"
// ════════════════════════════════════════════════════════════
export function readinessScore(input: ScoreInput, recovery: ScoreResult, load: ScoreResult): ScoreResult {
  const { today } = input;
  const contributors: ScoreResult['contributors'] = [];
  let score = recovery.score * 0.55;
  contributors.push({ label: 'Recovery', impact: r0(recovery.score * 0.55 - 30) });

  if (today?.energy != null) {
    const d = clamp((today.energy - 3) * 6, -12, 12);
    score += d; contributors.push({ label: 'Energy', impact: r0(d) });
  }
  if (today?.stress != null) {
    const d = clamp((3 - today.stress) * 5, -10, 10);
    score += d; contributors.push({ label: 'Stress', impact: r0(d) });
  }
  if (today?.pain != null && today.pain >= 3) {
    const d = -(today.pain - 2) * 8;
    score += d; contributors.push({ label: 'Pain', impact: r0(d) });
  }
  // High accumulated load drags readiness down.
  if (load.score > 60) {
    const d = -(load.score - 60) * 0.25;
    score += d; contributors.push({ label: 'High recent load', impact: r0(d) });
  }
  // Baseline lift so a fully-neutral day lands mid-scale.
  score += 27;

  return {
    score: clamp(r0(score)),
    confidence: recovery.confidence,
    contributors,
    missing: recovery.missing,
  };
}

// ════════════════════════════════════════════════════════════
//  PERFORMANCE OPPORTUNITY — is today a day to chase a PR?
// ════════════════════════════════════════════════════════════
export function performanceOpportunityScore(
  input: ScoreInput, readiness: ScoreResult, load: ScoreResult,
): ScoreResult {
  const { today, history } = input;
  const contributors: ScoreResult['contributors'] = [];
  let score = readiness.score * 0.6 + 20;
  contributors.push({ label: 'Readiness', impact: r0(readiness.score * 0.6 - 30) });

  if (today?.sleepQuality != null) {
    const d = clamp((today.sleepQuality - 3) * 5, -10, 10);
    score += d; contributors.push({ label: 'Sleep quality', impact: r0(d) });
  }
  if (today?.soreness != null) {
    const d = clamp((3 - today.soreness) * 5, -10, 10);
    score += d; contributors.push({ label: 'Low soreness', impact: r0(d) });
  }
  // Two consecutive recovery-positive days = trending up.
  const prevGood = history[0] && (history[0].soreness ?? 3) <= 2 && (history[0].energy ?? 3) >= 4;
  if (prevGood && (today?.energy ?? 3) >= 4) { score += 8; contributors.push({ label: 'Positive 2-day trend', impact: 8 }); }
  if (load.score > 70) { score -= 12; contributors.push({ label: 'Load spike caps upside', impact: -12 }); }

  return { score: clamp(r0(score)), confidence: readiness.confidence, contributors, missing: [] };
}

// ════════════════════════════════════════════════════════════
//  INJURY RISK
// ════════════════════════════════════════════════════════════
export function injuryRisk(input: ScoreInput, recovery: ScoreResult, load: ScoreResult): InjuryRiskFlag {
  const { today, history } = input;
  const reasons: string[] = [];
  const regions = today?.painAreas ?? [];
  const pain = today?.pain ?? 0;
  const spike = load.contributors.some((c) => /spike/i.test(c.label));

  if (pain >= 3) reasons.push(`Reported ${pain >= 4 ? 'significant' : 'moderate'} discomfort`);
  if (spike && recovery.score < 45) reasons.push('Workload spike on a low-recovery day');
  if (recovery.score < 40) reasons.push('Recovery is running low');

  // Repeated fatigue: 3+ of last 4 days low energy.
  const lowEnergyDays = [today, ...history].slice(0, 4)
    .filter((c) => c && (c.energy ?? 3) <= 2).length;
  if (lowEnergyDays >= 3) reasons.push('Several low-energy days in a row');
  if (today?.illness) reasons.push('Feeling ill');

  let level: InjuryRiskFlag['level'] = 'none';
  if (pain >= 4 || (spike && recovery.score < 40) || (pain >= 3 && load.score > 70)) level = 'elevated';
  else if (reasons.length > 0) level = 'watch';

  return { level, reasons, regions };
}

// ════════════════════════════════════════════════════════════
//  ZONE + full assessment
// ════════════════════════════════════════════════════════════
export function zoneFor(readiness: ScoreResult, risk: InjuryRiskFlag, today: ManualCheckin | null): ReadinessZone {
  const pain = today?.pain ?? 0;
  if (readiness.score < 35 || risk.level === 'elevated' || pain >= 4 || today?.illness) return 'red';
  if (readiness.score < 50 || risk.level === 'watch' || pain >= 3) return 'orange';
  if (readiness.score < 70) return 'yellow';
  return 'green';
}

function summaryLine(zone: ReadinessZone, conf: Confidence): string {
  const base = {
    green: 'You look ready — green light for full training.',
    yellow: 'Moderate readiness — train, but keep the intensity in check.',
    orange: 'Elevated fatigue signals — favor light technical work today.',
    red: 'Your signals point to recovery — go easy today.',
  }[zone];
  return conf === 'low' ? `${base} (low-confidence estimate — add more check-in detail to sharpen it.)` : base;
}

export function assessReadiness(input: ScoreInput, date: string): ReadinessAssessment {
  const recovery = recoveryScore(input);
  const trainingLoad = trainingLoadScore(input);
  const readiness = readinessScore(input, recovery, trainingLoad);
  const performanceOpportunity = performanceOpportunityScore(input, readiness, trainingLoad);
  const risk = injuryRisk(input, recovery, trainingLoad);
  const zone = zoneFor(readiness, risk, input.today);

  return {
    date,
    zone,
    readiness,
    recovery,
    trainingLoad,
    performanceOpportunity,
    injuryRisk: risk,
    confidence: readiness.confidence,
    summary: summaryLine(zone, readiness.confidence),
  };
}

/** Learn simple objective baselines from check-in history (avg sleep hours). */
export function computeBaselines(history: ManualCheckin[], current: HealthBaselines): HealthBaselines {
  const hours = history.map((c) => c.sleepHours).filter((v): v is number => v != null);
  if (hours.length < 3) return current;
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
  return { ...current, sleepHours: Math.round(avg * 10) / 10, updatedAt: new Date().toISOString() };
}
