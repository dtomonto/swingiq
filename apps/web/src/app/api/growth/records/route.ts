// ============================================================
// /api/growth/records — GrowthOS CRUD (admin-guarded)
// ------------------------------------------------------------
// Create / update / delete GrowthOS records. Writes go to Supabase when
// configured, else the in-process store (see lib/growth/repository.ts).
//
// AUTH: mirrors the /admin guard. When ADMIN_SECRET is set, the request
// must carry a matching `x-admin-secret` header. In development with no
// secret set, writes are allowed for local iteration.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { RECORD_REPOS } from '@/lib/growth/repository';

function isAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return req.headers.get('x-admin-secret') === secret;
}

function unauthorized() {
  return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
}

interface Body {
  kind?: string;
  record?: Record<string, unknown> & { id?: string };
  id?: string;
  patch?: Record<string, unknown>;
}

async function parse(req: NextRequest): Promise<Body | null> {
  try {
    return (await req.json()) as Body;
  } catch {
    return null;
  }
}

// Create
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await parse(req);
  if (!body?.kind || !body.record) return NextResponse.json({ error: 'Missing kind or record.' }, { status: 400 });

  const repo = RECORD_REPOS[body.kind];
  if (!repo) return NextResponse.json({ error: `Unknown kind "${body.kind}".` }, { status: 400 });

  const now = new Date().toISOString();
  const id = String(body.record.id ?? `${body.kind}-${Date.now().toString(36)}`);
  const record = {
    dataSource: 'real',
    ...body.record,
    id,
    createdAt: body.record.createdAt ?? now,
    updatedAt: now,
  } as { id: string };

  const created = await repo.create(record);
  return NextResponse.json({ ok: true, record: created });
}

// Update
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await parse(req);
  if (!body?.kind || !body.id || !body.patch) return NextResponse.json({ error: 'Missing kind, id, or patch.' }, { status: 400 });

  const repo = RECORD_REPOS[body.kind];
  if (!repo) return NextResponse.json({ error: `Unknown kind "${body.kind}".` }, { status: 400 });

  const updated = await repo.update(body.id, body.patch);
  if (!updated) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, record: updated });
}

// Delete
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await parse(req);
  if (!body?.kind || !body.id) return NextResponse.json({ error: 'Missing kind or id.' }, { status: 400 });

  const repo = RECORD_REPOS[body.kind];
  if (!repo) return NextResponse.json({ error: `Unknown kind "${body.kind}".` }, { status: 400 });

  const ok = await repo.remove(body.id);
  if (!ok) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
