// ============================================================
// SwingVantage — GAI Heuristic Engine (Instant Estimate builder)
// ------------------------------------------------------------
// Deterministic, data-driven analysis with NO external AI call. It does not
// invent a parallel rule store — it composes the existing, curated knowledge:
//
//   • lib/faults/ontology  → diagnosis, reasoning, root causes, retest criteria,
//                            audience-aware explanations, confidence basis
//   • lib/drills/catalog   → the matching drills from the real drill library
//
// Output conforms to the normalized AnalysisResult so the report UI renders it
// identically to an AI route. This is the floor every route can safely fall back
// to, and the engine behind the free Instant Estimate tier.
// ============================================================

import type { SportId } from '@swingiq/core';
import { resolveFault, matchFaultId } from '@/lib/faults/ontology';
import type { FaultAudience, FaultOntologyEntry } from '@/lib/faults/types';
import { getAllDrills } from '@/lib/drills/catalog';
import type { DrillEntry } from '@/lib/drills/catalog';
import type {
  AnalysisRequest,
  AnalysisResult,
  AnalysisRoute,
  ConfidenceLabel,
  DrillRecommendation,
} from './types';

const ENGINE_VERSION = '1.0.0';

/** Map skill level to the audience whose explanation reads best for them. */
function audienceFor(skill?: AnalysisRequest['skillLevel']): FaultAudience {
  if (skill === 'advanced' || skill === 'elite') return 'advanced';
  return 'coach';
}

function confidenceLabel(c: number): ConfidenceLabel {
  if (c >= 0.75) return 'high';
  if (c >= 0.55) return 'moderate';
  return 'low';
}

// ── Drill matching against the real library ─────────────────

const STOP = new Set(['the', 'and', 'too', 'for', 'of', 'to', 'in', 'on', 'is', 'at', 'or', 'your', 'a', 'an', 'with']);

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

/** Pick the 2–3 most relevant drills for a fault from the real drill library. */
function pickDrills(sport: SportId, fault: FaultOntologyEntry): DrillRecommendation[] {
  const pool = getAllDrills().filter((d) => d.sport === sport);
  const needle = tokens([fault.name, ...fault.drillFamilies].join(' '));

  const scored = pool
    .map((d: DrillEntry) => {
      const hay = tokens([d.name, d.targetFault ?? '', d.category ?? '', d.goal].join(' '));
      return { d, score: overlap(needle, hay) };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 3);
  const chosen = (top.length >= 2 ? top : scored.slice(0, 3)).map((s) => s.d);

  if (chosen.length > 0) {
    return chosen.map((d) => ({ name: d.name, goal: d.goal, slug: d.slug }));
  }
  // No drill library entries for this sport → fall back to the fault's families.
  return fault.drillFamilies.slice(0, 3).map((fam) => ({
    name: `${fam} work`,
    goal: `Build the ${fam} pattern that addresses ${fault.name.toLowerCase()}.`,
  }));
}

// ── Plan + fix synthesis ────────────────────────────────────

function primaryFixFor(fault: FaultOntologyEntry): string {
  const family = fault.drillFamilies[0];
  return family
    ? `Prioritize ${family} to address ${fault.name.toLowerCase()} before reworking anything else.`
    : `Address ${fault.name.toLowerCase()} as the single highest-leverage fix.`;
}

function sevenDayPlan(fault: FaultOntologyEntry, drills: DrillRecommendation[]): string[] {
  const d0 = drills[0]?.name ?? 'the primary drill';
  const d1 = drills[1]?.name ?? d0;
  const d2 = drills[2]?.name ?? d1;
  return [
    `Day 1: Awareness — feel where ${fault.name.toLowerCase()} shows up in slow reps.`,
    `Day 2: ${d0} — short blocked sets, quality over quantity.`,
    `Day 3: ${d1} — add a little speed once the feel holds.`,
    `Day 4: Combine ${d0} and ${d1} in alternating reps.`,
    `Day 5: ${d2} — transfer the feel toward a normal motion.`,
    'Day 6: Pressure test — mix in game-like reps and track results.',
    'Day 7: Retest — compare against your starting point.',
  ];
}

// ── Confidence ──────────────────────────────────────────────

function scoreConfidence(req: AnalysisRequest, fault: FaultOntologyEntry, matched: boolean): number {
  // Curated, confidently-matched faults start higher than synthesized ones.
  let c = fault.generated ? 0.5 : 0.72;
  if (matched) c += 0.04;
  // More selected symptoms = a sharper picture.
  const sym = req.symptoms?.length ?? 0;
  c += Math.min(sym, 3) * 0.03;
  // We're slightly less sure for elite athletes from symptoms alone.
  if (req.skillLevel === 'elite') c -= 0.05;
  return Math.max(0.4, Math.min(0.9, Number(c.toFixed(2))));
}

// ── Public entry ────────────────────────────────────────────

/**
 * Build a normalized Instant-Estimate result for a request. Pure + synchronous
 * (no I/O), so it's the dependable floor for every fallback and fully testable.
 * `route` lets the caller record HOW this estimate was reached (e.g.
 * FALLBACK_HEURISTIC) without changing the content.
 */
export function runHeuristicEstimate(
  req: AnalysisRequest,
  route: AnalysisRoute = 'HEURISTIC_ONLY',
): AnalysisResult {
  // Resolve the issue to a curated fault when possible, else an honest entry.
  const matchedId = matchFaultId(req.issue, req.sport);
  const faultId = matchedId ?? req.issue;
  const fault = resolveFault(faultId, { label: req.issue, sport: req.sport });

  const audience = audienceFor(req.skillLevel);
  const drills = pickDrills(req.sport, fault);
  const confidence = scoreConfidence(req, fault, Boolean(matchedId));
  const equipment = getAllDrills().find((d) => d.slug === drills[0]?.slug)?.equipment;

  return {
    tier: req.tier,
    route,
    sourceMode: 'heuristic',
    sport: req.sport,
    issue: req.issue,
    diagnosis: `${fault.name} — ${fault.description}`,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    reasoning: fault.explanations[audience],
    primaryFix: primaryFixFor(fault),
    drills,
    practicePlan: { days: sevenDayPlan(fault, drills) },
    retest: {
      protocol: `${fault.retest.whatToReassess} Keep it fair: ${fault.retest.sameConditions.join('; ')}.`,
      activeWindowDays: fault.retest.activeWindowDays,
      improvedWhen: fault.retest.improvedWhen,
    },
    setupNote: equipment && equipment.toLowerCase() !== 'none' ? `You'll want: ${equipment}.` : undefined,
    generated: fault.generated,
    disclaimer:
      'This is an Instant Estimate based on your selected sport, miss pattern, skill level, and goals — not a full video breakdown. Upload a swing video for Deep AI Analysis to confirm the root cause.',
    poweredBy: 'SwingVantage GAI',
    ruleVersion: ENGINE_VERSION,
    costEstimateCents: 0,
  };
}
