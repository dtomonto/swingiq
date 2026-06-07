// ============================================================
// POST /api/admin/users/[id] — suspend / restore an account
// ------------------------------------------------------------
// Secure by construction: re-asserts admin + the users.edit
// permission server-side (never trusts the client), then uses the
// service-role client to ban/unban. The audit entry is recorded
// client-side after a successful response (local-first audit log).
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'users.edit')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  const action = body.action;
  if (action !== 'suspend' && action !== 'restore') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  }

  const client = createSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: 'service role not configured' }, { status: 503 });
  }

  // Supabase bans via ban_duration; 'none' lifts the ban.
  const ban_duration = action === 'suspend' ? '876000h' : 'none';
  const { error } = await client.auth.admin.updateUserById(id, { ban_duration });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    action,
    id,
    actor: admin.email ?? 'header-admin',
  });
}
