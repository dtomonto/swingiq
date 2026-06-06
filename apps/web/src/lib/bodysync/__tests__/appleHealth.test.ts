// BodySync — Apple Health export parser tests
import { parseAppleHealthExport } from '../import/appleHealth';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierRestingHeartRate" unit="count/min" startDate="2026-06-05 07:00:00 -0700" endDate="2026-06-05 07:00:00 -0700" value="58"/>
 <Record type="HKQuantityTypeIdentifierRestingHeartRate" unit="count/min" startDate="2026-06-05 21:00:00 -0700" endDate="2026-06-05 21:00:00 -0700" value="60"/>
 <Record type="HKQuantityTypeIdentifierStepCount" unit="count" startDate="2026-06-05 09:00:00 -0700" endDate="2026-06-05 09:30:00 -0700" value="1000"/>
 <Record type="HKQuantityTypeIdentifierStepCount" unit="count" startDate="2026-06-05 17:00:00 -0700" endDate="2026-06-05 17:30:00 -0700" value="500"/>
 <Record type="HKQuantityTypeIdentifierHeartRateVariabilitySDNN" unit="ms" startDate="2026-06-05 07:00:00 -0700" endDate="2026-06-05 07:00:00 -0700" value="45"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" startDate="2026-06-05 23:00:00 -0700" endDate="2026-06-06 03:00:00 -0700" value="HKCategoryValueSleepAnalysisAsleepCore"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" startDate="2026-06-06 03:00:00 -0700" endDate="2026-06-06 06:00:00 -0700" value="HKCategoryValueSleepAnalysisAsleepREM"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" startDate="2026-06-05 22:30:00 -0700" endDate="2026-06-05 23:00:00 -0700" value="HKCategoryValueSleepAnalysisInBed"/>
 <Record type="HKQuantityTypeIdentifierHeartRate" unit="count/min" startDate="2026-06-05 12:00:00 -0700" endDate="2026-06-05 12:00:00 -0700" value="120"/>
</HealthData>`;

describe('parseAppleHealthExport', () => {
  const res = parseAppleHealthExport(XML);
  const find = (mt: string, date: string) =>
    res.summaries.find((s) => s.metricType === mt && s.date === date);

  it('medians multiple resting-HR readings per day', () => {
    expect(find('resting_hr', '2026-06-05')?.value).toBe(59); // median(58,60)
  });

  it('sums step counts per day', () => {
    expect(find('steps', '2026-06-05')?.value).toBe(1500);
  });

  it('captures HRV', () => {
    expect(find('hrv', '2026-06-05')?.value).toBe(45);
  });

  it('sums asleep intervals into nightly sleep hours (ignoring InBed)', () => {
    expect(find('sleep_duration', '2026-06-06')?.value).toBeCloseTo(7, 1);
  });

  it('ignores metrics we do not model (raw heart_rate)', () => {
    expect(res.summaries.some((s) => s.metricType === 'heart_rate')).toBe(false);
  });

  it('marks everything high-confidence + apple_health provider', () => {
    expect(res.summaries.every((s) => s.confidence === 'high' && s.provider === 'apple_health')).toBe(true);
  });

  it('returns empty for non-Apple input', () => {
    expect(parseAppleHealthExport('<nope/>').summaries).toEqual([]);
  });
});
