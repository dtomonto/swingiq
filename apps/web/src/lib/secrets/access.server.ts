// ============================================================
// Keys & Secrets — server-side access guard (SERVER-ONLY)
// ------------------------------------------------------------
// Managing API keys is a security-governance action, so it requires the same
// `security.manage` permission as securityOS. Enforced server-side on every
// secrets API call — never client-only.
// ============================================================

import 'server-only';
import { redirect } from 'next/navigation';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';

export async function requireSecretsAccess(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!contextCan(ctx, 'security.manage')) redirect('/admin');
  return ctx;
}

/** Non-redirecting variant for API routes. */
export async function checkSecretsAccess(): Promise<{ ok: boolean; ctx: AdminContext }> {
  const ctx = await requireAdmin();
  return { ok: contextCan(ctx, 'security.manage'), ctx };
}
