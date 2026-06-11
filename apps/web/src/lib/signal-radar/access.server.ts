// ============================================================
// SignalRadar OS — server-side access guard (SERVER-ONLY)
// ------------------------------------------------------------
// Defence-in-depth on top of AdminLayout: every SignalRadar page + any
// future API route calls this so access is enforced server-side. The
// caller must be an authenticated admin AND hold `signals.manage`. A
// denied caller is redirected to /admin (we don't confirm the route).
// ============================================================

import 'server-only';

import { redirect } from 'next/navigation';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';

export async function requireSignalRadarAccess(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!contextCan(ctx, 'signals.manage')) {
    redirect('/admin');
  }
  return ctx;
}

/** Non-redirecting variant for API routes (returns ok:false instead). */
export async function checkSignalRadarAccess(): Promise<{ ok: boolean; ctx: AdminContext }> {
  const ctx = await requireAdmin();
  return { ok: contextCan(ctx, 'signals.manage'), ctx };
}
