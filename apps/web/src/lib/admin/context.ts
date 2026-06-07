// ============================================================
// SwingVantage Admin — server-side admin context & guard (SERVER-ONLY)
// ------------------------------------------------------------
// The canonical "who is this admin and what may they do" helper,
// reused by API route handlers and server actions. Mirrors the
// authorization in app/admin/layout.tsx (ADMIN_SECRET header OR
// allowlisted Supabase email) and layers RBAC on top.
//
// NEVER import this from a client component — it reads secrets and
// request headers.
// ============================================================

import { headers } from 'next/headers';
import { safeEqual } from '@/lib/security/constant-time';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/auth/admin-allowlist';
import {
  parseAdminRolesEnv,
  resolveRoleForEmail,
  roleHasPermission,
  type Permission,
  type RoleId,
} from './rbac';

/** Header/secret leg of the guard (matches admin/layout.tsx). */
async function isSecretHeaderAuthorized(): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;
  // No secret set: open in dev for local iteration, closed in prod.
  if (!adminSecret) return process.env.NODE_ENV === 'development';
  const requestHeaders = await headers();
  return safeEqual(requestHeaders.get('x-admin-secret'), adminSecret);
}

/** Resolve the effective admin role for an email from ADMIN_ROLES env. */
export function getServerAdminRole(email: string | null | undefined): RoleId {
  const assignments = parseAdminRolesEnv(process.env.ADMIN_ROLES);
  return resolveRoleForEmail(email, assignments, 'super_admin');
}

export interface AdminContext {
  ok: boolean;
  /** Allowlisted email, or null when authorized purely by secret header. */
  email: string | null;
  role: RoleId;
}

/**
 * Authorize the current request as an admin and resolve their role.
 * Returns `{ ok: false }` when the caller is not an admin at all.
 * Use this at the top of every admin API route / server action.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const [headerOk, user] = await Promise.all([
    isSecretHeaderAuthorized(),
    getAuthenticatedUser(),
  ]);
  const email = user?.email ?? null;
  const emailOk = isAdminEmail(email);

  if (!headerOk && !emailOk) {
    return { ok: false, email: null, role: 'read_only' };
  }
  return { ok: true, email, role: getServerAdminRole(email) };
}

/** True when the resolved admin context may perform `permission`. */
export function contextCan(ctx: AdminContext, permission: Permission): boolean {
  return ctx.ok && roleHasPermission(ctx.role, permission);
}
