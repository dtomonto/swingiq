// ============================================================
// SwingVantage — SwingLab 2.0 vision page
// ------------------------------------------------------------
// Route: /swinglab  (public marketing surface — auto-wrapped with the
// MarketingHeader + PublicFooter by the (marketing) group layout).
//
// Consolidated model: EVERYONE sees the SwingLab 2.0 vision page (the
// strategic doorway — concept, station model, roadmap). Logged-in admins
// ALSO get a doorway into the live interactive hub at /lab while it's in
// development. The honest "in development" framing stays for all; the 3D
// experience is not implied to be live.
//
// Self-contained dark "lab" surface so contrast is guaranteed regardless
// of the active app theme. Server-rendered; the only client island is the
// honest EmailCapture form.
// ============================================================

import Link from 'next/link';
import { ArrowRight, Compass, FlaskConical, Map as MapIcon, Rocket, Sparkles, Waypoints } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { EmailCapture } from '@/components/email/EmailCapture';
import {
  LAB_FLOW,
  LAB_SPORTS,
  LAB_STATIONS,
  LAB_VALUE,
  SWINGLAB_COPY,
} from '@/content/swinglab';
import { StationCard } from '@/components/swinglab/StationCard';
import { LabMap } from '@/components/swinglab/LabMap';
import { RoadmapTimeline } from '@/components/swinglab/RoadmapTimeline';
import { isAdminUser } from '@/lib/auth/admin';

// Public marketing vision page for everyone — indexable, honest "in
// development" content. Admins additionally see a link into /lab.
export const metadata = buildMetadata({
  title: SWINGLAB_COPY.metaTitle,
  description: SWINGLAB_COPY.metaDescription,
  path: '/swinglab',
  keywords: [
    'SwingLab 2.0',
    'virtual sports performance lab',
    'first-person swing training',
    '3D swing analysis',
    'AI sports coaching',
    'SwingVantage',
    'immersive training environment',
  ],
});

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwingVantage', item: 'https://swingvantage.com' },
        { '@type': 'ListItem', position: 2, name: 'SwingLab 2.0', item: 'https://swingvantage.com/swinglab' },
      ],
    },
    {
      '@type': 'WebPage',
      name: SWINGLAB_COPY.metaTitle,
      description: SWINGLAB_COPY.metaDescription,
      url: 'https://swingvantage.com/swinglab',
      about: {
        '@type': 'SoftwareApplication',
        name: 'SwingLab 2.0',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web browser',
        // Honest: the immersive lab is in development.
        releaseNotes: 'In development — concept phase. The tools that power each station are available today.',
        featureList: LAB_STATIONS.map((s) => s.name).join(', '),
      },
    },
  ],
};

/** Small reusable eyebrow used to head each major section. */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{children}</p>;
}

/**
 * The SwingLab 2.0 vision page — concept, lab map, stations, roadmap. Shown to
 * everyone. When `isAdmin`, a doorway into the live interactive hub (/lab) is
 * surfaced (it's still admin-only while in development).
 */
