// GET   /api/admin/intelligence-os/reports         — list/filter action reports
// GET   /api/admin/intelligence-os/reports?id=<id> — single report
// POST  /api/admin/intelligence-os/reports         — create/dedupe a report
// PATCH /api/admin/intelligence-os/reports         — lifecycle / retention / generate-tasks
import { NextResponse } from 'next/server';
import { reportRepo } from '@/lib/intelligence-os/store';
import {
  upsertReport, generateTasksFromReport, setReportLifecycle, setReportRetention,
  type CreateReportInput,
} from '@/lib/intelligence-os/reports';
import {
  REPORT_TYPES, REPORT_LIFECYCLES, type ReportType,
  type ReportLifecycle, type RetentionTier,
} from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIERS = new Set<RetentionTier>(['hot', 'warm', 'cold']);

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const url = new URL(req.url);

  const id = url.searchParams.get('id');
  if (id) {
    const report = await reportRepo.get(id);
    return report ? NextResponse.json({ ok: true, report }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const type = url.searchParams.get('type');
  const tier = url.searchParams.get('tier');
  let items = (await reportRepo.list()).filter((r) => !r.archived);
  if (type) items = items.filter((r) => r.type === type);
  if (tier) items = items.filter((r) => r.retentionTier === tier);
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ ok: true, items, total: items.length });
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  if (!b.title) return NextResponse.json({ error: 'title-required' }, { status: 400 });
  if (!REPORT_TYPES.includes(b.type as never)) return NextResponse.json({ error: 'invalid-type' }, { status: 400 });

  const input: CreateReportInput = {
    title: String(b.title),
    type: b.type as ReportType,
    source: String(b.source ?? 'manual-admin-entry'),
    executiveSummary: b.executiveSummary ? String(b.executiveSummary) : undefined,
    findings: Array.isArray(b.findings) ? (b.findings as CreateReportInput['findings']) : undefined,
    recommendedActions: Array.isArray(b.recommendedActions) ? (b.recommendedActions as string[]) : undefined,
    fullBody: b.fullBody ? String(b.fullBody) : undefined,
  };
  const { report, deduped } = await upsertReport(input);
  return NextResponse.json({ ok: true, report, deduped });
}

export async function PATCH(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  const id = b.id ? String(b.id) : '';
  if (!id) return NextResponse.json({ error: 'id-required' }, { status: 400 });

  if (b.action === 'generate-tasks') {
    const result = await generateTasksFromReport(id);
    return result
      ? NextResponse.json({ ok: true, report: result.report, createdTaskIds: result.createdTaskIds })
      : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  if (b.retentionTier) {
    if (!TIERS.has(b.retentionTier as RetentionTier)) return NextResponse.json({ error: 'invalid-tier' }, { status: 400 });
    const report = await setReportRetention(id, b.retentionTier as RetentionTier);
    return report ? NextResponse.json({ ok: true, report }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  if (b.lifecycleStatus) {
    if (!REPORT_LIFECYCLES.includes(b.lifecycleStatus as never)) return NextResponse.json({ error: 'invalid-lifecycle' }, { status: 400 });
    const report = await setReportLifecycle(id, b.lifecycleStatus as ReportLifecycle);
    return report ? NextResponse.json({ ok: true, report }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  return NextResponse.json({ error: 'no-op' }, { status: 400 });
}
