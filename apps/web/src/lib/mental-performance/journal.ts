// ============================================================
// SwingVantage — Mental Performance: journal insights (pure)
//
// Turns a user's own logs into honest, plain-English patterns. No medical
// inference — just counts, averages, and simple trends over their data.
// ============================================================

import type {
  MentalLog, MentalJournalInsights, EmotionalState, MistakeCategory, TrendPoint,
} from './types';
import { emotionMeta, mistakeMeta } from './constants';

function topCounts<T extends string>(
  values: Array<T | null | undefined>,
): Array<{ key: T; count: number }> {
  const map = new Map<T, number>();
  for (const v of values) {
    if (v == null) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function avg(nums: number[]): number | null {
  const valid = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (!valid.length) return null;
  return valid.reduce((s, n) => s + n, 0) / valid.length;
}

function trendOf(logs: MentalLog[], field: 'composure' | 'confidence'): TrendPoint[] {
  return logs
    .filter((l) => typeof l[field] === 'number')
    .map((l) => ({ date: l.date, value: l[field] as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Group recovery speed by a context label (sport + mistake). */
function recoveryByContext(logs: MentalLog[]): Array<{ context: string; avg: number; n: number }> {
  const groups = new Map<string, number[]>();
  for (const l of logs) {
    if (typeof l.recoverySpeed !== 'number') continue;
    const mLabel = mistakeMeta(l.mistake ?? undefined)?.label ?? 'general';
    const label = `${l.sport} · ${mLabel}`;
    const arr = groups.get(label) ?? [];
    arr.push(l.recoverySpeed);
    groups.set(label, arr);
  }
  return [...groups.entries()]
    .map(([context, arr]) => ({ context, avg: arr.reduce((s, n) => s + n, 0) / arr.length, n: arr.length }))
    .filter((g) => g.n >= 1);
}

export function generateJournalInsights(logs: MentalLog[]): MentalJournalInsights {
  const total = logs.length;

  const topTriggers = topCounts<EmotionalState>(logs.map((l) => l.emotion))
    .slice(0, 5)
    .map((t) => ({ emotion: t.key, count: t.count }));

  const topMistakes = topCounts<MistakeCategory>(logs.map((l) => l.mistake))
    .slice(0, 5)
    .map((t) => ({ mistake: t.key, count: t.count }));

  const recovery = recoveryByContext(logs).sort((a, b) => b.avg - a.avg);
  const fastestRecovery = recovery.slice(0, 3).map((r) => ({ context: r.context, avg: Math.round(r.avg * 10) / 10 }));
  const slowestRecovery = [...recovery].reverse().slice(0, 3).map((r) => ({ context: r.context, avg: Math.round(r.avg * 10) / 10 }));

  const composureTrend = trendOf(logs, 'composure');
  const confidenceTrend = trendOf(logs, 'confidence');

  // Pressure readiness: blend composure, confidence, recovery speed (all 1–5)
  // into a 0–100 rollup. Null when there's too little data to be honest.
  const composureAvg = avg(logs.map((l) => l.composure).filter((n): n is number => n != null));
  const confidenceAvg = avg(logs.map((l) => l.confidence).filter((n): n is number => n != null));
  const recoveryAvg = avg(logs.map((l) => l.recoverySpeed).filter((n): n is number => n != null));
  const components = [composureAvg, confidenceAvg, recoveryAvg].filter((n): n is number => n != null);
  const pressureReadiness =
    total >= 3 && components.length
      ? Math.round((components.reduce((s, n) => s + n, 0) / components.length / 5) * 100)
      : null;

  let headline: string;
  if (total === 0) {
    headline = 'Log a few moments and patterns will start to show here.';
  } else if (topTriggers[0]) {
    const emo = emotionMeta(topTriggers[0].emotion)?.label.toLowerCase() ?? topTriggers[0].emotion;
    headline = `Your most common trigger so far is feeling ${emo}. Recovery is your edge — keep building it.`;
  } else {
    headline = `You've logged ${total} moment${total === 1 ? '' : 's'}. Keep going to surface your patterns.`;
  }

  return {
    total,
    topTriggers,
    topMistakes,
    fastestRecovery,
    slowestRecovery,
    composureTrend,
    confidenceTrend,
    pressureReadiness,
    headline,
  };
}
