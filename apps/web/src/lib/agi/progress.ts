// ============================================================
// SwingVantage — AGI: Progress over time (pure)
// ------------------------------------------------------------
// Compares the current world model against a prior stored snapshot so the
// engine can honestly answer "did the thing I told you to train actually move?"
// — closing the retest loop the planner keeps promising. Pure: it takes the
// model + a history array (persisted elsewhere) and never reads storage itself.
// ============================================================

import type {
  AGISnapshot,
  AthleteWorldModel,
  CapabilityProgress,
  Insight,
  ProgressReport,
} from './types';

const dayOf = (iso: string) => iso.slice(0, 10);

/** The capability the athlete is currently weakest at (the focus / keystone). */
export function focusCapability(model: AthleteWorldModel) {
  const observed = model.capabilities.filter((c) => c.score !== null);
  if (observed.length === 0) return null;
  return observed.reduce((lo, c) => (c.score! < lo.score! ? c : lo), observed[0]).capability;
}

/** A compact, persistable snapshot of the current model. */
export function snapshotFromModel(model: AthleteWorldModel): AGISnapshot {
  return {
    at: model.generatedAt,
    coverage: model.coverage,
    capabilities: model.capabilities.map((c) => ({ id: c.capability, score: c.score, basis: c.basis })),
    keystone: focusCapability(model),
    sports: model.sports,
  };
}

function buildSummary(
  sinceDate: string,
  improver: CapabilityProgress | null,
  decliner: CapabilityProgress | null,
  keystone: CapabilityProgress | null,
): string {
  const since = dayOf(sinceDate);
  const parts: string[] = [];
  if (keystone && keystone.delta !== null && keystone.delta !== 0) {
    parts.push(
      keystone.delta > 0
        ? `Your focus, ${keystone.name}, is up ${keystone.delta} (${keystone.before}→${keystone.after}) — the work is paying off.`
        : `Your focus, ${keystone.name}, slipped ${Math.abs(keystone.delta)} (${keystone.before}→${keystone.after}); worth a steadier block.`,
    );
  }
  if (improver && improver.delta !== null && (!keystone || improver.capability !== keystone.capability)) {
    parts.push(`Biggest gain: ${improver.name} +${improver.delta}.`);
  }
  if (decliner && decliner.delta !== null && (!keystone || decliner.capability !== keystone.capability)) {
    parts.push(`Watch ${decliner.name} (${decliner.delta}).`);
  }
  if (parts.length === 0) {
    return `No meaningful change since ${since} — capabilities are holding steady. Consistency over time is its own win.`;
  }
  return `Since ${since}: ${parts.join(' ')}`;
}

/** Compare the model to the most recent snapshot from a DIFFERENT day. */
export function buildProgress(
  model: AthleteWorldModel,
  history: AGISnapshot[],
): ProgressReport | null {
  if (!history.length) return null;
  const today = dayOf(model.generatedAt);

  let baseline: AGISnapshot | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (dayOf(history[i].at) !== today) {
      baseline = history[i];
      break;
    }
  }
  if (!baseline) return null;

  const baseMap = new Map(baseline.capabilities.map((c) => [c.id, c.score] as const));
  const deltas: CapabilityProgress[] = [];
  for (const c of model.capabilities) {
    if (c.score === null) continue;
    const before = baseMap.get(c.capability) ?? null;
    const after = c.score;
    const delta = before !== null ? Math.round(after - before) : null;
    deltas.push({ capability: c.capability, name: c.name, before, after, delta });
  }

  const moved = deltas.filter((d) => d.delta !== null);
  const biggestImprover = moved.filter((d) => d.delta! > 0).sort((a, b) => b.delta! - a.delta!)[0] ?? null;
  const biggestDecliner = moved.filter((d) => d.delta! < 0).sort((a, b) => a.delta! - b.delta!)[0] ?? null;
  const focus = focusCapability(model);
  const keystoneMoved = focus ? deltas.find((d) => d.capability === focus && d.delta !== null) ?? null : null;

  return {
    sinceDate: baseline.at,
    snapshots: history.length,
    deltas,
    biggestImprover,
    biggestDecliner,
    keystoneMoved,
    summary: buildSummary(baseline.at, biggestImprover, biggestDecliner, keystoneMoved),
  };
}

/** Turn a progress report into a ranked insight. */
export function progressToInsight(report: ProgressReport): Insight {
  const positive =
    (report.keystoneMoved?.delta ?? 0) > 0 || (report.biggestImprover?.delta ?? 0) > 0;
  return {
    id: 'progress',
    kind: 'progress',
    title: 'Progress since last time',
    summary: report.summary,
    capability: report.keystoneMoved?.capability ?? report.biggestImprover?.capability ?? null,
    sports: [],
    reasoning: [
      {
        claim: `Compared with your snapshot from ${dayOf(report.sinceDate)}.`,
        evidence: report.deltas
          .filter((d) => d.delta !== null)
          .map((d) => `${d.name}: ${d.before}→${d.after} (${d.delta! >= 0 ? '+' : ''}${d.delta})`),
      },
    ],
    basis: 'estimated',
    confidence: 0.7,
    leverage: 0.5,
    action: positive
      ? 'Keep the same focus — it is working. Re-check again after a few more sessions.'
      : 'Hold your focus steady and prioritise repeatable reps before changing it.',
  };
}
