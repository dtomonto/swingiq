// ============================================================
// POST /api/admin/updates — publish / unpublish an auto-generated update
// ------------------------------------------------------------
// Secure by construction: re-asserts admin + the content.publish permission
// server-side (never trusts the client), then flips the targeted entry's
// status in its versioned data file. The audit entry is recorded client-side
// after a successful response (local-first audit log).
//
// Writes only succeed in a writable environment (local dev). Production's
// runtime FS is read-only, so this returns a clear, honest 409 there.
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { setPublishState, type PublishKind } from '@/lib/admin/updates-store';
import { setContentPublishState } from '@/lib/admin/content-publish-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS: PublishKind[] = ['product', 'dev', 'seo', 'blog'];

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'content.publish')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { kind?: string; id?: string; action?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const { kind, id, action } = body;
  if (!kind || !KINDS.includes(kind as PublishKind)) {
    return NextResponse.json({ error: 'invalid kind' }, { status: 400 });
  }
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  }

  const publish = action === 'publish';
  const result =
    kind === 'product' || kind === 'dev'
      ? setPublishState(kind, id, publish)
      : setContentPublishState(kind, id, publish);
  if (!result.ok) {
    if (result.reason === 'read-only') {
      return NextResponse.json(
        {
          error: 'read-only',
          message:
            'Publishing writes to a versioned data file, which is only possible in your local dev environment. Toggle there, then commit & push.',
        },
        { status: 409 },
      );
    }
    if (result.reason === 'not-found') {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    kind,
    id,
    published: result.published,
    actor: admin.email ?? 'header-admin',
  });
}
