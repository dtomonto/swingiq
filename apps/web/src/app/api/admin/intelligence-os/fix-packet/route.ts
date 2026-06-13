// ============================================================
// /api/admin/intelligence-os/fix-packet — download Claude Code Fix Packets
// ------------------------------------------------------------
// GET ?taskId=…&format=md|json   → Markdown or JSON packet for an Action Task
// GET ?patternId=…&format=md|json → packet derived from a recurring Pattern
// Served with Content-Disposition so the browser downloads a real file.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { tasksRepo, patternsRepo } from '@/lib/intelligence-os/store';
import {
  generateTaskMarkdown, generateTaskJson, patternToTaskLike,
} from '@/lib/intelligence-os/fix-packet';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'analytics.view')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const taskId = searchParams.get('taskId');
  const patternId = searchParams.get('patternId');
  const format = (searchParams.get('format') ?? 'md').toLowerCase();

  let task = taskId ? await tasksRepo.get(taskId) : undefined;
  if (!task && patternId) {
    const pattern = await patternsRepo.get(patternId);
    if (pattern) task = patternToTaskLike(pattern);
  }
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const slug = task.id.replace(/[^a-z0-9-]/gi, '-');
  if (format === 'json') {
    return new NextResponse(generateTaskJson(task), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="fix-packet-${slug}.json"`,
      },
    });
  }
  return new NextResponse(generateTaskMarkdown(task), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="fix-packet-${slug}.md"`,
    },
  });
}
