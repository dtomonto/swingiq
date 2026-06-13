import {
  upsertReport, generateTasksFromReport, setReportLifecycle, setReportRetention,
  recommendedRetentionTier, reportFingerprint,
} from '../reports';
import { reportRepo, taskRepo, __resetIntelligenceStoreForTests } from '../store';
import type { ReportFinding } from '../types';

beforeEach(() => { __resetIntelligenceStoreForTests(); });

const findings: ReportFinding[] = [
  { id: 'f1', title: 'Mobile Safari large-file timeout', severity: 'high', detail: '9 timeouts on iOS for >100MB.', recommendation: 'Adopt resumable uploads.' },
  { id: 'f2', title: 'No client-side size validation', severity: 'medium', detail: 'Users wait then fail.', recommendation: 'Validate before upload.' },
];

const base = { title: 'Upload Reliability Report — May', type: 'upload-reliability' as const, source: 'upload-pipeline', findings };

describe('intelligence-os/reports', () => {
  it('creates a report in the hot tier with a severity summary', async () => {
    const { report, deduped } = await upsertReport(base);
    expect(deduped).toBe(false);
    expect(report.retentionTier).toBe('hot');
    expect(report.lifecycleStatus).toBe('generated');
    expect(report.severitySummary).toContain('1 high');
  });

  it('dedupes a same-fingerprint report instead of duplicating', async () => {
    await upsertReport(base);
    const second = await upsertReport({ ...base, executiveSummary: 'refreshed' });
    expect(second.deduped).toBe(true);
    expect((await reportRepo.list()).length).toBe(1);
  });

  it('distinct type/source/title yield distinct fingerprints', () => {
    expect(reportFingerprint({ type: 'upload-reliability', source: 's', title: 'A' }))
      .not.toBe(reportFingerprint({ type: 'ai-quality', source: 's', title: 'A' }));
  });

  it('generates one task per finding, links them back, advances lifecycle', async () => {
    const { report } = await upsertReport(base);
    const result = await generateTasksFromReport(report.id);
    expect(result).not.toBeNull();
    expect(result!.createdTaskIds.length).toBe(2);
    expect(result!.report.lifecycleStatus).toBe('converted-to-tasks');
    expect(result!.report.generatedTaskIds.length).toBe(2);

    const tasks = await taskRepo.list();
    expect(tasks.length).toBe(2);
    expect(tasks[0].relatedReportIds).toContain(report.id);
    expect(tasks[0].category).toBe('upload'); // mapped from report type
  });

  it('re-generating tasks dedupes (no duplicate tasks)', async () => {
    const { report } = await upsertReport(base);
    await generateTasksFromReport(report.id);
    await generateTasksFromReport(report.id);
    expect((await taskRepo.list()).length).toBe(2);
    const updated = await reportRepo.get(report.id);
    expect(updated!.generatedTaskIds.length).toBe(2);
  });

  it('demoting out of hot drops the full body; cold archives', async () => {
    const { report } = await upsertReport({ ...base, fullBody: 'big body text' });
    expect((await reportRepo.get(report.id))!.fullBody).toBe('big body text');

    const warm = await setReportRetention(report.id, 'warm');
    expect(warm!.retentionTier).toBe('warm');
    expect(warm!.fullBody).toBeNull();
    expect(warm!.findings.length).toBe(2); // findings preserved

    const cold = await setReportRetention(report.id, 'cold');
    expect(cold!.archived).toBe(true);
  });

  it('lifecycle change persists', async () => {
    const { report } = await upsertReport(base);
    const reviewed = await setReportLifecycle(report.id, 'reviewed');
    expect(reviewed!.lifecycleStatus).toBe('reviewed');
  });

  it('recommendedRetentionTier ages reports hot → warm → cold', () => {
    const settings = { rawEventRetentionDays: 30, lowValueArchiveDays: 180 };
    const now = Date.now();
    const days = (n: number) => new Date(now - n * 86_400_000).toISOString();
    expect(recommendedRetentionTier({ createdAt: days(5), lifecycleStatus: 'generated' }, settings, now)).toBe('hot');
    expect(recommendedRetentionTier({ createdAt: days(60), lifecycleStatus: 'reviewed' }, settings, now)).toBe('warm');
    expect(recommendedRetentionTier({ createdAt: days(200), lifecycleStatus: 'resolved' }, settings, now)).toBe('cold');
  });
});
