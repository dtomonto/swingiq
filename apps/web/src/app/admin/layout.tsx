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
  if (!(await isAdminAuthorized())) {
    // Redirect rather than show a 403 to avoid confirming the route exists.
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Admin top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-sm">
            ADMIN
          </span>
          <span className="text-sm font-semibold text-gray-200">SwingVantage Internal</span>
        </div>
        <a href="/dashboard" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
          ← Back to app
        </a>
      </div>
      <main>{children}</main>
    </div>
  );
}
