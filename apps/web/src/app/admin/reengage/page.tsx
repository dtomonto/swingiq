// ============================================================
// /admin/reengage — Re-engagement OS: outbound preview (owner)
// ------------------------------------------------------------
// Draft-first command center: shows each audience cohort and the exact
// message the engine would deliver. Nothing sends from here — it's the
// blueprint for a bulk send via the existing Resend email setup.
// Admin-guarded by app/admin/layout.tsx.
// ============================================================

import type { Metadata } from 'next';
import { COHORTS, triggerById, buildPayloads } from '@/lib/reengage';
import type { ActivitySignal } from '@/lib/reengage';

export const metadata: Metadata = { title: 'Re-engagement | Admin', robots: 'noindex, nofollow' };

// Representative signal so trigger copy (e.g. streak count) renders fully.
const SAMPLE: ActivitySignal = {
  daysSinceLastActivity: 14, streakDays: 5, streakAtRisk: true, hasPendingFix: true,
  retestDue: true, sessionCount: 3, activated: true, sport: 'golf',
};

export default function AdminReengagePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-100">Re-engagement Outbound</h1>
        <p className="mt-1 text-sm text-gray-400">
          The message the engine delivers to each audience. <span className="text-amber-400">Draft-first —
          nothing sends from this screen.</span> Use these as the copy for a bulk send via Resend.
        </p>
      </header>

      <div className="space-y-4">
        {COHORTS.map((cohort) => {
          const trigger = triggerById(cohort.triggerId);
          if (!trigger) return null;
          const msg = trigger.build(SAMPLE);
          const payloads = buildPayloads(msg, 'https://swingvantage.com');

          return (
            <section key={cohort.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-gray-100">{cohort.label}</h2>
                  <p className="text-xs text-gray-400">{cohort.description}</p>
                </div>
                <div className="flex gap-1.5">
                  {msg.channels.map((c) => (
                    <span key={c} className="rounded-sm border border-gray-700 bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-300">
                      {c.replace('_', '-')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {/* Email draft */}
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</p>
                  <p className="mt-1 text-sm font-medium text-gray-200">Subject: {payloads.email.subject}</p>
                  <p className="mt-2 text-sm font-semibold text-gray-100">{payloads.email.heading}</p>
                  <p className="mt-1 text-sm text-gray-400">{payloads.email.body}</p>
                  <p className="mt-2 text-sm text-emerald-400">
                    {payloads.email.cta.label} → <span className="text-gray-500">{payloads.email.cta.url}</span>
                  </p>
                </div>

                {/* In-app / push draft */}
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">In-app / Push</p>
                  <p className="mt-1 text-sm font-semibold text-gray-100">{payloads.in_app.title}</p>
                  <p className="mt-1 text-sm text-gray-400">{payloads.in_app.body}</p>
                  <p className="mt-2 text-sm text-emerald-400">
                    {payloads.in_app.cta.label} → <span className="text-gray-500">{payloads.push.url}</span>
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
