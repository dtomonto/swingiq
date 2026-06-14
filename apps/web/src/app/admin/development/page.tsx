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
  live: 'border-success/30 bg-success/10 text-success-text',
  in_development: 'border-primary/30 bg-primary/10 text-link',
  planned: 'border-border bg-muted text-foreground',
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
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-link">
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
              <div key={s.id} className="rounded-lg border border-border bg-background/40 p-3">
                <a
                  href={`#${s.id}`}
                  className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground hover:text-link"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-2xs font-bold text-link">
                      {s.letter}
                    </span>
                    {s.title}
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-3xs font-medium ${STATUS_CHIP[s.status]}`}>
                    {ROADMAP_STATUS_LABEL[s.status]}
                  </span>
                </a>
                <ul className="mt-2 space-y-1">
                  {s.followUps!.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ListTodo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-link/70" />
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
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-link">
                    {s.letter}
                  </span>
                  <div>
                    <h2 className="font-semibold text-foreground">{s.title}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.tagline}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-2xs font-medium ${STATUS_CHIP[s.status]}`}>
                  {ROADMAP_STATUS_LABEL[s.status]}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-foreground">{s.whatItIs}</p>

              <ul className="space-y-1.5">
                {s.capabilities.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-link/70" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>

              {s.ethics && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-link">
                    <ShieldCheck className="h-3.5 w-3.5" /> Ethics &amp; IP guarantees
                  </p>
                  <ul className="space-y-1 text-xs text-link/80">
                    {s.ethics.map((e) => (
                      <li key={e}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Today:</span> {s.todayStatus}
                </p>
                {s.relatedAdminHref && (
                  <Link
                    href={s.relatedAdminHref}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-link hover:bg-muted"
                  >
                    {s.relatedAdminLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {s.followUps && s.followUps.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-link">
                    <ListTodo className="h-3.5 w-3.5" /> Open follow-ups ({s.followUps.length})
                  </p>
                  <ul className="space-y-1 text-xs text-link/80">
                    {s.followUps.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
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
        <p className="rounded-lg border border-border bg-background/40 p-3 text-sm italic leading-relaxed text-muted-foreground">
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
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-link hover:bg-muted"
          >
            <Flag className="h-3.5 w-3.5" /> Feature Flags
          </Link>
        }
      >
        <ul className="divide-y divide-border">
          {COACHING_INTELLIGENCE_FLAGS.map((key) => {
            const def = findFlagDef(key);
            return (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <code className="text-xs text-foreground">{key}</code>
                  {def && <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-2xs font-medium ${
                    def?.status === 'wired'
                      ? 'border-success/30 bg-success/10 text-success-text'
                      : 'border-border bg-muted text-muted-foreground'
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
          <strong className="text-foreground">What this is.</strong> A living map of the SwingVantage
          coaching-intelligence initiative. It is admin-only and safe to share with your team — it
          never claims a planned feature is already live.
        </p>
        <p>
          <strong className="text-foreground">How to use it.</strong> Each card links to the admin tool
          that already powers it (e.g. <Link href="/admin/coach-mix">Coach Mix</Link>). When you are
          ready to expose a piece to athletes, flip the matching flag in{' '}
          <Link href="/admin/feature-flags">Feature Flags</Link>.
        </p>
        <p>
          <strong className="text-foreground">Ethics first.</strong> Coach-inspired work is original,
          attributed, and admin-gated. The disclaimer above is the exact language shown wherever a
          coach-inspired profile appears.
        </p>
      </HelpPanel>
    </div>
  );
}
