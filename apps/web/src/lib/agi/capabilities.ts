// ============================================================
// SwingVantage — AGI: Capability registry + metric classifier
// ------------------------------------------------------------
// The single place that defines the sport-neutral capabilities and maps
// raw, sport-specific metric ids onto them. Known motion-lab metric ids are
// mapped explicitly (precise today); anything unrecognised falls back to a
// keyword classifier, so new metrics added by other engines auto-classify
// instead of silently dropping out. This is the seam that keeps the AGI
// layer decoupled from — and resilient to — changes in the metric engines.
// ============================================================

import type { CapabilityDef, CapabilityId } from './types';

export const CAPABILITIES: CapabilityDef[] = [
  {
    id: 'rotation',
    name: 'Rotation & Coil',
    description:
      'How well you turn and store energy — shoulder/hip turn, the gap between them (X-Factor), and rotating around a stable axis rather than sliding.',
    principleId: 'hip_shoulder_separation',
  },
  {
    id: 'sequencing',
    name: 'Kinetic Sequencing',
    description:
      'Whether power is built from the ground up — lower body leads, torso and arms follow in order. The single most transferable athletic skill across striking sports.',
    principleId: 'kinetic_sequencing',
  },
  {
    id: 'balance',
    name: 'Balance & Posture',
    description:
      'A stable, athletic base — centred weight, held spine angle, quiet head — so you rotate around a consistent axis and finish in control.',
    principleId: 'athletic_posture',
  },
  {
    id: 'tempo',
    name: 'Tempo & Timing',
    description:
      'The rhythm of the motion and meeting the ball at the right moment — not rushed, not late.',
    principleId: 'contact_timing',
  },
  {
    id: 'power',
    name: 'Power & Speed',
    description:
      'How much speed you generate and deliver — peak hand/implement speed relative to your frame.',
  },
  {
    id: 'consistency',
    name: 'Consistency & Repeatability',
    description:
      'How repeatable the motion is rep-to-rep and session-to-session. The trait that turns a good swing into a reliable one.',
  },
];

const CAP_BY_ID: Record<CapabilityId, CapabilityDef> = CAPABILITIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CapabilityId, CapabilityDef>,
);

export function getCapability(id: CapabilityId): CapabilityDef {
  return CAP_BY_ID[id];
}

// ── Metric → capability classification ────────────────────────

/** Explicit map of known motion-lab metric ids (precise, current). */
const KNOWN_METRIC_CAPABILITY: Record<string, CapabilityId> = {
  shoulder_turn: 'rotation',
  hip_turn: 'rotation',
  hip_shoulder_sep: 'rotation',
  rotation_quality: 'rotation',
  rom: 'rotation',
  sequencing: 'sequencing',
  head_stability: 'balance',
  pelvis_sway: 'balance',
  spine_change: 'balance',
  knee_flex: 'balance',
  balance_finish: 'balance',
  tempo_ratio: 'tempo',
  hand_speed_peak: 'power',
  repeatability: 'consistency',
};

/**
 * Keyword fallback, ordered. The first capability whose pattern matches the
 * combined id+name+phase wins, so more specific patterns are listed first.
 */
const KEYWORD_RULES: Array<{ cap: CapabilityId; re: RegExp }> = [
  { cap: 'consistency', re: /repeat|consisten|variance|dispersion/ },
  { cap: 'sequencing', re: /sequenc|kinetic|chain/ },
  { cap: 'rotation', re: /rotat|turn|coil|x.?factor|separation|\bsep\b|\brom\b|range of motion/ },
  { cap: 'balance', re: /balance|posture|\bstab|sway|spine|axis|\bknee\b|\bhead\b|flex|slide/ },
  { cap: 'tempo', re: /tempo|rhythm|timing|contact|transition|decel|accel/ },
  { cap: 'power', re: /speed|power|velocit|force|exit|smash|whip/ },
];

/**
 * Map a free-text athlete goal onto the capabilities it most depends on.
 * Honest by design: returns [] when nothing matches rather than guessing, so
 * the engine never invents a goal→capability link that isn't defensible.
 */
const GOAL_RULES: Array<{ caps: CapabilityId[]; re: RegExp }> = [
  { caps: ['power', 'sequencing', 'rotation'], re: /distance|farther|further|longer|\blong\b|power|speed|bomb|carry|exit velo/ },
  { caps: ['rotation', 'sequencing'], re: /slic|over.?the.?top|fade too|pull/ },
  { caps: ['rotation', 'tempo'], re: /hook|draw|snap|wrap/ },
  { caps: ['balance', 'tempo'], re: /contact|strike|\btop\b|thin|fat|chunk|whiff|mishit|center.?face/ },
  { caps: ['tempo', 'sequencing'], re: /tempo|rhythm|rush|smooth|timing|early/ },
  { caps: ['consistency', 'balance', 'tempo'], re: /consisten|accura|straight|control|repeat|fairway|reliab|dispersion|solid/ },
  { caps: ['balance'], re: /balance|fall|off.?balance|fall.?back|stable|posture/ },
];

export function goalToCapabilities(goalText: string): CapabilityId[] {
  if (!goalText) return [];
  const hay = goalText.toLowerCase();
  const out: CapabilityId[] = [];
  for (const rule of GOAL_RULES) {
    if (rule.re.test(hay)) {
      for (const c of rule.caps) if (!out.includes(c)) out.push(c);
    }
  }
  return out;
}

/**
 * Classify a metric to a capability, or null if it isn't capability-bearing
 * (e.g. a pure body-tracking quality metric).
 */
export function classifyMetric(metricId: string, metricName = '', phase = ''): CapabilityId | null {
  const known = KNOWN_METRIC_CAPABILITY[metricId];
  if (known) return known;
  // Body-tracking / quality metrics are not athletic capabilities.
  if (/^tracking$/.test(metricId) || /tracking/i.test(metricName)) return null;
  const hay = `${metricId} ${metricName} ${phase}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(hay)) return rule.cap;
  }
  return null;
}
