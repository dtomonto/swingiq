// ============================================================
// ReliabilityOS — server-side access guard (SERVER-ONLY)
// ------------------------------------------------------------
// Defence-in-depth on top of AdminLayout: the caller must be an authenticated
// admin AND hold `logs.view`. Mirrors lib/security-os/access.server.ts.
// ============================================================

import 'server-only';

import { redirect } from 'next/navigation';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';

export async function requireReliabilityAccess(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!contextCan(ctx, 'logs.view')) redirect('/admin');
  return ctx;
}
