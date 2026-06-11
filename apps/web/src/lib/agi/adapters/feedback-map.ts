// ============================================================
// SwingVantage — AGI: Drill-feedback mapper (pure)
// ------------------------------------------------------------
// Turns the athlete's own DrillMatch feedback ("did this drill help?") into a
// list of PROVEN drills — the ones they personally marked as helping. Pure and
// resolver-injected so it unit-tests without the drill catalog or browser.
// Honest: this is the user's own verdict, not a claim the drill works for
// everyone.
// ============================================================

import { classifyMetric } from '../capabilities';
import type { ProvenDrill, SportId } from '../types';

export interface RawDrillFeedback {
  drillId: string;
  faultId?: string;
  sport: SportId;
  value: string; // 'helped' | 'no_change' | 'hurt'
}

export function provenDrillsFrom(
  records: RawDrillFeedback[],
  resolveName: (drillId: string) => string | null,
): ProvenDrill[] {
  const byDrill = new Map<string, { faults: Set<string>; sports: Set<SportId>; count: number }>();
  for (const r of records) {
    if (r.value !== 'helped') continue;
    const g = byDrill.get(r.drillId) ?? { faults: new Set<string>(), sports: new Set<SportId>(), count: 0 };
    g.count += 1;
    if (r.faultId) g.faults.add(r.faultId);
    g.sports.add(r.sport);
    byDrill.set(r.drillId, g);
  }

  const out: ProvenDrill[] = [];
  for (const [drillId, g] of byDrill) {
    const drillName = resolveName(drillId) ?? drillId;
    const faultText = Array.from(g.faults).join(' ').replace(/_/g, ' ');
    const capability =
      classifyMetric(drillName, faultText) ?? classifyMetric(faultText, drillName);
    out.push({
      drillId,
      drillName,
      capability,
      sports: Array.from(g.sports),
      helpedCount: g.count,
    });
  }
  return out.sort((a, b) => b.helpedCount - a.helpedCount);
}

/**
 * Per-drill ranking multiplier from the athlete's OWN verdicts — the learning
 * signal the audit flagged as collected-but-unused. A drill they marked "hurt"
 * is strongly down-weighted, "no_change" mildly down-weighted, "helped" slightly
 * boosted. 1.0 = no opinion. Bounded to [0.2, 1.5], pure + deterministic.
 * Honest: this is the user's own experience, not a population claim.
 */
export function drillFeedbackWeights(records: RawDrillFeedback[]): Record<string, number> {
  const counts = new Map<string, { helped: number; no_change: number; hurt: number }>();
  for (const r of records) {
    const c = counts.get(r.drillId) ?? { helped: 0, no_change: 0, hurt: 0 };
    if (r.value === 'helped') c.helped += 1;
    else if (r.value === 'no_change') c.no_change += 1;
    else if (r.value === 'hurt') c.hurt += 1;
    counts.set(r.drillId, c);
  }
  const out: Record<string, number> = {};
  for (const [drillId, c] of counts) {
    const w = 1 + 0.15 * c.helped - 0.3 * c.no_change - 0.6 * c.hurt;
    out[drillId] = Math.max(0.2, Math.min(1.5, Math.round(w * 1000) / 1000));
  }
  return out;
}
