// ============================================================
// /api/admin/intelligence-os/records — Intelligence OS CRUD (admin-guarded)
// ------------------------------------------------------------
// Create / update / delete any Intelligence OS record kind. Writes go to
// Supabase when configured, else the in-process store (lib/intelligence-os/
// store.ts). Auth mirrors every other admin API: requireAdmin() + RBAC.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { RECORD_REPOS } from '@/lib/intelligence-os/store';
import { RECORD_KINDS } from '@/lib/intelligence-os/types';

const VALID_KINDS = new Set<string>(Object.values(RECORD_KINDS));

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

function badKind(kind: string | undefined) {
  return NextResponse.json({ error: `Unknown record kind "${kind}".` }, { status: 400 });
}

// ── GET: list / search a kind ─────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'analytics.view')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const kind = req.nextUrl.searchParams.get('kind') ?? '';
  const q = (req.nextUrl.searchParams.get('q') ?? '').toLowerCase();
  const id = req.nextUrl.searchParams.get('id');
  if (!VALID_KINDS.has(kind)) return badKind(kind);
  const repo = RECORD_REPOS[kind];

  if (id) {
    const record = await repo.get(id);
    if (!record) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, record });
  }

  let records = await repo.list();
  if (q) {
    records = records.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }
  return NextResponse.json({ ok: true, count: records.length, records });
}

// ── POST: create / upsert ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'logs.view')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await parse(req);
  if (!body?.kind || !body.record) return NextResponse.json({ error: 'Missing kind or record.' }, { status: 400 });
  if (!VALID_KINDS.has(body.kind)) return badKind(body.kind);

  const repo = RECORD_REPOS[body.kind];
  const now = new Date().toISOString();
  const id = String(body.record.id ?? `${body.kind}-${Date.now().toString(36)}`);
  // Admin-created records are honestly labelled 'manual' unless told otherwise.
  const record = {
    dataSource: 'manual',
    ...body.record,
    id,
    createdAt: body.record.createdAt ?? now,
    updatedAt: now,
  } as { id: string };

  const created = await repo.create(record);
  return NextResponse.json({ ok: true, record: created });
}

// ── PATCH: update ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'logs.view')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await parse(req);
  if (!body?.kind || !body.id || !body.patch) return NextResponse.json({ error: 'Missing kind, id, or patch.' }, { status: 400 });
  if (!VALID_KINDS.has(body.kind)) return badKind(body.kind);

  const patch = { ...body.patch, updatedAt: new Date().toISOString() } as unknown as Partial<{ id: string }>;
  const updated = await RECORD_REPOS[body.kind].update(body.id, patch);
  if (!updated) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, record: updated });
}

// ── DELETE ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'logs.view')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await parse(req);
  if (!body?.kind || !body.id) return NextResponse.json({ error: 'Missing kind or id.' }, { status: 400 });
  if (!VALID_KINDS.has(body.kind)) return badKind(body.kind);

  const ok = await RECORD_REPOS[body.kind].remove(body.id);
  return NextResponse.json({ ok });
}
