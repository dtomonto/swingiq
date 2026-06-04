// ============================================================
// SwingIQ — AGI: Reasoning engine
// ------------------------------------------------------------
// Deterministic, inspectable reasoning over the unified world model. Every
// Insight carries an explicit reasoning chain (claim + evidence), a basis, and
// a confidence — the engine "shows its work" rather than emitting an opaque
// verdict. The signature insight is the KEYSTONE: the one weak capability that
// limits the most sports, found by reasoning over capabilities (not metrics),
// which is exactly what a *general* engine can do that a per-sport one cannot.
// ============================================================

import type { SportId } from '@swingiq/core';
import type {
  AthleteWorldModel,
  CapabilityState,
  Insight,
  ReasoningStep,
  SignalBundle,
} from './types';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

interface SportLabel {
  label: string;
  emoji: string;
}

function labelMap(bundle: SignalBundle): Map<SportId, SportLabel> {
  const m = new Map<SportId, SportLabel>();
  for (const s of bundle.sportSessions) {
    if (!m.has(s.sport)) m.set(s.sport, { label: s.sportLabel, emoji: s.emoji });
  }
  return m;
}

function listSports(sports: SportId[], labels: Map<SportId, SportLabel>): string {
  const names = sports.map((s) => labels.get(s)?.label ?? s);
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// ── Individual reasoners ──────────────────────────────────────

function keystoneInsight(
  model: AthleteWorldModel,
  labels: Map<SportId, SportLabel>,
): Insight | null {
  const observed = model.capabilities.filter(
    (c): c is CapabilityState & { score: number } => c.score !== null,
  );
  if (observed.length === 0) return null;

  // Leverage = how weak it is × how many sports it spans × how sure we are.
  const scored = observed.map((c) => {
    const weakness = clamp01((100 - c.score) / 60);
    const breadthFactor = 0.6 + 0.2 * Math.min(2, c.breadth);
    return { c, leverage: clamp01(weakness * breadthFactor) };
  });
  scored.sort((a, b) => b.leverage - a.leverage);
  const top = scored[0];
  // Only call it a keystone if it is genuinely a weakness.
  if (top.c.score >= 68) return null;

  const sportsText = listSports(top.c.sports, labels);
  const reasoning: ReasoningStep[] = [
    {
      claim: `${top.c.name} is your lowest general capability at ${top.c.score}/100.`,
      evidence: top.c.perSport.map(
        (p) => `${labels.get(p.sport)?.label ?? p.sport}: ${p.score}/100 (${p.sampleCount} reading${p.sampleCount === 1 ? '' : 's'})`,
      ),
    },
    {
      claim:
        top.c.breadth >= 2
          ? `The same capability drives ${top.c.breadth} of your sports (${sportsText}), so it is one root, not several.`
          : `It currently shows in ${sportsText}; as you add other sports it is likely to matter there too.`,
      evidence: [`${top.c.name} spans ${top.c.breadth} sport${top.c.breadth === 1 ? '' : 's'} in your data`],
    },
    {
      claim:
        'Because one trait feeds many motions, improving it is the single highest-leverage thing you can train.',
      evidence: [`leverage score ${(top.leverage * 100).toFixed(0)}/100`],
    },
  ];

  return {
    id: `keystone-${top.c.capability}`,
    kind: 'keystone',
    title: `Keystone: ${top.c.name}`,
    summary:
      top.c.breadth >= 2
        ? `${top.c.name} is your most limiting general skill and it underlies ${sportsText}. Train this one trait and you lift every sport that uses it at once — that is the leverage a cross-sport view gives you.`
        : `${top.c.name} is your most limiting general skill right now (seen in ${sportsText}). It is the first thing worth a dedicated block of practice.`,
    capability: top.c.capability,
    sports: top.c.sports,
    reasoning,
    basis: top.c.basis,
    confidence: clamp01(top.c.confidence),
    leverage: top.leverage,
    action: `Make ${top.c.name} your primary focus for the next 2–3 weeks, then re-analyse to confirm it moved.`,
  };
}

function strengthInsight(
  model: AthleteWorldModel,
  labels: Map<SportId, SportLabel>,
): Insight | null {
  const observed = model.capabilities.filter(
    (c): c is CapabilityState & { score: number } => c.score !== null,
  );
  const best = observed.filter((c) => c.score >= 70).sort((a, b) => b.score - a.score)[0];
  if (!best) return null;
  const sportsText = listSports(best.sports, labels);
  return {
    id: `strength-${best.capability}`,
    kind: 'strength',
    title: `Strength to build on: ${best.name}`,
    summary: `${best.name} is a genuine strength (${best.score}/100${best.breadth >= 2 ? `, consistent across ${sportsText}` : ''}). Use it as your anchor feel — when a session feels off, return to what this strength feels like to reset the rest.`,
    capability: best.capability,
    sports: best.sports,
    reasoning: [
      {
        claim: `${best.name} scores ${best.score}/100 — your highest general capability.`,
        evidence: best.perSport.map((p) => `${labels.get(p.sport)?.label ?? p.sport}: ${p.score}/100`),
      },
    ],
    basis: best.basis,
    confidence: clamp01(best.confidence),
    leverage: 0.4,
    action: `Protect ${best.name} — keep doing whatever is working, and use it as a reference feel for the rest of the motion.`,
  };
}

function imbalanceInsight(
  model: AthleteWorldModel,
  labels: Map<SportId, SportLabel>,
): Insight | null {
  if (!model.crossSport) return null;
  // Find the capability with the widest gap between its strongest and weakest sport.
  let best: { c: CapabilityState; hi: SportId; lo: SportId; gap: number } | null = null;
  for (const c of model.capabilities) {
    if (c.perSport.length < 2) continue;
    const sorted = [...c.perSport].sort((a, b) => b.score - a.score);
    const hi = sorted[0];
    const lo = sorted[sorted.length - 1];
    const gap = hi.score - lo.score;
    if (gap >= 15 && (!best || gap > best.gap)) {
      best = { c, hi: hi.sport, lo: lo.sport, gap };
    }
  }
  if (!best) return null;
  const hiL = labels.get(best.hi)?.label ?? best.hi;
  const loL = labels.get(best.lo)?.label ?? best.lo;
  const hiScore = best.c.perSport.find((p) => p.sport === best!.hi)?.score ?? 0;
  const loScore = best.c.perSport.find((p) => p.sport === best!.lo)?.score ?? 0;
  return {
    id: `imbalance-${best.c.capability}`,
    kind: 'imbalance',
    title: `Transfer gap: ${best.c.name}`,
    summary: `Your ${best.c.name.toLowerCase()} is strong in ${hiL} (${hiScore}/100) but lags in ${loL} (${loScore}/100). The skill already lives in your body — this is a translation problem, not a new skill to build. Borrowing the ${hiL} feel into ${loL} is usually faster than drilling it from scratch.`,
    capability: best.c.capability,
    sports: [best.hi, best.lo],
    reasoning: [
      {
        claim: `${best.c.name} differs by ${best.gap} points between your sports.`,
        evidence: [`${hiL}: ${hiScore}/100`, `${loL}: ${loScore}/100`],
      },
      {
        claim: 'A capability you already own in one sport transfers faster than one you have never built.',
        evidence: ['cross-sport transfer principle'],
      },
    ],
    basis: best.c.basis,
    confidence: clamp01(best.c.confidence * 0.9),
    leverage: clamp01(0.4 + best.gap / 200),
    action: `In your next ${loL} session, copy the ${best.c.name.toLowerCase()} feel from your ${hiL} motion.`,
  };
}

function consistencyInsight(
  model: AthleteWorldModel,
  bundle: SignalBundle,
  labels: Map<SportId, SportLabel>,
): Insight | null {
  // Look for the sport with the most session-to-session score scatter.
  let worst: { sport: SportId; sd: number; n: number } | null = null;
  for (const sport of model.sports) {
    const overalls = bundle.sportSessions
      .filter((s) => s.sport === sport)
      .map((s) => s.overall);
    if (overalls.length < 3) continue;
    const sd = stdev(overalls);
    if (sd >= 8 && (!worst || sd > worst.sd)) worst = { sport, sd, n: overalls.length };
  }
  if (!worst) return null;
  const l = labels.get(worst.sport)?.label ?? worst.sport;
  return {
    id: `consistency-${worst.sport}`,
    kind: 'consistency',
    title: `Consistency: ${l} swings around a lot`,
    summary: `Across your last ${worst.n} ${l} sessions your overall score swings by about ±${worst.sd.toFixed(0)} points. The ceiling is there; the floor is the problem. Repeatability work — same setup, same tempo, fewer "trying hard" swings — usually pays off more here than chasing new mechanics.`,
    capability: 'consistency',
    sports: [worst.sport],
    reasoning: [
      {
        claim: `${l} overall scores have a standard deviation of ${worst.sd.toFixed(1)} across ${worst.n} sessions.`,
        evidence: [`${worst.n} sessions analysed`],
      },
    ],
    basis: 'estimated',
    confidence: clamp01(0.45 + Math.min(0.3, worst.n * 0.05)),
    leverage: 0.5,
    action: `Spend a session repeating the exact same swing at 80% effort and watch the score variance, not the peak.`,
  };
}

function coverageInsight(model: AthleteWorldModel): Insight | null {
  if (model.coverage >= 0.5) return null;
  const missingCaps = model.capabilities.filter((c) => c.score === null).map((c) => c.name);
  const summary =
    model.dataMap.totalSessions === 0
      ? 'There is no analysed motion yet, so this is a blank slate. Run one Motion Lab analysis and the engine immediately has something real to reason about.'
      : `The picture is still thin (${model.dataMap.totalSessions} session${model.dataMap.totalSessions === 1 ? '' : 's'}). ${missingCaps.length ? `Not yet observed: ${missingCaps.join(', ')}. ` : ''}A few more captures — ideally a second sport — sharpen every conclusion here.`;
  return {
    id: 'coverage',
    kind: 'coverage',
    title: 'Sharpen the picture',
    summary,
    capability: null,
    sports: model.sports,
    reasoning: [
      {
        claim: `Data coverage is ${(model.coverage * 100).toFixed(0)}%.`,
        evidence: [
          `${model.dataMap.capabilitiesObserved}/${model.dataMap.capabilitiesTotal} capabilities observed`,
          `${model.dataMap.sportsWithData} sport${model.dataMap.sportsWithData === 1 ? '' : 's'} with data`,
        ],
      },
    ],
    basis: 'measured',
    confidence: 0.9,
    leverage: 0.3,
    action:
      model.dataMap.totalSessions === 0
        ? 'Run your first Motion Lab analysis to seed the model.'
        : 'Add 2–3 more analyses (a second sport helps most) to firm up the read.',
  };
}

// ── Orchestration ─────────────────────────────────────────────

/** Produce the ranked list of insights for an athlete. Never throws. */
export function reason(model: AthleteWorldModel, bundle: SignalBundle): Insight[] {
  const labels = labelMap(bundle);
  const candidates: Array<Insight | null> = [
    keystoneInsight(model, labels),
    imbalanceInsight(model, labels),
    consistencyInsight(model, bundle, labels),
    strengthInsight(model, labels),
    coverageInsight(model),
  ];
  const insights = candidates.filter((x): x is Insight => x !== null);

  // Rank by leverage, then confidence — but a keystone always leads.
  insights.sort((a, b) => {
    if (a.kind === 'keystone' && b.kind !== 'keystone') return -1;
    if (b.kind === 'keystone' && a.kind !== 'keystone') return 1;
    const av = a.leverage * 0.65 + a.confidence * 0.35;
    const bv = b.leverage * 0.65 + b.confidence * 0.35;
    return bv - av;
  });

  return insights;
}
