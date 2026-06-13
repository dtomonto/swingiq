import {
  upsertReport, generateTasksFromReport, setReportLifecycle, setReportRetention,
  recommendedRetentionTier, reportFingerprint, sweepReportRetention,
} from '../reports';
import { reportRepo, taskRepo, saveSettings, __resetIntelligenceStoreForTests } from '../store';
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

  it('sweepReportRetention demotes aged reports and drops bodies (only demotes, idempotent)', async () => {
    await saveSettings({ rawEventRetentionDays: 30, lowValueArchiveDays: 180 }, 'test');
    const now = Date.now();
    const old = new Date(now - 60 * 86_400_000).toISOString();   // 60d → warm
    const ancient = new Date(now - 200 * 86_400_000).toISOString(); // 200d → cold
    const fresh = new Date(now - 1 * 86_400_000).toISOString();   // 1d → hot

    // Seed three reports directly with controlled createdAt + a full body.
    for (const [id, createdAt] of [['r-old', old], ['r-anc', ancient], ['r-new', fresh]] as const) {
      await reportRepo.create({
        id, title: `t-${id}`, type: 'system-health', source: 's', lifecycleStatus: 'generated',
        severitySummary: '', prioritySummary: '', executiveSummary: '', findings: [],
        generatedTaskIds: [], evidenceReferences: [], recommendedActions: [], internalLearningTags: [],
        searchMetadata: '', retentionTier: 'hot', duplicateGroupId: null, fingerprint: id,
        fullBody: 'body', dataSource: 'real', createdAt, updatedAt: createdAt, archived: false,
      });
    }

    const res = await sweepReportRetention(now);
    expect(res.demotedToWarm).toBe(1);
    expect(res.demotedToCold).toBe(1);
    expect(res.bodiesDropped).toBe(2);
    expect((await reportRepo.get('r-old'))!.retentionTier).toBe('warm');
    expect((await reportRepo.get('r-old'))!.fullBody).toBeNull();
    expect((await reportRepo.get('r-anc'))!.retentionTier).toBe('cold');
    expect((await reportRepo.get('r-new'))!.retentionTier).toBe('hot');

    // Idempotent: a second sweep changes nothing.
    const second = await sweepReportRetention(now);
    expect(second.demotedToWarm).toBe(0);
    expect(second.demotedToCold).toBe(0);
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
