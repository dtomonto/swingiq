// ============================================================
// securityOS — server-side access guard (SERVER-ONLY)
// ------------------------------------------------------------
// Defence-in-depth on top of AdminLayout. Every securityOS page + the scan
// API calls this so access is enforced server-side (never client-only):
// the caller must be an authenticated admin AND hold `security.manage`.
// A denied caller is redirected to /admin (we don't confirm the route).
// ============================================================

import 'server-only';

import { redirect } from 'next/navigation';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';

/** Resolve the admin context or redirect away when `security.manage` is absent. */
export async function requireSecurityAccess(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!contextCan(ctx, 'security.manage')) {
    redirect('/admin');
  }
  return ctx;
}

/** Non-redirecting variant for API routes (returns ok:false instead). */
export async function checkSecurityAccess(): Promise<{ ok: boolean; ctx: AdminContext }> {
  const ctx = await requireAdmin();
  return { ok: contextCan(ctx, 'security.manage'), ctx };
}