function SwingLabVision({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="relative isolate overflow-hidden bg-slate-950 text-slate-200">
      <JsonLd data={structuredData} />

      {/* Ambient lab atmosphere (decorative, non-interactive) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-[#070b16]" />
        <div className="absolute left-1/2 top-[-10%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-[26rem] w-[26rem] rounded-full bg-cyan-600/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[26rem] w-[26rem] rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:pt-20">
        <div className="inline-flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles size={13} aria-hidden="true" /> {SWINGLAB_COPY.name}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            {SWINGLAB_COPY.status}
          </span>
        </div>

        {/* Admin doorway into the live interactive lab */}
        {isAdmin && (
          <div className="mx-auto mt-6 max-w-xl">
            <Link
              href="/lab"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-200 transition-colors hover:bg-emerald-500/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <FlaskConical size={16} aria-hidden="true" />
              Admin preview: the interactive lab is live for you — enter the lab
              <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}

        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          Step inside the future of <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">swing training</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
          {SWINGLAB_COPY.heroSubtitle}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#lab-map"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
          >
            <MapIcon size={17} aria-hidden="true" /> Explore the lab map
          </a>
          <a
            href="#roadmap"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
          >
            <Waypoints size={17} aria-hidden="true" /> See the roadmap
          </a>
        </div>

        {/* Honest availability note */}
        <p className="mx-auto mt-5 max-w-xl text-sm text-slate-400">
          SwingLab 2.0 is in development. The tools that will power it are{' '}
          <Link href="/free-swing-analysis" className="font-semibold text-emerald-300 underline-offset-2 hover:underline">
            available to use today
          </Link>
          .
        </p>

        {/* Sports row */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
          {LAB_SPORTS.map((s) => (
            <span key={s} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ──────────────────── Concept + operating model ──────────────────── */}
      <section id="concept" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>The concept</SectionEyebrow>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">One lab. Every tool. One journey.</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">{SWINGLAB_COPY.conceptLead}</p>
        </div>

        {/* The operating model — the mental model that holds it together */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-emerald-300" aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">The operating model</h3>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Each space has one clear job. Together they form a single system — so analysis always leads somewhere.
          </p>
          <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {LAB_STATIONS.map((s) => (
              <div key={s.id} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-3">
                <dt className="text-sm font-semibold text-white">{s.name}</dt>
                <dd className="shrink-0 text-sm font-medium text-emerald-300/90">{s.systemRole}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────────────────── Lab map ─────────────────────── */}
      <section id="lab-map" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-10">
        <div className="mx-auto mb-7 max-w-3xl text-center">
          <SectionEyebrow>The lab map</SectionEyebrow>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">A first look at the floor plan</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            This is a stylized preview — not the live 3D lab. Pick any zone to see what it will do and the SwingVantage tools it connects.
          </p>
        </div>
        <LabMap />
      </section>

      {/* ─────────────────────── Stations ─────────────────────── */}
      <section id="stations" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
        <div className="mx-auto mb-9 max-w-3xl text-center">
          <SectionEyebrow>The stations</SectionEyebrow>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Ten spaces, one connected environment</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Every station is a part of the athlete journey. The immersive walkthrough is in development — but most stations
            already open a tool you can use right now.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LAB_STATIONS.map((station, i) => (
            <StationCard key={station.id} station={station} index={i} />
          ))}
        </div>
      </section>

      {/* ─────────────────── How it will work ─────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-14">
        <div className="mx-auto mb-9 max-w-3xl text-center">
          <SectionEyebrow>How it will work</SectionEyebrow>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">From walking in to walking out with a plan</h2>
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LAB_FLOW.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                {i + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ─────────────────── Why it matters ─────────────────── */}
      <section id="why" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
        <div className="mx-auto mb-9 max-w-3xl text-center">
          <SectionEyebrow>Why it matters</SectionEyebrow>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">From a toolbox to a training environment</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LAB_VALUE.map((v) => (
            <div key={v.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="text-base font-semibold text-white">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{v.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── Roadmap ─────────────────────── */}
      <section id="roadmap" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14">
        <div className="mb-9">
          <SectionEyebrow>The roadmap</SectionEyebrow>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Where SwingLab 2.0 is headed</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Aspirational but honest. We only mark a phase live when you can actually use it.
          </p>
        </div>
        <RoadmapTimeline />
      </section>

      {/* ─────────────────────── Final CTA ─────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-cyan-500/10 p-8 text-center sm:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative">
            <Rocket size={28} className="mx-auto text-emerald-300" aria-hidden="true" />
            <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-bold text-white sm:text-3xl">
              The next evolution of SwingVantage
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
              SwingLab 2.0 is being designed as one immersive place to analyze, train, learn, and improve. You don’t have to
              wait to get started — the tools that will power the lab are live today.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/free-swing-analysis"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
              >
                Start with swing analysis <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/features"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
              >
                Explore SwingVantage
              </Link>
            </div>

            {/* Honest "follow development" capture — reuses the provider-agnostic
                email system (truthful when no provider is connected). */}
            <div className="mx-auto mt-8 max-w-md text-left">
              <EmailCapture
                source="general"
                heading="Follow SwingLab 2.0 development"
                subheading="Get an email when new stations and the interactive lab go live. No spam, unsubscribe anytime."
                submitLabel="Notify me"
                meta={{ feature: 'swinglab-2.0', phase: 'concept' }}
              />
            </div>
          </div>
        </div>

        {/* Cross-links back into the product */}
        <nav aria-label="Related" className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {isAdmin && (
            <Link href="/lab" className="font-semibold text-emerald-300 transition-colors hover:text-white">Interactive lab (admin) →</Link>
          )}
          <Link href="/features" className="text-slate-400 transition-colors hover:text-white">All features</Link>
          <Link href="/how-it-works" className="text-slate-400 transition-colors hover:text-white">How it works</Link>
          <Link href="/motion-lab" className="text-slate-400 transition-colors hover:text-white">Motion Lab (3D)</Link>
          <Link href="/agi" className="text-slate-400 transition-colors hover:text-white">Athlete Intelligence</Link>
          <Link href="/start" className="text-slate-400 transition-colors hover:text-white">Start free</Link>
        </nav>
      </section>
    </div>
  );
}

/**
 * Route entry. Everyone sees the SwingLab 2.0 vision page; logged-in admins
 * also get a doorway into the live interactive lab (/lab), which stays
 * admin-only while in development.
 */
export default async function SwingLabPage() {
  const isAdmin = await isAdminUser();
  return <SwingLabVision isAdmin={isAdmin} />;
}
