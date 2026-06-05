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
import { classifyMetric } from './capabilities';
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

function weakestObserved(model: AthleteWorldModel): CapabilityState | null {
  const observed = model.capabilities.filter((c) => c.score !== null);
  if (observed.length === 0) return null;
  return observed.reduce((lo, c) => (c.score! < lo.score! ? c : lo), observed[0]);
}

function goalInsight(model: AthleteWorldModel): Insight | null {
  const goal = model.identity?.primaryGoal;
  const goalCaps = model.identity?.goalCapabilities ?? [];
  if (!goal || goalCaps.length === 0) return null;

  const states = model.capabilities.filter((c) => goalCaps.includes(c.capability));
  const observed = states.filter((c) => c.score !== null);
  const goalNames = states.map((c) => c.name);

  // Nothing measured yet that bears on the goal — say so honestly.
  if (observed.length === 0) {
    return {
      id: 'goal-uncaptured',
      kind: 'goal',
      title: 'Your goal, and how to track it',
      summary: `You said your goal is “${goal}”. That depends most on ${goalNames.join(' and ')}, but no analysed session has measured those yet. A Motion Lab capture starts tracking exactly what your goal needs.`,
      capability: goalCaps[0],
      sports: model.sports,
      reasoning: [
        { claim: `Stated goal: "${goal}".`, evidence: ['self-reported profile goal'] },
        { claim: `It maps to ${goalNames.join(', ')}.`, evidence: ['goal → capability mapping'] },
      ],
      basis: 'user_entered',
      confidence: 0.4,
      leverage: 0.5,
      action: `Run a Motion Lab session so the engine can score ${goalNames[0]} and track your goal.`,
    };
  }

  // The goal-relevant capability you are weakest at is the lever.
  const lever = observed.reduce((lo, c) => (c.score! < lo.score! ? c : lo), observed[0]);
  const weakest = weakestObserved(model);
  const isKeystoneAligned = !!weakest && weakest.capability === lever.capability && lever.score! < 68;

  let read: string;
  if (isKeystoneAligned) {
    read = `It leans most on ${lever.name}, which is also your single biggest limiter right now (${lever.score}/100). The fastest path to your goal is the same as your keystone — one focus serves both.`;
  } else if (lever.score! >= 70) {
    read = `It leans most on ${lever.name}, and that is already a strength (${lever.score}/100) — your goal is well-supported. Protect it and spend new effort on your keystone.`;
  } else {
    read = `It leans most on ${lever.name} (${lever.score}/100), which is worth direct work alongside your keystone.`;
  }

  return {
    id: `goal-${lever.capability}`,
    kind: 'goal',
    title: 'Your goal, tied to the data',
    summary: `You said your goal is “${goal}”. ${read}`,
    capability: lever.capability,
    sports: lever.sports.length ? lever.sports : model.sports,
    reasoning: [
      { claim: `Stated goal: "${goal}".`, evidence: ['self-reported profile goal'] },
      {
        claim: `Of the capabilities that goal depends on (${goalNames.join(', ')}), ${lever.name} is your lowest at ${lever.score}/100.`,
        evidence: observed.map((c) => `${c.name}: ${c.score}/100`),
      },
    ],
    basis: lever.basis,
    confidence: clamp01(lever.confidence * 0.9),
    leverage: isKeystoneAligned ? 0.7 : 0.55,
    action: `Make ${lever.name} a named part of practice — it is the capability your stated goal most depends on.`,
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

function recurringFaultInsight(
  model: AthleteWorldModel,
  bundle: SignalBundle,
  labels: Map<SportId, SportLabel>,
): Insight | null {
  // Group non-empty key faults by a normalized label.
  const groups = new Map<string, { label: string; sessions: number; sports: Set<SportId> }>();
  for (const s of bundle.sportSessions) {
    const raw = (s.keyFault || '').trim();
    if (!raw || /^(none|no )/i.test(raw)) continue;
    const norm = raw.toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
    const g = groups.get(norm) ?? { label: raw, sessions: 0, sports: new Set<SportId>() };
    g.sessions += 1;
    g.sports.add(s.sport);
    groups.set(norm, g);
  }

  // Pick the most recurrent fault (needs ≥2); tiebreak by how many sports it spans.
  let best: { label: string; sessions: number; sports: SportId[] } | null = null;
  for (const g of groups.values()) {
    if (g.sessions < 2) continue;
    const sports = Array.from(g.sports);
    if (
      !best ||
      g.sessions > best.sessions ||
      (g.sessions === best.sessions && sports.length > best.sports.length)
    ) {
      best = { label: g.label, sessions: g.sessions, sports };
    }
  }
  if (!best) return null;

  const crossSport = best.sports.length >= 2;
  const cap = classifyMetric(best.label, best.label);
  const sportsText = listSports(best.sports, labels);

  return {
    id: 'recurring',
    kind: 'recurring',
    title: `Recurring issue: ${best.label}`,
    summary: crossSport
      ? `“${best.label}” has shown up in ${best.sessions} of your sessions, across ${sportsText}. The same root appearing in more than one sport means it is a habit, not a one-off — a dedicated block on it pays off more than chasing new issues.`
      : `“${best.label}” has shown up in ${best.sessions} of your ${sportsText} sessions. A fault that keeps returning is a habit worth a dedicated fix, not a one-time patch.`,
    capability: cap,
    sports: best.sports,
    reasoning: [
      {
        claim: `“${best.label}” recurs in ${best.sessions} sessions${crossSport ? ` across ${best.sports.length} sports` : ''}.`,
        evidence: best.sports.map((s) => labels.get(s)?.label ?? s),
      },
    ],
    basis: 'estimated',
    confidence: clamp01(0.5 + Math.min(0.3, best.sessions * 0.08)),
    leverage: clamp01((crossSport ? 0.65 : 0.5) + Math.min(0.2, (best.sessions - 2) * 0.05)),
    action: `Make “${best.label}” the named target of your next few sessions, then re-check whether it stops recurring.`,
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

function readinessInsight(model: AthleteWorldModel): Insight | null {
  const r = model.readiness;
  if (!r) return null;
  const hasCaution = !!r.caution;
  const lowForm = r.band === 'building' || r.band === 'developing';

  let advice: string;
  if (hasCaution) {
    advice =
      'Safety comes before any score — skip hard reps today, keep movement gentle, and rest if anything hurts.';
  } else if (lowForm) {
    advice = 'A lower-energy day: favour feel and technique over intensity — short, quality reps beat grinding.';
  } else {
    advice = 'You are primed — a good day to attack your keystone with a full, focused block.';
  }

  const drivers = r.drivers
    .slice(0, 3)
    .map((d) => `${d.label} (${d.contribution >= 0 ? '+' : ''}${Math.round(d.contribution)})`);

  return {
    id: 'readiness',
    kind: 'readiness',
    title: hasCaution ? 'Today: take care' : `Today's form: ${r.band}`,
    summary: `${r.headline} ${advice}`,
    capability: null,
    sports: model.sports,
    reasoning: [
      { claim: `Readiness ${r.score}/100 (${r.band}).`, evidence: drivers.length ? drivers : ['from your recent activity'] },
      ...(hasCaution ? [{ claim: 'A safety flag overrides the number.', evidence: [r.caution!] }] : []),
    ],
    basis: 'estimated',
    confidence: 0.6,
    leverage: hasCaution ? 0.98 : lowForm ? 0.5 : 0.45,
    action: hasCaution
      ? 'Rest or move gently today; re-check before training hard.'
      : lowForm
        ? 'Keep today light — feel work, about 15 minutes.'
        : 'Use today for a full keystone block.',
  };
}

// ── Orchestration ─────────────────────────────────────────────

/** A readiness safety caution outranks everything else. */
function leadsAll(i: Insight): boolean {
  return i.kind === 'readiness' && i.leverage >= 0.95;
}

/**
 * Produce the ranked list of insights for an athlete. Never throws. `extra`
 * lets the engine inject already-built insights (e.g. progress) into the same
 * ranking pass.
 */
export function reason(
  model: AthleteWorldModel,
  bundle: SignalBundle,
  extra: Insight[] = [],
): Insight[] {
  const labels = labelMap(bundle);
  const candidates: Array<Insight | null> = [
    readinessInsight(model),
    keystoneInsight(model, labels),
    goalInsight(model),
    imbalanceInsight(model, labels),
    recurringFaultInsight(model, bundle, labels),
    consistencyInsight(model, bundle, labels),
    strengthInsight(model, labels),
    coverageInsight(model),
  ];
  const insights = [...candidates.filter((x): x is Insight => x !== null), ...extra];

  // Safety-caution readiness leads; otherwise a keystone leads; then leverage.
  insights.sort((a, b) => {
    const al = leadsAll(a);
    const bl = leadsAll(b);
    if (al !== bl) return al ? -1 : 1;
    if (a.kind === 'keystone' && b.kind !== 'keystone') return -1;
    if (b.kind === 'keystone' && a.kind !== 'keystone') return 1;
    const av = a.leverage * 0.65 + a.confidence * 0.35;
    const bv = b.leverage * 0.65 + b.confidence * 0.35;
    return bv - av;
  });

  return insights;
}
