// ============================================================
// PublishingOS executor — access guard (SERVER-ONLY)
// ------------------------------------------------------------
// The executor writes to the GitHub repo (opens PRs), so it requires the
// privileged `devops.manage` permission — enforced server-side on the trigger
// API, never client-only.
// ============================================================

import 'server-only';
import { redirect } from 'next/navigation';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';

export async function requireExecutorAccess(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!contextCan(ctx, 'devops.manage')) redirect('/admin');
  return ctx;
}

/** Non-redirecting variant for API routes. */
export async function checkExecutorAccess(): Promise<{ ok: boolean; ctx: AdminContext }> {
  const ctx = await requireAdmin();
  return { ok: contextCan(ctx, 'devops.manage'), ctx };
}
