// ============================================================
// SwingVantage Milestones — server-side access guard (SERVER-ONLY)
// ------------------------------------------------------------
// Defence-in-depth on top of AdminLayout. The Milestone Center calls this so
// access is enforced server-side: the caller must be an authenticated admin AND
// hold `milestones.manage`. A denied caller is redirected to /admin. Mirrors
// lib/branch-guardian/access.server.ts.
// ============================================================

import 'server-only';

import { redirect } from 'next/navigation';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';

export async function requireMilestonesAccess(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!contextCan(ctx, 'milestones.manage')) {
    redirect('/admin');
  }
  return ctx;
}

export async function checkMilestonesAccess(): Promise<{ ok: boolean; ctx: AdminContext }> {
  const ctx = await requireAdmin();
  return { ok: contextCan(ctx, 'milestones.manage'), ctx };
}
