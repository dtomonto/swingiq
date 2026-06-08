// ============================================================
// CentralIntelligenceOS — Coach Mix: Blend Engine
// ------------------------------------------------------------
// Pure, deterministic resolution of a weighted CoachMix into a
// CoachingStrategy — the object that biases SwingVantage's coaching
// (which faults to prioritize, which drill families to favor, how
// technical to sound, what cues to lead with).
//
// Guarantees:
//   - Weights always normalize to 100; any shortfall goes to the
//     original SwingVantage house model (it is never zeroed out).
//   - Output is original, neutral, and explainable — no coach names
//     unless the admin has explicitly opted in for the mix.
// ============================================================

import type {
  CoachMix,
  CoachProfile,
  CoachingStrategy,
  StyleTag,
  SwingModelTrait,
  TechnicalDepth,
} from './types';
import {
  MIN_INFLUENCE_WEIGHT,
  MIX_TOTAL_WEIGHT,
  SWINGVANTAGE_DEFAULT_COACH_ID,
} from './config';

export interface ResolvedWeight {
  profile: CoachProfile;
  weightPct: number;
}

/** Short, user-safe adjective for each trait — used to phrase the "why". */
const TRAIT_ADJECTIVE: Record<SwingModelTrait, string> = {
  pivot_driven: 'pivot-driven',
  face_control_first: 'face-control-first',
  plane_aware: 'plane-aware',
  tempo_driven: 'tempo-driven',
  technical_precision: 'technically precise',
  athletic_rotation: 'athletic and rotational',
  ground_force_emphasis: 'ground-force-focused',
  compact_movement: 'compact',
  structured_checkpointing: 'structured and checkpoint-based',
  connection_focused: 'connection-focused',
  sequencing_focused: 'sequencing-focused',
  balance_and_rhythm: 'balanced and rhythmic',
};

const DEPTH_SCORE: Record<TechnicalDepth, number> = {
  feel_first: 0,
  balanced: 0.5,
  technical: 1,
};

/**
 * Resolve a mix's entries to real profiles + normalized weights.
 * Drops unknown/inactive profiles and sub-threshold weights, then tops up
 * to 100 with the SwingVantage default (or 100% default if the mix is empty).
 */
export function normalizeMixWeights(
  mix: CoachMix,
  profiles: CoachProfile[],
): ResolvedWeight[] {
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const resolved: ResolvedWeight[] = [];
  let explicitDefault = 0;

  for (const entry of mix.entries) {
    const profile = byId.get(entry.coachProfileId);
    if (!profile || profile.status !== 'active') continue;
    if (entry.weightPct < MIN_INFLUENCE_WEIGHT) continue;
    if (profile.id === SWINGVANTAGE_DEFAULT_COACH_ID) {
      explicitDefault += entry.weightPct;
      continue;
    }
    resolved.push({ profile, weightPct: entry.weightPct });
  }

  const explicitTotal =
    resolved.reduce((s, r) => s + r.weightPct, 0) + explicitDefault;

  // Scale down if the admin over-allocated past 100.
  if (explicitTotal > MIX_TOTAL_WEIGHT && explicitTotal > 0) {
    const scale = MIX_TOTAL_WEIGHT / explicitTotal;
    for (const r of resolved) r.weightPct = Math.round(r.weightPct * scale);
    explicitDefault = Math.round(explicitDefault * scale);
  }

  // Whatever is left (incl. an empty mix) becomes the house model's share.
  const allocated =
    resolved.reduce((s, r) => s + r.weightPct, 0) + explicitDefault;
  const remainder = Math.max(0, MIX_TOTAL_WEIGHT - allocated);
  const defaultShare = explicitDefault + remainder;

  const defaultProfile = byId.get(SWINGVANTAGE_DEFAULT_COACH_ID);
  if (defaultProfile && defaultShare > 0) {
    resolved.push({ profile: defaultProfile, weightPct: defaultShare });
  }

  return resolved.sort((a, b) => b.weightPct - a.weightPct);
}

/** Blend the swing-model traits across resolved profiles (sums to ~1). */
function blendTraitWeights(
  resolved: ResolvedWeight[],
): Partial<Record<SwingModelTrait, number>> {
  const out: Partial<Record<SwingModelTrait, number>> = {};
  for (const { profile, weightPct } of resolved) {
    const share = weightPct / MIX_TOTAL_WEIGHT;
    const traits = profile.swingModelTraits;
    if (traits.length === 0) continue;
    const per = share / traits.length;
    for (const t of traits) out[t] = (out[t] ?? 0) + per;
  }
  // Round for stable, readable output.
  for (const k of Object.keys(out) as SwingModelTrait[]) {
    out[k] = Math.round((out[k] ?? 0) * 1000) / 1000;
  }
  return out;
}

