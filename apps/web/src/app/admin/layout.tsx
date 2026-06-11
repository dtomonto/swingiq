/**
 * Admin layout — server-side guard.
 *
 * Blocks access to all /admin/* routes unless ADMIN_SECRET is set in the
 * environment AND the request carries the matching x-admin-secret header.
 *
 * Long-term: replace with a Supabase role check once auth is wired up.
 * See middleware.ts for the session-based auth stub.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { safeEqual } from '@/lib/security/constant-time';
import { isAdminUser } from '@/lib/auth/admin';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getServerAdminRole } from '@/lib/admin/context';
import { collectServerActions } from '@/lib/admin/action-center';
import { getIntegrationStatuses } from '@/lib/admin/data/system';
import { AdminShell } from '@/components/admin/AdminShell';
import type { SystemStatusEntry } from '@/components/admin/AdminTopbar';

export const metadata: Metadata = {
  title: 'Admin | SwingVantage',
  robots: 'noindex, nofollow',
};

async function isAdminAuthorized(): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;

  // If no ADMIN_SECRET is set in production, block all access.
  // In development without a secret, allow access for local iteration.
  if (!adminSecret) {
    return process.env.NODE_ENV === 'development';
  }

  const requestHeaders = await headers();
  const provided = requestHeaders.get('x-admin-secret');
  return safeEqual(provided, adminSecret);
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authorized via EITHER the x-admin-secret header (legacy/proxy) OR a
  // logged-in user whose email is allowlisted in ADMIN_EMAILS.
  const authorized = (await isAdminAuthorized()) || (await isAdminUser());
  if (!authorized) {
    // Redirect rather than show a 403 to avoid confirming the route exists.
    redirect('/dashboard');
  }

  // Resolve identity + RBAC role for the unified shell. When authorized
  // purely by the secret header there is no user/email — default role
  // (Super Admin) applies, which is correct for that trusted path.
  const user = await getAuthenticatedUser();
  const email = user?.email ?? null;
  const role = getServerAdminRole(email);

  // Action Center count for the persistent topbar badge. Best-effort: never
  // let it break the shell (defaults to 0 if the roll-up is unavailable).
  let actionCount = 0;
  try {
    actionCount = (await collectServerActions()).length;
  } catch {
    actionCount = 0;
  }

  // System-pulse strip below the topbar — a compact, honest read of what's
  // connected. Best-effort: never let it break the shell.
  let systemStatus: SystemStatusEntry[] = [];
  try {
    const integrations = getIntegrationStatuses();
    const connected = integrations.filter((i) => i.connected).length;
    const total = integrations.length;
    const db = integrations.find((i) => i.id === 'supabase');
    const ai = integrations.find((i) => i.id === 'ai-coach');
    const entries: SystemStatusEntry[] = [
      {
        name: 'Services',
        value: `${connected}/${total}`,
        state: connected === total ? 'ok' : connected >= total * 0.6 ? 'warn' : 'crit',
      },
    ];
    if (db) entries.push({ name: 'Database', value: db.connected ? 'live' : 'local', state: db.connected ? 'ok' : 'warn' });
    if (ai) entries.push({ name: 'AI', value: ai.connected ? 'on' : 'off', state: ai.connected ? 'ok' : 'warn' });
    systemStatus = entries;
  } catch {
    systemStatus = [];
  }

  return (
    <AdminShell email={email} role={role} actionCount={actionCount} systemStatus={systemStatus}>
      {children}
    </AdminShell>
  );
}
