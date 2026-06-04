// ============================================================
// SwingIQ — AGI: Goal-directed general plan
// ------------------------------------------------------------
// Turns the model + insights into ONE prioritised plan whose top focus is the
// capability that improves the most sports at once (the keystone). Drills are
// reused from whatever the source engines already prescribed for that
// capability — the AGI layer schedules and prioritises; it does not reinvent
// the drill library.
// ============================================================

import type { SportId } from '@swingiq/core';
import type {
  AthleteWorldModel,
  Basis,
  CapabilityId,
  CapabilityState,
  GeneralPlan,
  Insight,
  PlanFocus,
  SignalBundle,
} from './types';

const BASIS_RANK: Record<Basis, number> = {
  measured: 4,
  estimated: 3,
  ai_inferred: 2,
  user_entered: 1,
  placeholder: 0,
};
const weakestBasis = (list: Basis[]): Basis =>
  list.length === 0
    ? 'placeholder'
    : list.reduce((lo, b) => (BASIS_RANK[b] < BASIS_RANK[lo] ? b : lo), list[0]);

function drillsForCapability(
  cap: CapabilityId,
  bundle: SignalBundle,
): PlanFocus['drills'] {
  const seen = new Set<string>();
  const out: PlanFocus['drills'] = [];
  for (const s of bundle.sportSessions) {
    for (const h of s.drillHints) {
      if (h.capability !== cap) continue;
      const key = `${s.sport}|${h.fix}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ sport: s.sport, fix: h.fix, drillId: h.drillId });
    }
  }
  return out.slice(0, 4);
}

function focusFor(
  cap: CapabilityState,
  bundle: SignalBundle,
): PlanFocus {
  return {
    capability: cap.capability,
    name: cap.name,
    why:
      cap.breadth >= 2
        ? `Limits ${cap.breadth} of your sports at once (${cap.sports.join(', ')}) — one block of work, broad payoff.`
        : `Your weakest observed capability (${cap.score}/100).`,
    sportsHelped: cap.sports,
    drills: drillsForCapability(cap.capability, bundle),
  };
}

/** Build the prioritised general plan. Never throws. */
export function buildGeneralPlan(
  model: AthleteWorldModel,
  insights: Insight[],
  bundle: SignalBundle,
): GeneralPlan {
  const observed = model.capabilities.filter(
    (c): c is CapabilityState & { score: number } => c.score !== null,
  );

  if (observed.length === 0) {
    return {
      keystone: null,
      supporting: [],
      week: [],
      retestReminder:
        'Once you have an analysed session, this plan fills in automatically and tells you the one thing to train first.',
      confidence: 0.2,
      basis: 'placeholder',
    };
  }

  // Keystone = the keystone insight's capability if present, else weakest with breadth.
  const keystoneInsight = insights.find((i) => i.kind === 'keystone');
  const ranked = [...observed].sort((a, b) => {
    // weaker + broader first
    const aw = (100 - a.score) * (0.7 + 0.15 * Math.min(2, a.breadth));
    const bw = (100 - b.score) * (0.7 + 0.15 * Math.min(2, b.breadth));
    return bw - aw;
  });
  const keystoneCap =
    (keystoneInsight &&
      observed.find((c) => c.capability === keystoneInsight.capability)) ||
    ranked[0];

  const keystone = focusFor(keystoneCap, bundle);
  const supporting = ranked
    .filter((c) => c.capability !== keystoneCap.capability && c.score < 70)
    .slice(0, 2)
    .map((c) => focusFor(c, bundle));

  // A simple, honest weekly structure: keystone 3×, supporting woven in.
  const supportNames = supporting.map((s) => s.name);
  const week: GeneralPlan['week'] = [
    { day: 'Mon', focus: `${keystone.name} — primary block`, minutes: 25 },
    { day: 'Tue', focus: supportNames[0] ? `${supportNames[0]} — light` : 'Easy reps / feel', minutes: 15 },
    { day: 'Wed', focus: `${keystone.name} — primary block`, minutes: 25 },
    { day: 'Thu', focus: 'Rest or easy movement', minutes: 0 },
    { day: 'Fri', focus: supportNames[1] ? `${supportNames[1]} — light` : `${keystone.name} — feel only`, minutes: 15 },
    { day: 'Sat', focus: `${keystone.name} + play / on-field transfer`, minutes: 30 },
    { day: 'Sun', focus: 'Rest', minutes: 0 },
  ];

  const focusCaps = [keystoneCap, ...supporting.map((s) => observed.find((o) => o.capability === s.capability)!)];
  const confidence = Math.max(
    0.3,
    Math.min(0.85, focusCaps.reduce((s, c) => s + c.confidence, 0) / focusCaps.length),
  );

  return {
    keystone,
    supporting,
    week,
    retestReminder: `Re-run Motion Lab on ${keystone.sportsHelped[0] ?? 'your main sport'} in ~2–3 weeks to confirm ${keystone.name} actually moved before changing focus.`,
    confidence: Math.round(confidence * 100) / 100,
    basis: weakestBasis(focusCaps.map((c) => c.basis)),
  };
}
