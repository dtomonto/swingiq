// GET   /api/admin/intelligence-os/tasks            — list/filter action tasks
// GET   /api/admin/intelligence-os/tasks?id=<id>    — single task
// POST  /api/admin/intelligence-os/tasks            — create/dedupe a task
// PATCH /api/admin/intelligence-os/tasks            — status change / note / patch
import { NextResponse } from 'next/server';
import { taskRepo } from '@/lib/intelligence-os/store';
import {
  upsertTask, changeTaskStatus, addTaskNote, patchTask, type CreateTaskInput,
} from '@/lib/intelligence-os/tasks';
import {
  TASK_SEVERITIES, TASK_CATEGORIES, TASK_STATUSES, type ActionTask,
} from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NEEDS_ATTENTION = new Set(['new', 'triaged', 'needs-review', 'waiting']);

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const url = new URL(req.url);

  const id = url.searchParams.get('id');
  if (id) {
    const task = await taskRepo.get(id);
    return task ? NextResponse.json({ ok: true, task }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const severity = url.searchParams.get('severity');
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  let items = (await taskRepo.list()).filter((t) => !t.archived);
  if (severity === 'high') items = items.filter((t) => t.severity === 'high' || t.priority === 'p1');
  else if (severity) items = items.filter((t) => t.severity === severity);
  if (status === 'attention') items = items.filter((t) => NEEDS_ATTENTION.has(t.status));
  else if (status) items = items.filter((t) => t.status === status);
  if (category) items = items.filter((t) => t.category === category);

  // Most severe + most recent first.
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  items.sort((a, b) => (rank[a.severity] - rank[b.severity]) || b.lastDetectedAt.localeCompare(a.lastDetectedAt));
  return NextResponse.json({ ok: true, items, total: items.length });
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  if (!b.title) return NextResponse.json({ error: 'title-required' }, { status: 400 });
  if (!TASK_SEVERITIES.includes(b.severity as never)) return NextResponse.json({ error: 'invalid-severity' }, { status: 400 });
  if (!TASK_CATEGORIES.includes(b.category as never)) return NextResponse.json({ error: 'invalid-category' }, { status: 400 });

  const input = {
    title: String(b.title),
    severity: b.severity as CreateTaskInput['severity'],
    category: b.category as CreateTaskInput['category'],
    source: String(b.source ?? 'manual-admin-entry'),
    affectedFeature: b.affectedFeature ? String(b.affectedFeature) : undefined,
    affectedRoute: b.affectedRoute ? String(b.affectedRoute) : undefined,
    affectedComponent: b.affectedComponent ? String(b.affectedComponent) : undefined,
    suggestedNextAction: b.suggestedNextAction ? String(b.suggestedNextAction) : undefined,
    rootCauseHypothesis: b.rootCauseHypothesis ? String(b.rootCauseHypothesis) : undefined,
    evidenceSummary: b.evidenceSummary ? String(b.evidenceSummary) : undefined,
    userImpact: b.userImpact ? String(b.userImpact) : undefined,
    businessImpact: b.businessImpact ? String(b.businessImpact) : undefined,
    relatedReportIds: Array.isArray(b.relatedReportIds) ? (b.relatedReportIds as string[]) : undefined,
    relatedEventIds: Array.isArray(b.relatedEventIds) ? (b.relatedEventIds as string[]) : undefined,
    signature: b.signature ? String(b.signature) : undefined,
  } satisfies CreateTaskInput;

  const { task, deduped } = await upsertTask(input);
  return NextResponse.json({ ok: true, task, deduped });
}

export async function PATCH(req: Request) {
  const { error, admin } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  const id = b.id ? String(b.id) : '';
  if (!id) return NextResponse.json({ error: 'id-required' }, { status: 400 });

  // Status change
  if (b.status) {
    if (!TASK_STATUSES.includes(b.status as never)) return NextResponse.json({ error: 'invalid-status' }, { status: 400 });
    const task = await changeTaskStatus(id, b.status as ActionTask['status']);
    return task ? NextResponse.json({ ok: true, task }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  // Add note
  if (b.note) {
    const task = await addTaskNote(id, admin.email ?? 'admin', String(b.note));
    return task ? NextResponse.json({ ok: true, task }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  // Quick actions
  if (b.action === 'escalate') {
    const task = await patchTask(id, { severity: 'critical', priority: 'p0' }, 'escalated', 'Escalated to critical');
    return task ? NextResponse.json({ ok: true, task }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  if (b.patch && typeof b.patch === 'object') {
    const task = await patchTask(id, b.patch as Partial<ActionTask>, 'edited');
    return task ? NextResponse.json({ ok: true, task }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  return NextResponse.json({ error: 'no-op' }, { status: 400 });
}
