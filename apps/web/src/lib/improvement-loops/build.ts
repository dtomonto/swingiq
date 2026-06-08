// ============================================================
// SwingVantage — Improvement Loops: pure builder
// ------------------------------------------------------------
// Joins already-captured local signals (drill feedback + retests) into the
// linked issue → drill → outcome record, plus the anonymized effectiveness
// aggregate. Pure and dependency-injectable so it is fully unit-testable; the
// hook layer feeds it the live data.
// ============================================================
import { getDrillCandidateById, type DrillFeedbackRecord, type DrillFeedbackValue } from '@/lib/drillmatch';
import { resolveFault } from '@/lib/faults';
import type { RetestResult, RetestOutcome } from '@/lib/retest';
import type { SkillLevel, SportId } from '@swingiq/core';
import type { ImprovementLoop, LoopDrillAttempt, DrillEffectiveness } from './types';

export interface BuildLoopsInput {
  feedback: DrillFeedbackRecord[];
  retests: RetestResult[];
  skillLevel?: SkillLevel | null;
  /** Injected for testability; defaults to the fault ontology. */
  resolveFaultName?: (faultId: string) => string;
}

const drillName = (drillId: string): string =>
  getDrillCandidateById(drillId)?.name ?? 'A drill you tried';

const defaultFaultName = (id: string): string => resolveFault(id).name;

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Newest retest for this sport whose priorFocus overlaps the fault name, else null. */
function matchRetest(sport: SportId, faultName: string, retests: RetestResult[]): RetestResult | null {
  const fn = norm(faultName);
  if (!fn) return null;
  const matches = retests
    .filter((r) => r.sport === sport)
    .filter((r) => {
      const pf = norm(r.priorFocus);
      return pf.length > 0 && (pf === fn || pf.includes(fn) || fn.includes(pf));
    })
    .sort((a, b) => new Date(b.currentDate).getTime() - new Date(a.currentDate).getTime());
  return matches[0] ?? null;
}

const RETEST_OUTCOME_LABEL: Record<RetestOutcome, string> = {
  improved: 'Improved on retest',
  persisting: 'Still your focus on the retest',
  inconclusive: 'Retest was inconclusive — try again under the same conditions',
  regressed: 'Regressed on retest',
};

function practicingLabel(drills: LoopDrillAttempt[]): string {
  if (drills.some((d) => d.verdict === 'helped')) return 'A drill helped — retest to confirm it stuck';
  if (drills.every((d) => d.verdict === 'no_change')) return 'No change reported yet — keep going or try another drill';
  if (drills.some((d) => d.verdict === 'hurt')) return 'A gentler drill option may fit you better';
  return 'In progress';
}

/**
 * Group local drill feedback into one linked loop per (sport, fault), enriched
 * with a matching retest outcome when one exists. Newest activity first.
 */
export function buildImprovementLoops(input: BuildLoopsInput): ImprovementLoop[] {
  const { feedback, retests, skillLevel = null } = input;
  const resolveName = input.resolveFaultName ?? defaultFaultName;

  // (sport, faultId) → drillId → its feedback records.
  const groups = new Map<
    string,
    { sport: SportId; faultId: string; byDrill: Map<string, DrillFeedbackRecord[]> }
  >();
  for (const r of feedback) {
    const key = `${r.sport}:${r.faultId}`;
    let g = groups.get(key);
    if (!g) {
      g = { sport: r.sport, faultId: r.faultId, byDrill: new Map() };
      groups.set(key, g);
    }
    const list = g.byDrill.get(r.drillId) ?? [];
    list.push(r);
    g.byDrill.set(r.drillId, list);
  }

  const loops: ImprovementLoop[] = [];
  for (const g of groups.values()) {
    const drills: LoopDrillAttempt[] = [];
    let startedAt = '';
    let updatedAt = '';

    for (const [drillId, recs] of g.byDrill) {
      const sorted = [...recs].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      const earliest = sorted[0];
      const latest = sorted[sorted.length - 1];
      drills.push({
        drillId,
        drillName: drillName(drillId),
        verdict: latest.value,
        attempts: recs.length,
        lastRecordedAt: latest.recordedAt,
        notes: latest.notes,
      });
      if (!startedAt || earliest.recordedAt < startedAt) startedAt = earliest.recordedAt;
      if (!updatedAt || latest.recordedAt > updatedAt) updatedAt = latest.recordedAt;
    }
    drills.sort((a, b) => b.lastRecordedAt.localeCompare(a.lastRecordedAt));

    const faultName = resolveName(g.faultId);
    const retestOutcome = matchRetest(g.sport, faultName, retests)?.comparison.outcome ?? null;

    loops.push({
      id: `${g.sport}:${g.faultId}`,
      context: { sport: g.sport, skillLevel },
      faultId: g.faultId,
      faultName,
      stage: retestOutcome ? 'retested' : 'practicing',
      drills,
      retestOutcome,
      outcomeLabel: retestOutcome ? RETEST_OUTCOME_LABEL[retestOutcome] : practicingLabel(drills),
      startedAt,
      updatedAt,
    });
  }

  return loops.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Aggregate raw feedback into the (sport, fault, drill) effectiveness table —
 * the anonymized benchmark seed. Most-tried first, then by help rate.
 */
export function aggregateDrillEffectiveness(
  feedback: DrillFeedbackRecord[],
  resolveFaultName: (faultId: string) => string = defaultFaultName,
): DrillEffectiveness[] {
  const map = new Map<string, DrillEffectiveness>();
  for (const r of feedback) {
    const key = `${r.sport}:${r.faultId}:${r.drillId}`;
    let row = map.get(key);
    if (!row) {
      row = {
        sport: r.sport,
        faultId: r.faultId,
        faultName: resolveFaultName(r.faultId),
        drillId: r.drillId,
        drillName: drillName(r.drillId),
        helped: 0,
        noChange: 0,
        hurt: 0,
        total: 0,
        helpRate: 0,
      };
      map.set(key, row);
    }
    if (r.value === 'helped') row.helped += 1;
    else if (r.value === 'no_change') row.noChange += 1;
    else row.hurt += 1;
    row.total += 1;
  }
  const rows = [...map.values()];
  for (const row of rows) row.helpRate = row.total > 0 ? row.helped / row.total : 0;
  return rows.sort((a, b) => b.total - a.total || b.helpRate - a.helpRate);
}

// ── Per-drill track record (for a single fault) ───────────────

export interface DrillFaultRecord {
  helped: number;
  noChange: number;
  hurt: number;
  total: number;
  /** helped / total, 0–1. */
  helpRate: number;
  /** The athlete's most recent verdict for this drill + fault. */
  latestVerdict: DrillFeedbackValue;
}

/**
 * The athlete's own history with ONE drill for ONE fault — for surfacing a
 * trust signal at the decision point (the Fix Stack). Returns null when there's
 * no history yet, so we never fabricate a track record.
 */
export function drillFaultTrackRecord(
  feedback: DrillFeedbackRecord[],
  sport: SportId,
  faultId: string,
  drillId: string,
): DrillFaultRecord | null {
  const rows = feedback
    .filter((r) => r.sport === sport && r.faultId === faultId && r.drillId === drillId)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  if (rows.length === 0) return null;

  let helped = 0;
  let noChange = 0;
  let hurt = 0;
  for (const r of rows) {
    if (r.value === 'helped') helped += 1;
    else if (r.value === 'no_change') noChange += 1;
    else hurt += 1;
  }
  return {
    helped,
    noChange,
    hurt,
    total: rows.length,
    helpRate: helped / rows.length,
    latestVerdict: rows[rows.length - 1].value,
  };
}