/** Weighted fault-priority order (most-emphasized fault first). */
function blendDiagnosticPriority(resolved: ResolvedWeight[]): string[] {
  const weight = new Map<string, number>();
  for (const { profile, weightPct } of resolved) {
    for (const fault of profile.swingModelTarget.addressesFaults) {
      weight.set(fault, (weight.get(fault) ?? 0) + weightPct);
    }
  }
  return [...weight.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([fault]) => fault);
}

/** Drill-category → bias multiplier (1.0 baseline, up to ~2.0 for favored). */
function blendDrillCategoryWeights(
  resolved: ResolvedWeight[],
): Record<string, number> {
  const share = new Map<string, number>();
  for (const { profile, weightPct } of resolved) {
    const s = weightPct / MIX_TOTAL_WEIGHT;
    for (const cat of profile.drillCategories) {
      share.set(cat, (share.get(cat) ?? 0) + s);
    }
  }
  const out: Record<string, number> = {};
  for (const [cat, s] of share) {
    out[cat] = Math.round((1 + Math.min(1, s)) * 100) / 100; // [1, 2]
  }
  return out;
}

/** Weighted vote on how technical the coaching voice should sound. */
function blendExplanationStyle(resolved: ResolvedWeight[]): TechnicalDepth {
  let acc = 0;
  let total = 0;
  for (const { profile, weightPct } of resolved) {
    acc += DEPTH_SCORE[profile.technicalDepth] * weightPct;
    total += weightPct;
  }
  const avg = total > 0 ? acc / total : 0.5;
  if (avg < 0.34) return 'feel_first';
  if (avg < 0.67) return 'balanced';
  return 'technical';
}

/** Lead movement cues, drawn from the highest-weighted profiles. */
function blendMovementCues(resolved: ResolvedWeight[]): string[] {
  const cues: string[] = [];
  for (const { profile } of resolved) {
    for (const cue of [
      ...profile.swingModelTarget.transitionPriorities,
      ...profile.swingModelTarget.downswingPriorities,
    ]) {
      if (!cues.includes(cue)) cues.push(cue);
    }
  }
  return cues.slice(0, 4);
}

/** Unique style tags, ordered by total influence weight. */
function blendInfluenceTags(resolved: ResolvedWeight[]): StyleTag[] {
  const weight = new Map<StyleTag, number>();
  for (const { profile, weightPct } of resolved) {
    for (const tag of profile.styleTags) {
      weight.set(tag, (weight.get(tag) ?? 0) + weightPct);
    }
  }
  return [...weight.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

/** Build the user-safe one-line "why" from the dominant traits. */
function buildInfluenceSummary(
  traitWeights: Partial<Record<SwingModelTrait, number>>,
): string {
  const top = (Object.entries(traitWeights) as [SwingModelTrait, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => TRAIT_ADJECTIVE[t]);
  if (top.length === 0) {
    return 'This recommendation follows the SwingVantage balanced teaching model.';
  }
  const phrase =
    top.length === 1
      ? top[0]
      : `${top.slice(0, -1).join(', ')} and ${top[top.length - 1]}`;
  const article = /^[aeiou]/i.test(phrase) ? 'an' : 'a';
  return `This recommendation is influenced by ${article} ${phrase} teaching model.`;
}

/**
 * Resolve a CoachMix into the CoachingStrategy that biases the product.
 * Deterministic: same inputs → same output.
 */
export function resolveCoachMix(
  mix: CoachMix,
  profiles: CoachProfile[],
): CoachingStrategy {
  const resolved = normalizeMixWeights(mix, profiles);
  const traitWeights = blendTraitWeights(resolved);
  const top = resolved[0]?.profile;

  return {
    mixId: mix.id,
    mixName: mix.name,
    sport: mix.sport,
    traitWeights,
    diagnosticPriority: blendDiagnosticPriority(resolved),
    drillCategoryWeights: blendDrillCategoryWeights(resolved),
    explanationStyle: blendExplanationStyle(resolved),
    movementCues: blendMovementCues(resolved),
    practiceProgression:
      top?.swingModelTarget.practiceDiscipline ??
      'One focused fix at a time, retested under the same conditions.',
    retestProtocol:
      'Re-check the top priority under the same conditions (same camera angle, distance, and equipment) after a focused practice block.',
    influenceTags: blendInfluenceTags(resolved),
    influenceSummary: buildInfluenceSummary(traitWeights),
    coachNamesVisible: mix.userLabelMode === 'full_mix',
  };
}
