// ============================================================
// SwingVantage — BodySync: insight + correlation generation
//
// Deterministic, honest pattern-finding over the user's own check-in history
// (and, when available, swing-performance points joined by date). We prefer
// simple group comparisons over fragile correlations on tiny samples, and we
// only surface a pattern when the signal is consistent. Every insight carries
// a confidence level and never makes a medical claim.
// ============================================================

import type { ManualCheckin, HealthInsight, Confidence, BodyRegion } from './types';
import { BODY_REGIONS } from './constants';

/** A swing-performance point the correlation engine can join to a check-in by date. */
export interface PerformancePoint {
  date: string; // YYYY-MM-DD
  swingScore?: number | null; // 0–100 overall
  swingSpeed?: number | null; // mph/kph — provider-agnostic
  consistency?: number | null; // 0–100
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const id = () => `bsi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

function conf(n: number): Confidence {
  if (n >= 12) return 'high';
  if (n >= 6) return 'moderate';
  return 'low';
}

function regionLabel(rg: BodyRegion): string {
  return BODY_REGIONS.find((r) => r.id === rg)?.label.toLowerCase() ?? 'that area';
}

export function generateInsights(
  checkins: ManualCheckin[],
  performance: PerformancePoint[] = [],
): HealthInsight[] {
  const out: HealthInsight[] = [];
  const now = new Date().toISOString();
  // newest-first
  const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length < 3) return out;

  const push = (h: Omit<HealthInsight, 'id' | 'createdAt'>) =>
    out.push({ ...h, id: id(), createdAt: now });

  // 1) Sleep → energy (group comparison)
  const withSleepEnergy = sorted.filter((c) => c.sleepHours != null && c.energy != null);
  if (withSleepEnergy.length >= 6) {
    const good = withSleepEnergy.filter((c) => (c.sleepHours as number) >= 7).map((c) => c.energy as number);
    const poor = withSleepEnergy.filter((c) => (c.sleepHours as number) < 7).map((c) => c.energy as number);
    if (good.length >= 3 && poor.length >= 3 && mean(good) - mean(poor) >= 0.7) {
      push({
        kind: 'correlation', category: 'recovery', confidence: conf(withSleepEnergy.length),
        title: 'Sleep is fueling your energy',
        body: `Your energy runs noticeably higher after 7+ hours of sleep (${mean(good).toFixed(1)} vs ${mean(poor).toFixed(1)} on short nights). Protecting sleep looks like one of your biggest levers.`,
      });
    }
  }

  // 2) Sleep → swing performance (joined by date)
  if (performance.length) {
    const byDate = new Map(performance.map((p) => [p.date, p]));
    const paired = sorted
      .map((c) => ({ c, p: byDate.get(c.date) }))
      .filter((x): x is { c: ManualCheckin; p: PerformancePoint } =>
        !!x.p && x.c.sleepHours != null && (x.p.swingScore != null || x.p.swingSpeed != null));
    if (paired.length >= 5) {
      const metric = (p: PerformancePoint) => (p.swingScore ?? p.swingSpeed) as number;
      const good = paired.filter((x) => (x.c.sleepHours as number) >= 7).map((x) => metric(x.p));
      const poor = paired.filter((x) => (x.c.sleepHours as number) < 7).map((x) => metric(x.p));
      if (good.length >= 2 && poor.length >= 2 && mean(good) - mean(poor) > 0) {
        const pct = Math.round(((mean(good) - mean(poor)) / Math.max(1, mean(poor))) * 100);
        if (pct >= 3) {
          push({
            kind: 'correlation', category: 'performance', confidence: conf(paired.length),
            title: 'Your best swing days follow good sleep',
            body: `Swing performance on well-slept days is about ${pct}% higher than on short-sleep days. A fatigue-related dip is worth ruling out before changing technique.`,
          });
        }
      }
    }
  }

  // 3) Rising soreness (recovery deficit watch)
  const sore = sorted.filter((c) => c.soreness != null).map((c) => c.soreness as number);
  if (sore.length >= 6) {
    const recent = mean(sore.slice(0, 3));
    const prior = mean(sore.slice(3, 6));
    if (recent - prior >= 1) {
      push({
        kind: 'risk', category: 'recovery', confidence: conf(sore.length),
        title: 'Soreness is trending up',
        body: 'Your soreness has climbed over the last few days. Consider a recovery or mobility-focused day before your next hard session.',
      });
    }
  }

  // 4) Burnout watch: many hard days + falling energy
  const last7 = sorted.slice(0, 7);
  const hardDays = last7.filter((c) => (c.practiceIntensity ?? 0) >= 4).length;
  const energyTrend = last7.filter((c) => c.energy != null).map((c) => c.energy as number);
  if (hardDays >= 4 && energyTrend.length >= 4 && mean(energyTrend.slice(0, 2)) < mean(energyTrend.slice(-2))) {
    push({
      kind: 'pattern', category: 'activity', confidence: conf(last7.length),
      title: 'High load, dropping energy',
      body: `You've logged ${hardDays} hard days this week while energy is sliding. Shorter, more frequent sessions — or a planned down day — may protect your progress.`,
    });
  }

  // 5) Recurring discomfort by region
  const last5 = sorted.slice(0, 5);
  const regionCounts = new Map<BodyRegion, number>();
  for (const c of last5) for (const rg of c.painAreas ?? []) regionCounts.set(rg, (regionCounts.get(rg) ?? 0) + 1);
  for (const [rg, n] of regionCounts) {
    if (n >= 2) {
      push({
        kind: 'risk', category: 'wellness', confidence: 'low',
        title: `Recurring ${regionLabel(rg)} discomfort`,
        body: `You've noted ${regionLabel(rg)} discomfort on ${n} of your last ${last5.length} check-ins. SwingVantage will ease drills that load it. If it persists, consider a qualified health professional.`,
      });
    }
  }

  // 6) Positive momentum (opportunity)
  const goodStreak = sorted.slice(0, 2).every((c) => (c.soreness ?? 3) <= 2 && (c.energy ?? 3) >= 4);
  if (goodStreak) {
    push({
      kind: 'opportunity', category: 'performance', confidence: 'low',
      title: 'You\'re trending up',
      body: 'Two straight low-soreness, high-energy days — a good window to chase a speed or performance session while the body is fresh.',
    });
  }

  return out.slice(0, 6);
}
