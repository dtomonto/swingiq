// Admin layout — basic guard.
// In production, replace this with proper Supabase auth role check.
// For now, the admin routes are protected by ADMIN_SECRET header at the API layer.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | SwingIQ',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Admin top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
            ADMIN
          </span>
          <span className="text-sm font-semibold text-gray-200">SwingIQ Internal</span>
        </div>
        <a href="/dashboard" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
          ← Back to app
        </a>
      </div>
      <main>{children}</main>
    </div>
  );
}
