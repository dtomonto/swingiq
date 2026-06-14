// ============================================================
// /admin/metrics/[id] — the metric explainer
// ------------------------------------------------------------
// Every dashboard number links here. Curated metrics (the registry) render a
// rich explainer with their live value; anything not yet curated still opens
// an honest generic explainer built from the id + the value you clicked —
// never a dead link. Admin-only, noindex.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Calculator, Lightbulb, AlertTriangle, Link2, Gauge,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import {
  getMetricDefinition,
  humanizeMetricId,
  METRIC_CATEGORY_LABEL,
  METRIC_DATA_SOURCE_LABEL,
  type MetricDataSource,
} from '@/lib/admin/metrics';
import { resolveMetricValue } from '@/lib/admin/metrics/resolvers.server';

export const metadata: Metadata = { title: 'Metric explainer | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SOURCE_TONE: Record<MetricDataSource, BadgeTone> = {
  real: 'success',
  derived: 'info',
  estimated: 'watch',
  placeholder: 'warning',
  demo: 'accent',
  config: 'neutral',
};

function SourceBadge({ source }: { source: MetricDataSource }) {
  return <StatusBadge tone={SOURCE_TONE[source]}>{METRIC_DATA_SOURCE_LABEL[source]}</StatusBadge>;
}

export default async function MetricExplainerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v: clickedValue } = await searchParams;
  const def = getMetricDefinition(id);
  const live = await resolveMetricValue(id).catch(() => null);

  const title = def?.label ?? humanizeMetricId(id);
  const categoryLabel = def ? METRIC_CATEGORY_LABEL[def.category] : 'Metric';

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <Link
        href="/admin/metrics"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All metrics
      </Link>

      <PageHeader
        title={title}
        icon={Gauge}
        description={def?.summary ?? 'What this number means and where it comes from.'}
        badge={<StatusBadge tone="neutral">{categoryLabel}</StatusBadge>}
      />

      {/* Live / clicked value */}
      <SectionCard level="elevated">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              {live ? 'Current value' : 'Value on the card you clicked'}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              {live?.value ?? clickedValue ?? '—'}
              {def?.unit && <span className="ml-1 text-base font-medium text-muted-foreground">{def.unit}</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <SourceBadge source={live?.source ?? def?.dataSource ?? 'derived'} />
            {live?.asOf && (
              <span className="font-mono text-3xs text-muted-foreground">
                read {live.asOf.replace('T', ' ').slice(0, 16)}
              </span>
            )}
          </div>
        </div>
        {live?.note && <p className="mt-2 text-xs text-muted-foreground">{live.note}</p>}
        {!live && clickedValue && (
          <p className="mt-2 text-xs text-muted-foreground">
            This is the value shown on the card when you opened this page. Open the source surface for the live figure.
          </p>
        )}
      </SectionCard>

      {def ? (
        <>
          <SectionCard title={<TitleWith icon={BookOpen} text="What it is" />}>
            <p className="text-sm leading-relaxed text-foreground">{def.definition}</p>
          </SectionCard>

          <SectionCard title={<TitleWith icon={Calculator} text="How it's computed" />}>
            <p className="text-sm leading-relaxed text-foreground">{def.howComputed}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SourceBadge source={def.dataSource} />
              {def.sourceDetail && (
                <code className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-2xs text-muted-foreground">
                  {def.sourceDetail}
                </code>
              )}
            </div>
          </SectionCard>

          <SectionCard title={<TitleWith icon={Lightbulb} text="How to read it" />}>
            <p className="text-sm leading-relaxed text-foreground">{def.interpretation}</p>
          </SectionCard>

          {def.caveats && def.caveats.length > 0 && (
            <SectionCard title={<TitleWith icon={AlertTriangle} text="Honest caveats" />}>
              <ul className="space-y-1.5">
                {def.caveats.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    {c}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {def.related && def.related.length > 0 && (
            <SectionCard title={<TitleWith icon={Link2} text="Related" />}>
              <div className="flex flex-wrap gap-2">
                {def.related.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:text-link"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      ) : (
        // ── Honest generic fallback for a not-yet-curated metric ──
        <SectionCard title={<TitleWith icon={BookOpen} text="About this metric" />}>
          <p className="text-sm leading-relaxed text-foreground">
            A detailed explainer for <span className="font-semibold">{title}</span> is being written. In the
            meantime: read it in context on the surface you came from, and watch how it trends rather than any
            single reading. Every number in this admin is labelled with its data source so you can judge how
            much weight to give it.
          </p>
          <div className="mt-3 rounded-lg border border-primary/30 bg-primary/[0.05] p-3 text-xs text-muted-foreground">
            Want this metric explained in depth next? It&apos;s a one-line addition to the metric registry
            (<code className="font-mono">lib/admin/metrics/registry.ts</code>) — tell Claude Code the id{' '}
            <code className="font-mono">{id}</code> and what it should say.
          </div>
        </SectionCard>
      )}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this page is.</strong> Every metric, KPI and number in the
          admin links here so you can learn exactly what it means, how it&apos;s computed, where the data comes
          from, and how to read it — without guessing.
        </p>
        <p>
          <strong className="text-foreground">Honesty first.</strong> Each metric carries a data-source label
          (live, derived, configuration, placeholder, demo). Nothing is presented as a real production figure
          unless it genuinely is.
        </p>
      </HelpPanel>
    </div>
  );
}

function TitleWith({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" /> {text}
    </span>
  );
}
