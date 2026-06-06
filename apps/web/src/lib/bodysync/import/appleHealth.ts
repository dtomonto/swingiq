// ============================================================
// SwingVantage — BodySync: Apple Health export importer
//
// Apple Health / HealthKit has NO web API — the supported web path is the
// user's own data export. This parses the `export.xml` from an Apple Health
// export and rolls it up into normalized daily summaries (one number per
// metric per day). We keep ONLY those summaries — never the raw records.
//
// Pure + streaming-friendly: we scan record tags with a regex (no full DOM
// of a multi-hundred-MB file), filter to the handful of metrics we use, and
// aggregate per day.
// ============================================================

import type { HealthMetricSample, HealthDailySummary, MetricType, HealthCategory, Confidence } from '../types';

type Agg = 'median' | 'sum';

interface MetricDef {
  metricType: MetricType;
  category: HealthCategory;
  unit: string;
  agg: Agg;
}

// HKQuantityTypeIdentifier… → our normalized metric.
const QUANTITY_MAP: Record<string, MetricDef> = {
  HKQuantityTypeIdentifierRestingHeartRate: { metricType: 'resting_hr', category: 'cardio', unit: 'bpm', agg: 'median' },
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: { metricType: 'hrv', category: 'recovery', unit: 'ms', agg: 'median' },
  HKQuantityTypeIdentifierVO2Max: { metricType: 'vo2max', category: 'cardio', unit: 'ml/kg/min', agg: 'median' },
  HKQuantityTypeIdentifierOxygenSaturation: { metricType: 'spo2', category: 'recovery', unit: '%', agg: 'median' },
  HKQuantityTypeIdentifierRespiratoryRate: { metricType: 'respiratory_rate', category: 'recovery', unit: 'br/min', agg: 'median' },
  HKQuantityTypeIdentifierStepCount: { metricType: 'steps', category: 'activity', unit: 'count', agg: 'sum' },
  HKQuantityTypeIdentifierActiveEnergyBurned: { metricType: 'active_calories', category: 'activity', unit: 'kcal', agg: 'sum' },
  HKQuantityTypeIdentifierAppleExerciseTime: { metricType: 'exercise_minutes', category: 'activity', unit: 'min', agg: 'sum' },
};

const SLEEP_TYPE = 'HKCategoryTypeIdentifierSleepAnalysis';

export interface AppleHealthImportResult {
  samples: HealthMetricSample[];
  summaries: HealthDailySummary[];
  stats: {
    recordsScanned: number;
    days: number;
    byMetric: Partial<Record<MetricType, number>>;
  };
}

const dayOf = (appleDate: string): string => appleDate.slice(0, 10); // "YYYY-MM-DD …" → "YYYY-MM-DD"

/** Apple dates look like "2026-06-05 23:00:00 -0700" → ISO "2026-06-05T23:00:00-0700". */
function appleMs(s: string): number {
  return Date.parse(s.replace(' ', 'T').replace(' ', ''));
}

function hoursBetween(start: string, end: string): number {
  const a = appleMs(start);
  const b = appleMs(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return (b - a) / 3_600_000;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) out[m[1]] = m[2];
  return out;
}

/**
 * Parse an Apple Health `export.xml` string into normalized daily summaries.
 * @param sinceDays only keep days within this many days of the newest record.
 */
export function parseAppleHealthExport(xml: string, sinceDays = 120): AppleHealthImportResult {
  // metricType → day → list of values (or summed sleep hours)
  const buckets = new Map<MetricType, Map<string, number[]>>();
  const sleepByNight = new Map<string, number>();
  let recordsScanned = 0;

  const recordRe = /<Record\b[^>]*?>/g;
  let rm: RegExpExecArray | null;
  while ((rm = recordRe.exec(xml))) {
    const tag = rm[0];
    // Cheap pre-filter: skip tags that aren't a metric we care about.
    if (!tag.includes('TypeIdentifier')) continue;
    const a = attrs(tag);
    const type = a.type;
    if (!type) continue;

    if (type === SLEEP_TYPE) {
      const v = a.value ?? '';
      if (/Asleep/i.test(v) && !/InBed|Awake/i.test(v)) {
        const night = dayOf(a.endDate ?? a.startDate ?? '');
        if (night) {
          recordsScanned++;
          sleepByNight.set(night, (sleepByNight.get(night) ?? 0) + hoursBetween(a.startDate, a.endDate));
        }
      }
      continue;
    }

    const def = QUANTITY_MAP[type];
    if (!def) continue;
    const value = Number(a.value);
    const day = dayOf(a.endDate ?? a.startDate ?? '');
    if (!day || !Number.isFinite(value)) continue;
    recordsScanned++;
    let byDay = buckets.get(def.metricType);
    if (!byDay) { byDay = new Map(); buckets.set(def.metricType, byDay); }
    const list = byDay.get(day) ?? [];
    list.push(value);
    byDay.set(day, list);
  }

  // ── Roll up to one value per metric per day ──
  const summaries: HealthDailySummary[] = [];
  const byMetric: Partial<Record<MetricType, number>> = {};

  for (const [metricType, byDay] of buckets) {
    const def = Object.values(QUANTITY_MAP).find((d) => d.metricType === metricType)!;
    for (const [date, values] of byDay) {
      const value = def.agg === 'sum'
        ? values.reduce((x, y) => x + y, 0)
        : median(values);
      summaries.push({
        date, category: def.category, metricType,
        value: Math.round(value * 100) / 100, unit: def.unit, confidence: 'high', provider: 'apple_health',
      });
      byMetric[metricType] = (byMetric[metricType] ?? 0) + 1;
    }
  }
  for (const [date, hours] of sleepByNight) {
    summaries.push({
      date, category: 'recovery', metricType: 'sleep_duration',
      value: Math.round(hours * 100) / 100, unit: 'h', confidence: 'high', provider: 'apple_health',
    });
    byMetric.sleep_duration = (byMetric.sleep_duration ?? 0) + 1;
  }

  // ── Window to the most recent `sinceDays` ──
  const allDays = summaries.map((s) => s.date).sort();
  const newest = allDays[allDays.length - 1];
  let kept = summaries;
  if (newest) {
    const cutoff = new Date(Date.parse(newest) - sinceDays * 86_400_000).toISOString().slice(0, 10);
    kept = summaries.filter((s) => s.date >= cutoff);
  }
  kept.sort((a, b) => a.date.localeCompare(b.date));

  const samples: HealthMetricSample[] = kept.map((s) => ({
    provider: 'apple_health',
    category: s.category,
    metricType: s.metricType,
    value: s.value,
    unit: s.unit,
    confidence: s.confidence as Confidence,
    windowStart: `${s.date}T00:00:00Z`,
    windowEnd: `${s.date}T23:59:59Z`,
    timestamp: `${s.date}T12:00:00Z`,
  }));

  const days = new Set(kept.map((s) => s.date)).size;
  return { samples, summaries: kept, stats: { recordsScanned, days, byMetric } };
}
