// ============================================================
// /admin/growth — Executive Overview (§5)
// ------------------------------------------------------------
// The leadership landing page. Honest by construction: portfolio counts
// come from the (demo) repository; funnel KPIs are clearly labeled as
// placeholders until an analytics provider is connected.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Gauge, Layers, Megaphone, FlaskConical, FileText, Lightbulb, ClipboardList,
  TrendingUp, ArrowRight, Sparkles, CalendarDays,
} from 'lucide-react';
import { getOverviewSnapshot } from '@/lib/growth/repository';
import { aiConfigured, analyticsConfigured } from '@/lib/config/integrations';
import { ModuleHeader, KpiCard, SectionCard, PriorityBadge } from './_components/ui';
import { formatDate, humanize } from '@/lib/growth/format';

export const metadata: Metadata = {
  title: 'Executive Overview | GrowthOS',
  robots: 'noindex, nofollow',
};

export default async function GrowthOverviewPage() {
  const snap = await getOverviewSnapshot();
  const analyticsOn = analyticsConfigured(process.env);
  const aiOn = aiConfigured(process.env);

  const portfolio = [
    { label: 'Channels', value: snap.counts.channels, icon: Layers, href: '/admin/growth/channels', accent: 'text-blue-400' },
    { label: 'Active campaigns', value: snap.counts.activeCampaigns, icon: Megaphone, href: '/admin/growth/campaigns', accent: 'text-green-400' },
    { label: 'Experiments', value: snap.counts.experiments, icon: FlaskConical, href: '/admin/growth/experiments', accent: 'text-purple-400' },
    { label: 'Content in pipeline', value: snap.counts.contentInProgress, icon: FileText, href: '/admin/growth/content', accent: 'text-amber-400' },
    { label: 'Open recommendations', value: snap.counts.openRecommendations, icon: Lightbulb, href: '/admin/growth/recommendations', accent: 'text-green-400' },
    { label: 'Open tasks', value: snap.counts.openTasks, icon: ClipboardList, href: '/admin/growth/operations', accent: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Gauge}
        title="Executive Overview"
        description="The growth brain of the company — strategy, channels, campaigns, and AI recommendations in one command center."
      />

      {/* Data honesty banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200/90">
            <p className="font-semibold text-amber-300">Reading the numbers</p>
            <p className="mt-1 text-xs leading-relaxed">
              Portfolio counts below are <strong>real counts of items you've planned in GrowthOS</strong> (seeded with demo data today).
              Funnel performance KPIs are <strong>placeholders</strong> until you connect an analytics provider —
              GrowthOS never shows invented metrics as real.{' '}
              {analyticsOn
                ? 'Analytics is configured ✓'
                : <>Analytics is <strong>not connected</strong> — set <code className="text-amber-100">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code> or <code className="text-amber-100">NEXT_PUBLIC_GA_ID</code>.</>}
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio counts (real counts of planned work) */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Growth portfolio</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {portfolio.map((p) => (
            <Link key={p.label} href={p.href} className="group">
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors h-full">
                <div className="flex items-center justify-between mb-2">
                  <p.icon className={`w-4 h-4 ${p.accent}`} />
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
                <p className={`text-2xl font-bold ${p.accent}`}>{p.value}</p>
                <p className="text-xs text-gray-400 mt-1">{p.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Funnel KPIs (placeholder until analytics connected) */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Funnel performance</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {snap.metrics.slice(0, 4).map((m) => (
            <KpiCard
              key={m.id}
              label={m.name}
              value={m.value === null ? '—' : String(m.value)}
              sublabel={m.definition}
              source={m.dataSource}
              accent="text-gray-300"
            />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top AI recommendations */}
        <SectionCard
          title="AI strategic recommendations"
          icon={Lightbulb}
          action={<Link href="/admin/growth/recommendations" className="text-xs text-green-400 hover:text-green-300">View all →</Link>}
        >
          <div className="space-y-3">
            {snap.topRecommendations.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-200">{r.name}</p>
                  <PriorityBadge priority={r.priority} />
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{r.reasoning}</p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
                  <span className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">{humanize(r.lever)}</span>
                  <span>·</span>
                  <span>{r.basis === 'data' ? 'Data-backed' : 'Strategic'}</span>
                </div>
              </div>
            ))}
            {!aiOn && (
              <p className="text-[11px] text-gray-600 pt-1">
                Tip: connect an AI provider (<code>AI_PROVIDER</code> + key) to generate tailored recommendations in the AI Strategist.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Upcoming calendar */}
        <SectionCard
          title="Upcoming on the calendar"
          icon={CalendarDays}
          action={<Link href="/admin/growth/calendar" className="text-xs text-green-400 hover:text-green-300">Open calendar →</Link>}
        >
          <div className="space-y-2">
            {snap.upcoming.length === 0 ? (
              <p className="text-xs text-gray-500">Nothing scheduled yet.</p>
            ) : (
              snap.upcoming.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-[10px] text-gray-500 uppercase">{new Date(c.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-sm font-bold text-gray-200">{new Date(c.date).getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 truncate">{c.name}</p>
                    <p className="text-[11px] text-gray-500">{humanize(c.itemType)} · {c.channel}</p>
                  </div>
                  <span className="text-[11px] text-gray-500 shrink-0">{formatDate(c.date)}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* Welcome / what is this */}
      <SectionCard title="What is GrowthOS?" icon={Sparkles}>
        <div className="text-sm text-gray-400 space-y-2 leading-relaxed">
          <p>
            GrowthOS is your internal marketing operating system — 28 connected modules spanning strategy, channels,
            campaigns, SEO/AEO/GEO, content, social, lifecycle, paid media, experiments, CRO, brand, analytics, and an AI strategist.
          </p>
          <p>
            Everything is <strong className="text-gray-300">draft-first and honest</strong>: AI output is labeled as drafts for your review,
            no message ever auto-sends, and every number is tagged with where it came from. Use the left sidebar to explore.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/admin/growth/strategy" className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600">Strategy Hub →</Link>
            <Link href="/admin/growth/ai-strategist" className="text-xs px-3 py-1.5 rounded-lg bg-green-600/15 border border-green-600/30 text-green-300 hover:bg-green-600/25">Try the AI Strategist →</Link>
            <Link href="/admin/growth/analytics" className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600">UTM builder →</Link>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
