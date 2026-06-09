// ============================================================
// BranchGuardianOS — server-side access guard (SERVER-ONLY)
// ------------------------------------------------------------
// Defence-in-depth on top of AdminLayout. Every BranchGuardianOS page calls
// this so access is enforced server-side (never client-only): the caller must
// be an authenticated admin AND hold `devops.manage`. A denied caller is
// redirected to /admin (we don't confirm the route exists). Mirrors
// lib/security-os/access.server.ts.
// ============================================================

import 'server-only';

import { redirect } from 'next/navigation';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';

/** Resolve the admin context or redirect away when `devops.manage` is absent. */
export async function requireDevOpsAccess(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!contextCan(ctx, 'devops.manage')) {
    redirect('/admin');
  }
  return ctx;
}

/** Non-redirecting variant for API routes (returns ok:false instead). */
export async function checkDevOpsAccess(): Promise<{ ok: boolean; ctx: AdminContext }> {
  const ctx = await requireAdmin();
  return { ok: contextCan(ctx, 'devops.manage'), ctx };
}
