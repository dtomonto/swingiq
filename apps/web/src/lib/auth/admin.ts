// ============================================================
// SwingVantage — admin authorization (SERVER-ONLY)
//
// Makes the admin area usable in production without the awkward
// x-admin-secret header: a logged-in Supabase user counts as an admin
// when their email is in the ADMIN_EMAILS allowlist.
//
// Secure by default: if ADMIN_EMAILS is unset/empty, NO ONE is granted
// via this path (the existing ADMIN_SECRET check still applies and dev
// stays open). Set ADMIN_EMAILS in Vercel/.env.local to enable.
// ============================================================

import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isAdminEmail } from './admin-allowlist';

export { adminEmails, isAdminEmail } from './admin-allowlist';

/** True when the current Supabase session belongs to an allowlisted admin. */
export async function isAdminUser(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return isAdminEmail(user?.email);
}
