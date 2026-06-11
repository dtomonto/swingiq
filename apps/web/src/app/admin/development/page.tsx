// ============================================================
// /admin/development — Development Roadmap
// ------------------------------------------------------------
// "Features & Technologies in Development." A polished, HONEST admin
// surface that explains what SwingVantage is building (sections A–H),
// is clear about what exists today vs. what is planned, and documents
// the ethics guarantees + the feature flags that gate it all.
//
// Admin-only by the parent /admin layout guard. Server-rendered.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Telescope, ShieldCheck, Flag, ArrowRight, ListTodo } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import {
  ROADMAP_SECTIONS,
  ROADMAP_STATUS_LABEL,
  ROADMAP_COACH_DISCLAIMER,
  COACHING_INTELLIGENCE_FLAGS,
  roadmapStatusCounts,
  openFollowUpCount,
  sectionsWithOpenFollowUps,
  type RoadmapStatus,
} from '@/lib/admin/development-roadmap';
import { findFlagDef } from '@/lib/admin/flags';

export const metadata: Metadata = {
  title: 'Development Roadmap | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

const STATUS_CHIP: Record<RoadmapStatus, string> = {
  live: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  in_development: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  planned: 'border-gray-600 bg-gray-800 text-gray-300',
};

export default function AdminDevelopmentPage() {
  const counts = roadmapStatusCounts();
  const openFollowUps = openFollowUpCount();
  const pending = sectionsWithOpenFollowUps();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Development Roadmap"
        icon={Telescope}
        description="Features & technologies in development, in plain product language. Every item is honest about what exists today versus what is still planned — so this page can be shared internally without over-promising."
      >
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full border px-2.5 py-1 font-medium ${STATUS_CHIP.live}`}>
            {counts.live} live
          </span>
          <span className={`rounded-full border px-2.5 py-1 font-medium ${STATUS_CHIP.in_development}`}>
            {counts.in_development} in development
          </span>
          <span className={`rounded-full border px-2.5 py-1 font-medium ${STATUS_CHIP.planned}`}>
            {counts.planned} planned
          </span>
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-medium text-sky-300">
            {openFollowUps} open follow-ups
          </span>
        </div>
      </PageHeader>

      {/* Open follow-ups overview — every unfinished initiative's remaining work,
          grouped and jump-linked, so paused projects are never lost. */}
      {pending.length > 0 && (
        <SectionCard
          title="Open follow-ups"
          description="What's left on initiatives that aren't fully shipped yet. Grouped by project — click a heading to jump to its card."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {pending.map((s) => (
              <div key={s.id} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                <a
                  href={`#${s.id}`}
                  className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-100 hover:text-amber-400"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-800 text-[11px] font-bold text-amber-400">
                      {s.letter}
                    </span>
                    {s.title}
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CHIP[s.status]}`}>
                    {ROADMAP_STATUS_LABEL[s.status]}
                  </span>
                </a>
                <ul className="mt-2 space-y-1">
                  {s.followUps!.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                      <ListTodo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400/70" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* The A–H initiative sections */}
      <div className="space-y-4">
        {ROADMAP_SECTIONS.map((s) => (
          <SectionCard key={s.id} className="scroll-mt-20" >
            <div id={s.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-sm font-bold text-amber-400">
                    {s.letter}
                  </span>
                  <div>
                    <h2 className="font-semibold text-gray-100">{s.title}</h2>
                    <p className="mt-0.5 text-xs text-gray-500">{s.tagline}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_CHIP[s.status]}`}>
                  {ROADMAP_STATUS_LABEL[s.status]}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-gray-300">{s.whatItIs}</p>

              <ul className="space-y-1.5">
                {s.capabilities.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-gray-400">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>

              {s.ethics && (
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> Ethics &amp; IP guarantees
                  </p>
                  <ul className="space-y-1 text-xs text-violet-200/80">
                    {s.ethics.map((e) => (
                      <li key={e}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-800/40 p-3">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">Today:</span> {s.todayStatus}
                </p>
                {s.relatedAdminHref && (
                  <Link
                    href={s.relatedAdminHref}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-gray-800"
                  >
                    {s.relatedAdminLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {s.followUps && s.followUps.length > 0 && (
                <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-300">
                    <ListTodo className="h-3.5 w-3.5" /> Open follow-ups ({s.followUps.length})
                  </p>
                  <ul className="space-y-1 text-xs text-sky-200/80">
                    {s.followUps.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400/70" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Coach-inspired disclaimer (verbatim, single source of truth) */}
      <SectionCard title="Coach-inspired disclaimer" description="Shown wherever a coach-inspired profile is configured or exposed.">
        <p className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 text-sm italic leading-relaxed text-gray-400">
          “{ROADMAP_COACH_DISCLAIMER}”
        </p>
      </SectionCard>

      {/* The feature flags that gate this initiative */}
      <SectionCard
        title="Feature flags for this initiative"
        description="These keep everything admin-only until you deliberately turn it on. Manage them in Feature Flags."
        actions={
          <Link
            href="/admin/feature-flags"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-gray-800"
          >
            <Flag className="h-3.5 w-3.5" /> Feature Flags
          </Link>
        }
      >
        <ul className="divide-y divide-gray-800">
          {COACHING_INTELLIGENCE_FLAGS.map((key) => {
            const def = findFlagDef(key);
            return (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <code className="text-xs text-gray-300">{key}</code>
                  {def && <p className="mt-0.5 text-xs text-gray-500">{def.description}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    def?.status === 'wired'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-gray-600 bg-gray-800 text-gray-400'
                  }`}
                >
                  {def ? (def.status === 'wired' ? 'Wired' : 'Registry') : 'Unregistered'}
                </span>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A living map of the SwingVantage
          coaching-intelligence initiative. It is admin-only and safe to share with your team — it
          never claims a planned feature is already live.
        </p>
        <p>
          <strong className="text-gray-300">How to use it.</strong> Each card links to the admin tool
          that already powers it (e.g. <Link href="/admin/coach-mix">Coach Mix</Link>). When you are
          ready to expose a piece to athletes, flip the matching flag in{' '}
          <Link href="/admin/feature-flags">Feature Flags</Link>.
        </p>
        <p>
          <strong className="text-gray-300">Ethics first.</strong> Coach-inspired work is original,
          attributed, and admin-gated. The disclaimer above is the exact language shown wherever a
          coach-inspired profile appears.
        </p>
      </HelpPanel>
    </div>
  );
}
