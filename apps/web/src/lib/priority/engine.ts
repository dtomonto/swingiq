// ============================================================
// SwingVantage — Athlete Priority Engine (Phase 7)
// ------------------------------------------------------------
// "What should I work on?" synthesized from the WHOLE record, not one
// session. Aggregates every diagnosis across every session (plus club
// gapping + video issues), weighting each by:
//   • severity (critical > high > medium > low)
//   • confidence (sample-size-calibrated, from the diagnostic engine)
//   • recency (a 30-day half-life so a single bad range day can't
//     hijack the priority, but recent trends still win)
//   • frequency (recurring faults accumulate score across sessions)
// Produces a ranked list + top/secondary, what's MISSING (honest data
// gaps), and what CHANGED vs the last snapshot. Pure + deterministic.
// ============================================================

import type {
  AthletePriority, PriorityEvidence, PriorityResult, PrioritySeverity,
  PrioritySnapshot, PriorityTrend,
} from './types';

/** Minimal diagnosis shape (DiagnosisOutput is structurally assignable). */
export interface DiagnosisLike {
  rule: { id: string; name: string; priority: string; likely_cause?: string };
  confidence: number;
  sample_size: number;
}

export interface PrioritySessionInput {
  id: string;
  /** ISO date of the session. */
  date: string;
  diagnoses: DiagnosisLike[];
}

export interface PriorityInput {
  sessions: PrioritySessionInput[];
  /** Recurring video issues (from video analyses). */
  videoIssues?: { issue: string; date: string }[];
  /** Club-gapping verdict (from analyzeClubGaps), if computed. */
  gapping?: { grade: string; summary: string } | null;
  /** Whether any session carried club/face data (for the "missing" hints). */
  hasClubFaceData?: boolean;
  /** Previous snapshot for the "what changed" line. */
  previous?: PrioritySnapshot | null;
  now?: string;
}

const SEVERITY_WEIGHT: Record<string, number> = { critical: 1, high: 0.7, medium: 0.45, low: 0.25 };
const SEVERITY_RANK: Record<PrioritySeverity, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const RECENCY_HALF_LIFE_DAYS = 30;

function severityOf(priority: string): PrioritySeverity {
  return priority === 'critical' || priority === 'high' || priority === 'medium' || priority === 'low'
    ? priority
    : 'medium';
}

function daysBetween(fromISO: string, nowMs: number): number {
  const t = new Date(fromISO).getTime();
  if (Number.isNaN(t)) return 9999;
  return Math.max(0, (nowMs - t) / 86400000);
}

function recencyDecay(days: number): number {
  return Math.pow(0.5, days / RECENCY_HALF_LIFE_DAYS);
}

interface Agg {
  id: string;
  label: string;
  summary: string;
  severity: PrioritySeverity;
  score: number;
  occurrences: number;
  sampleSize: number;
  confSum: number;
  confWeight: number;
  sessionDates: string[]; // newest-first order preserved by iteration
  latestConfidence: number;
  earliestConfidence: number;
}

function trendOf(agg: Agg, sessionsNewestFirst: PrioritySessionInput[]): PriorityTrend {
  const latestSessionId = sessionsNewestFirst[0]?.id;
  const inLatest = latestSessionId
    ? sessionsNewestFirst[0]!.diagnoses.some((d) => d.rule.id === agg.id)
    : false;
  if (agg.occurrences === 1) return inLatest ? 'new' : 'improving';
  if (!inLatest) return 'improving'; // present before, absent from the latest session
  // Present across multiple incl. latest — rising confidence reads as worsening.
  if (agg.latestConfidence - agg.earliestConfidence >= 10) return 'worsening';
  return 'persisting';
}

function planHref(): string {
  return '/training';
}

/**
 * Compute the athlete's ranked priorities across their whole record.
 */
