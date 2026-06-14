// ============================================================
// SwingVantage — SwingLab 2.0: in-app hub (Phase 2, admin-gated)
// ------------------------------------------------------------
// The real future "command center" — an interactive isometric lab map
// inside the authenticated app shell. ADMIN-ONLY while in development so
// regular users don't see it yet (decision locked 2026-06-07). Remove
// the gate to launch it to everyone.
//
// Gating mirrors the /admin pattern (isAdminUser = logged-in email in
// ADMIN_EMAILS). Dev stays open for local iteration; production requires
// an allowlisted admin. Middleware already requires a session to reach
// any (app) route, so this is a second, stricter check on top.
// ============================================================

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FlaskConical, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { isAdminUser } from '@/lib/auth/admin';
import { LabExperience } from '@/components/swinglab/LabExperience';

export const metadata: Metadata = {
  title: 'SwingLab (preview) | SwingVantage',
  robots: { index: false, follow: false },
};

export default async function LabHubPage() {
  // Admin-only while in development. Dev is open for local iteration.
  const allowed = process.env.NODE_ENV !== 'production' || (await isAdminUser());
  if (!allowed) redirect('/dashboard');

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-stage text-stage-foreground">
      {/* Ambient lab atmosphere (decorative) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-stage via-stage to-stage-panel" />
        <div className="absolute left-1/2 top-[-10%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[30%] h-[24rem] w-[24rem] rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">SwingLab</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                <FlaskConical size={12} aria-hidden="true" /> Admin preview · in development
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stage-muted">
              Your future performance command center. Walk the lab, pick a station, and jump straight into the tool —
              the interactive map is live; the immersive first-person experience is still being built.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-stage-foreground transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Dashboard
          </Link>
        </div>

        {/* The interactive map, personalized from the user's real state
            (recommended next station, resume, per-station status). */}
        <div className="mt-7">
          <LabExperience />
        </div>
      </div>
    </div>
  );
}
