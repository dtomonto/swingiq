// ============================================================
// POST /api/admin/library-publish — publish / unpublish a training video on /learn
// ------------------------------------------------------------
// Re-asserts admin + the content.publish permission server-side (never trusts
// the client), then flips the video's public state in its versioned overrides
// file. /learn is statically generated, so the change is a git diff you commit
// & push; it goes live on the next build. Production's runtime FS is read-only,
// so this returns a clear, honest 409 there.
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { setLibraryPublishState } from '@/lib/admin/library-publish-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'content.publish')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { id?: string; action?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const { id, action } = body;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  }

  const result = setLibraryPublishState(id, action === 'publish');
  if (!result.ok) {
    if (result.reason === 'read-only') {
      return NextResponse.json(
        {
          error: 'read-only',
          message:
            'Publishing writes to a versioned data file, which is only possible in your local dev environment. Toggle there, then commit & push — /learn rebuilds on deploy.',
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
    id,
    published: result.published,
    actor: admin.email ?? 'header-admin',
  });
}
