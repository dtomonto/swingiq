// ============================================================
// /design-lab — DEV-ONLY preview lab (noindex, 404 in production)
// ------------------------------------------------------------
// Auth-gated app surfaces (dashboard, diagnose, …) can't be screenshot-verified
// without a Supabase session. This lab renders the REAL components those pages
// use, with representative props, on a public-in-dev route — so the design can
// be reviewed without logging in. It is reachable only in development: the page
// notFound()s in production and the route is noindex, so nothing ships publicly.
//
// First exhibit: the ScoreRing "glowing data-viz" (B) treatment, shown at the
// exact score colours + sizes the app uses, with glow ON vs OFF.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScoreRing } from '@/components/ui/ScoreRing';

export const metadata: Metadata = {
  title: 'Design Lab (dev)',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

// One sample per grade band so the glow is visible across the whole score-color
// range (green → blue → amber → orange → red).
const SCORES = [92, 78, 62, 48, 32];

// The real (size, strokeWidth, label) configs used around the app.
const CONFIGS: { where: string; size: number; stroke: number; label?: string; glow: boolean }[] = [
  { where: 'Dashboard · Overall (hero)', size: 100, stroke: 8, label: 'Overall', glow: true },
  { where: 'Compare · Session A/B', size: 80, stroke: 7, label: 'Overall', glow: true },
  { where: 'Progress · snapshot', size: 70, stroke: 6, label: 'Overall', glow: true },
  { where: 'Diagnose · result', size: 64, stroke: 6, label: 'Face', glow: true },
  { where: 'Session detail · metric (grid — no glow)', size: 56, stroke: 5, glow: false },
  { where: 'Sessions list (no glow)', size: 44, stroke: 4, glow: false },
];

export default function DesignLabPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-link">
            Dev only · noindex
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            Design Lab — <span className="text-link">Data-viz</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The real <code className="text-link">ScoreRing</code> component as the auth-gated app renders it.
            The “glow” haloes the progress ring in its own score colour — applied to the focal/headline
            scores, skipped on the small rings repeated in lists &amp; grids.
          </p>
        </header>

        {/* Seeded previews of the auth-gated surfaces. */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-lg font-semibold uppercase tracking-tight">Seeded previews (no login)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { href: '/design-lab/dashboard', title: 'Dashboard', blurb: 'Real DashboardContent — the glowing Overall score in context.' },
              { href: '/design-lab/diagnose', title: 'Diagnose', blurb: 'Real result with three engine-scored glowing rings.' },
              { href: '/design-lab/publishing', title: 'PublishingOS', blurb: 'Admin command center + the entity Detail drawer (click a queue row).' },
            ].map((p) => (
              <Link key={p.href} href={p.href} className="rounded-theme border border-border bg-card p-5 shadow-theme transition-colors hover:border-primary/50">
                <h3 className="font-heading text-base font-semibold uppercase tracking-tight text-foreground">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                <span className="mt-3 inline-block text-xs font-semibold text-link">Open →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Glow ON vs OFF, across the score-colour range, at the hero size. */}
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-lg font-semibold uppercase tracking-tight">Glow on vs off — across grades</h2>
          <div className="rounded-theme border border-border bg-card p-6 shadow-theme">
            <div className="grid grid-cols-[120px_1fr] gap-y-8">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground self-center">Glow ON</div>
              <div className="flex flex-wrap items-center gap-8">
                {SCORES.map((s) => (
                  <ScoreRing key={`on-${s}`} score={s} size={84} strokeWidth={7} label={`${s}`} glow />
                ))}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground self-center">Glow OFF</div>
              <div className="flex flex-wrap items-center gap-8">
                {SCORES.map((s) => (
                  <ScoreRing key={`off-${s}`} score={s} size={84} strokeWidth={7} label={`${s}`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Each real app config at a representative score. */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold uppercase tracking-tight">Per-surface configs (as shipped)</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CONFIGS.map((c) => (
              <div key={c.where} className="flex flex-col items-center gap-3 rounded-theme border border-border bg-card p-6 shadow-theme">
                <ScoreRing score={86} size={c.size} strokeWidth={c.stroke} label={c.label} glow={c.glow} />
                <p className="text-center text-xs text-muted-foreground">{c.where}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${c.glow ? 'border-primary/30 bg-primary/10 text-link' : 'border-border bg-secondary text-muted-foreground'}`}>
                  glow {c.glow ? 'on' : 'off'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
