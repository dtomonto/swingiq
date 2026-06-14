// ============================================================
// /admin/metrics — the metric glossary
// ------------------------------------------------------------
// A directory of every curated metric explainer, grouped by area. Each row
// links to /admin/metrics/<id>. (Tiles across the admin also deep-link here
// directly; this index is the "browse all definitions" entry point.)
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Gauge, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import {
  metricsByCategory,
  metricHref,
  METRIC_CATEGORY_LABEL,
  METRIC_DATA_SOURCE_LABEL,
  listMetricDefinitions,
} from '@/lib/admin/metrics';

export const metadata: Metadata = { title: 'Metric glossary | Admin', robots: 'noindex, nofollow' };

export default function MetricsIndexPage() {
  const groups = metricsByCategory();
  const total = listMetricDefinitions().length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Metric glossary"
        icon={Gauge}
        description="Every dashboard number, explained. Click any metric to learn what it means, how it's computed, where the data comes from and how to read it."
        actions={<StatusBadge tone="neutral">{total} explained</StatusBadge>}
      />

      {groups.map((g) => (
        <SectionCard key={g.category} title={METRIC_CATEGORY_LABEL[g.category]}>
          <ul className="divide-y divide-border/60">
            {g.metrics.map((m) => (
              <li key={m.id}>
                <Link
                  href={metricHref(m.id)}
                  className="group flex items-start justify-between gap-3 py-2.5 hover:text-link"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-link">{m.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.summary}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-3xs text-muted-foreground sm:inline">
                      {METRIC_DATA_SOURCE_LABEL[m.dataSource]}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-link" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-foreground">Why this exists.</strong> So no number on the dashboard is a
          mystery. Each metric has its own page with a plain-English definition, the exact computation, an
          honest data-source label and guidance on how to read it.
        </p>
        <p>
          <strong className="text-foreground">Coverage.</strong> Core platform, system and AI metrics are
          curated here; any metric not yet written up still opens an honest generic explainer (never a dead
          link), and is a one-line addition to expand.
        </p>
      </HelpPanel>
    </div>
  );
}
