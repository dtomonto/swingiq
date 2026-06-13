// GET /api/admin/intelligence-os/fix-packet?taskId=<id>&format=md|json
// GET /api/admin/intelligence-os/fix-packet?patternId=<id>&format=md|json
// Serves a downloadable Claude Code Fix Packet file (Content-Disposition).
import { NextResponse } from 'next/server';
import {
  generateFixPacketFromTask, generateFixPacketFromPattern, renderFixPacketFile,
} from '@/lib/intelligence-os/service';
import { guard } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const url = new URL(req.url);
  const taskId = url.searchParams.get('taskId');
  const patternId = url.searchParams.get('patternId');
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'markdown';

  const packet = taskId
    ? await generateFixPacketFromTask(taskId)
    : patternId
      ? await generateFixPacketFromPattern(patternId)
      : null;
  if (!packet) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const file = renderFixPacketFile(packet, format);
  return new NextResponse(file.body, {
    status: 200,
    headers: {
      'Content-Type': `${file.contentType}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    },
  });
}
