// GET /api/admin/intelligence-os/export?format=json|markdown — export knowledge
import { NextResponse } from 'next/server';
import { exportKnowledge } from '@/lib/intelligence-os/service';
import { guard } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await guard('data.export');
  if (error) return error;
  const format = new URL(req.url).searchParams.get('format') === 'json' ? 'json' : 'markdown';
  const { body, contentType, filename } = await exportKnowledge(format);
  return new NextResponse(body, {
    headers: { 'content-type': contentType, 'content-disposition': `attachment; filename="${filename}"` },
  });
}
