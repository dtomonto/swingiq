// ============================================================
// Player Experience Overhaul — deterministic player archetype (WS-04)
// ------------------------------------------------------------
// Derives a player "archetype" (e.g. Power Developer) PURELY from already-
// computed engine outputs (journey category scores + AGI capabilities +
// momentum). No AI, fully deterministic, and honest: returns null when
// there isn't enough signal to claim anything.
// ============================================================

import type { CategoryScore, ClassificationCategory } from '@/lib/athletic-journey/types';
import type { CapabilityState, CapabilityId } from '@/lib/agi/types';
import type { ArchetypeInputs, PlayerArchetype, IntelligenceBasis } from './types';

interface ArchetypeDef {
  id: string;
  label: string;
  description: string;
}

const ARCHETYPES: Record<string, ArchetypeDef> = {
  power_developer: {
    id: 'power_developer',
    label: 'Power Developer',
    description: 'Generates strong speed and athleticism; turning that power into repeatable contact is the next unlock.',
  },
  consistency_seeker: {
    id: 'consistency_seeker',
    label: 'Consistency Seeker',
    description: 'The tools are there — tightening dispersion and repeatability is the highest-leverage focus.',
  },
  technician: {
    id: 'technician',
    label: 'Technician',
    description: 'Clean, well-organized mechanics. Strength is technical quality and sequencing.',
  },
  strategist: {
    id: 'strategist',
    label: 'Strategist',
    description: 'Plays smart — course/match management and composure are standout strengths.',
  },
  athletic_mover: {
    id: 'athletic_mover',
    label: 'Athletic Mover',
    description: 'Movement and footwork are a clear advantage; channel that base into the skill itself.',
  },
  all_rounder: {
    id: 'all_rounder',
    label: 'All-Rounder',
    description: 'Balanced across the board with no single dominating strength or gap.',
  },
};

const num = (v: number | null | undefined): number | undefined =>
  v === null || v === undefined || Number.isNaN(v) ? undefined : v;

const avgDefined = (...vals: Array<number | undefined>): number | undefined => {
  const present = vals.filter((v): v is number => v !== undefined);
  if (present.length === 0) return undefined;
  return present.reduce((a, b) => a + b, 0) / present.length;
};

/**
 * Derive a player archetype. Returns null when fewer than the minimum
 * number of scored dimensions are available (honest "not enough data yet").
 */
export function derivePlayerArchetype(inputs: ArchetypeInputs): PlayerArchetype | null {
  const cats = inputs.categoryScores ?? [];
  const caps = inputs.capabilities ?? [];

  const catScore = (c: ClassificationCategory): number | undefined =>
    num(cats.find((x) => x.category === c)?.score ?? undefined);
  const capScore = (c: CapabilityId): number | undefined =>
    num(caps.find((x) => x.capability === c)?.score ?? undefined);

  // Composite dimensions, blending journey categories + AGI capabilities.
  const dims: Record<string, number | undefined> = {
    power: avgDefined(capScore('power'), catScore('movement')),
    consistency: avgDefined(catScore('consistency'), capScore('consistency')),
    technique: avgDefined(catScore('technique'), capScore('sequencing'), capScore('balance'), capScore('rotation')),
    strategy: avgDefined(catScore('tactical'), catScore('mental')),
    movement: avgDefined(catScore('movement'), capScore('balance')),
  };

  const defined = Object.entries(dims).filter(([, v]) => v !== undefined) as [string, number][];
  if (defined.length < 1) return null;

  const sorted = [...defined].sort((a, b) => b[1] - a[1]);
  const [topKey, topVal] = sorted[0];
  const [botKey, botVal] = sorted[sorted.length - 1];
  const spread = topVal - botVal;

  // Confidence: data breadth × average confidence of contributing readings.
  const contributingConf = [
    ...cats.map((c) => (c.score !== null ? c.confidence : undefined)),
    ...caps.map((c) => (c.score !== null ? c.confidence : undefined)),
  ].filter((v): v is number => v !== undefined && !Number.isNaN(v));
  const avgConf = contributingConf.length
    ? contributingConf.reduce((a, b) => a + b, 0) / contributingConf.length
    : 0.4;
  const breadth = Math.min(1, defined.length / 5);
  const confidence = Math.max(0.2, Math.min(1, breadth * (0.55 + 0.45 * avgConf)));

  // Most conservative basis among contributing readings.
  const basis = pickBasis(cats, caps);

  // Decision tree (deterministic; spread threshold avoids over-claiming a
  // dominant trait on essentially-flat data → All-Rounder).
  const SPREAD = 12;
  let def: ArchetypeDef;
  const evidence: string[] = [];

  if (spread < SPREAD) {
    def = ARCHETYPES.all_rounder;
    evidence.push('No single dimension stands out — scores are within a narrow band.');
  } else if (dims.consistency !== undefined && botKey === 'consistency') {
    def = ARCHETYPES.consistency_seeker;
    evidence.push(`Consistency is the lowest scored area (${Math.round(botVal)}/100).`);
    evidence.push(`Relative strength: ${labelFor(topKey)} (${Math.round(topVal)}/100).`);
  } else if (topKey === 'power') {
    def = ARCHETYPES.power_developer;
    evidence.push(`Power/athleticism leads at ${Math.round(topVal)}/100.`);
    if (dims.consistency !== undefined) evidence.push(`Consistency at ${Math.round(dims.consistency)}/100 is the area to convert it.`);
  } else if (topKey === 'technique') {
    def = ARCHETYPES.technician;
    evidence.push(`Technical quality leads at ${Math.round(topVal)}/100.`);
  } else if (topKey === 'strategy') {
    def = ARCHETYPES.strategist;
    evidence.push(`Tactical/mental game leads at ${Math.round(topVal)}/100.`);
  } else if (topKey === 'movement') {
    def = ARCHETYPES.athletic_mover;
    evidence.push(`Movement/footwork leads at ${Math.round(topVal)}/100.`);
  } else {
    def = ARCHETYPES.all_rounder;
    evidence.push(`Balanced profile led by ${labelFor(topKey)}.`);
  }

  return {
    id: def.id,
    label: def.label,
    description: def.description,
    evidence,
    confidence,
    basis,
  };
}

function labelFor(key: string): string {
  switch (key) {
    case 'power': return 'power/athleticism';
    case 'consistency': return 'consistency';
    case 'technique': return 'technical quality';
    case 'strategy': return 'tactical/mental game';
    case 'movement': return 'movement/footwork';
    default: return key;
  }
}

function pickBasis(cats: CategoryScore[], caps: CapabilityState[]): IntelligenceBasis {
  const order: IntelligenceBasis[] = ['measured', 'analyzed', 'self_reported', 'estimated'];
  const present = new Set<string>();
  for (const c of cats) if (c.score !== null && c.basis) present.add(c.basis);
  for (const c of caps) if (c.score !== null && c.basis) present.add(c.basis);
  // Most conservative (lowest-trust) basis actually present.
  for (let i = order.length - 1; i >= 0; i--) {
    if (present.has(order[i])) return order[i];
  }
  return 'estimated';
}