export function computeAthletePriorities(input: PriorityInput): PriorityResult {
  const nowMs = input.now ? new Date(input.now).getTime() : Date.now();
  const generatedAt = new Date(nowMs).toISOString();

  // Newest-first so trend logic + "latest session" checks are simple.
  const sessions = [...input.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const aggs = new Map<string, Agg>();
  for (const session of sessions) {
    const days = daysBetween(session.date, nowMs);
    const decay = recencyDecay(days);
    for (const d of session.diagnoses) {
      const sev = severityOf(d.rule.priority);
      const weight = SEVERITY_WEIGHT[sev]! * (d.confidence / 100) * decay;
      let a = aggs.get(d.rule.id);
      if (!a) {
        a = {
          id: d.rule.id, label: d.rule.name, summary: d.rule.likely_cause ?? '',
          severity: sev, score: 0, occurrences: 0, sampleSize: 0, confSum: 0, confWeight: 0,
          sessionDates: [], latestConfidence: d.confidence, earliestConfidence: d.confidence,
        };
        aggs.set(d.rule.id, a);
      }
      a.score += weight;
      a.occurrences += 1;
      a.sampleSize += d.sample_size;
      a.confSum += d.confidence * decay;
      a.confWeight += decay;
      a.sessionDates.push(session.date);
      // sessions iterate newest-first → first seen is the latest occurrence.
      if (a.occurrences === 1) a.latestConfidence = d.confidence;
      a.earliestConfidence = d.confidence; // last write = oldest
      if (SEVERITY_RANK[sev] > SEVERITY_RANK[a.severity]) a.severity = sev;
    }
  }

  const priorities: AthletePriority[] = [];
  for (const a of aggs.values()) {
    const confidence = a.confWeight > 0 ? Math.round(a.confSum / a.confWeight) : 0;
    const trend = trendOf(a, sessions);
    const evidence: PriorityEvidence[] = [
      { label: 'Seen in', detail: `${a.occurrences} of ${sessions.length} session${sessions.length === 1 ? '' : 's'}` },
      { label: 'Confidence', detail: `${confidence}%` },
      { label: 'Based on', detail: `${a.sampleSize} shot${a.sampleSize === 1 ? '' : 's'}` },
    ];
    priorities.push({
      id: a.id, label: a.label, summary: a.summary, severity: a.severity,
      confidence, score: a.score, occurrences: a.occurrences, sampleSize: a.sampleSize,
      trend, source: 'launch_monitor', recommendedPlanHref: planHref(), evidence,
    });
  }

  // Synthetic: club gapping (from analyzeClubGaps grade).
  if (input.gapping && /^[CDF]/.test(input.gapping.grade)) {
    const sev: PrioritySeverity = input.gapping.grade.startsWith('F') || input.gapping.grade.startsWith('D') ? 'high' : 'medium';
    priorities.push({
      id: 'club_gapping', label: 'Club gapping issue', summary: input.gapping.summary,
      severity: sev, confidence: 70, score: SEVERITY_WEIGHT[sev]! * 0.7 * 1.0,
      occurrences: 1, sampleSize: 0, trend: 'persisting', source: 'gapping',
      recommendedPlanHref: '/bag',
      evidence: [{ label: 'Bag gap grade', detail: input.gapping.grade }, { label: 'Fix in', detail: 'My Golf Bag' }],
    });
  }

  // Synthetic: recurring video issues not already covered by a diagnosis.
  const videoCounts = new Map<string, { count: number; latest: string }>();
  for (const v of input.videoIssues ?? []) {
    const key = v.issue.trim().toLowerCase();
    if (!key) continue;
    const cur = videoCounts.get(key) ?? { count: 0, latest: v.date };
    cur.count += 1;
    if (new Date(v.date).getTime() > new Date(cur.latest).getTime()) cur.latest = v.date;
    videoCounts.set(key, cur);
  }
  for (const [issue, info] of videoCounts) {
    const decay = recencyDecay(daysBetween(info.latest, nowMs));
    priorities.push({
      id: `video_${issue.replace(/\s+/g, '_')}`,
      label: issue.replace(/\b\w/g, (c) => c.toUpperCase()),
      summary: 'Flagged in your video analysis.',
      severity: 'medium', confidence: 60, score: SEVERITY_WEIGHT.medium! * 0.6 * decay,
      occurrences: info.count, sampleSize: 0, trend: info.count > 1 ? 'persisting' : 'new',
      source: 'video', recommendedPlanHref: planHref(),
      evidence: [{ label: 'Seen in', detail: `${info.count} video${info.count === 1 ? '' : 's'}` }],
    });
  }

  priorities.sort((a, b) => b.score - a.score || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const top = priorities[0] ?? null;
  const secondary = priorities.find((p) => p.id !== top?.id) ?? null;

  // What's missing — honest data gaps.
  const whatsMissing: string[] = [];
  const totalShots = priorities.reduce((s, p) => Math.max(s, p.sampleSize), 0);
  if (!input.hasClubFaceData) whatsMissing.push('Import a launch-monitor session with club + face data for path/face diagnosis.');
  if (sessions.length > 0 && daysBetween(sessions[0]!.date, nowMs) > 30) {
    whatsMissing.push('Your most recent session is over a month old — log a fresh one to keep this accurate.');
  }
  if (totalShots > 0 && totalShots < 12) whatsMissing.push('Add more shots per club for higher-confidence priorities.');
  if ((input.videoIssues ?? []).length === 0) whatsMissing.push('Upload a swing video to confirm the cause visually.');

  // What changed vs the previous snapshot.
  let whatChanged: string | null = null;
  if (top) {
    if (!input.previous || !input.previous.topId) {
      whatChanged = `Your top priority: ${top.label}.`;
    } else if (input.previous.topId !== top.id) {
      whatChanged = `Your #1 priority changed from "${input.previous.topLabel ?? 'your previous focus'}" to "${top.label}".`;
    } else {
      whatChanged = `Still your #1 priority: ${top.label}.`;
    }
  }

  return {
    generatedAt, top, secondary, all: priorities, whatsMissing, whatChanged,
    insufficientData: priorities.length === 0,
  };
}

/** Build a snapshot from a result (for persistence + future "what changed"). */
export function snapshotFromResult(result: PriorityResult): PrioritySnapshot {
  return {
    date: result.generatedAt,
    topId: result.top?.id ?? null,
    topLabel: result.top?.label ?? null,
    secondaryId: result.secondary?.id ?? null,
  };
}
