'use client';

// ============================================================
// SwingVantage — Feature Education Engine: Admin cockpit (client)
// ------------------------------------------------------------
// The control surface for the engine: coverage at a glance, the Feature
// Registry, the prioritized content-gap list, the drift queue, and recent
// activity. "Scan now" re-detects features from the live app map. Feature
// rows link to a detail page where assets are generated, reviewed and
// published. Reads pre-computed data from the server page; mutations go
// through /api/feature-education/*.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, RefreshCw, Search, AlertTriangle, GitBranch, ListChecks,
  LayoutGrid, Activity, ArrowUpRight, ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { warrantedAssetTypes } from '@/lib/feature-education/coverage';
import {
  CATEGORY_LABELS,
  type FeatureRecord,
  type EducationAsset,
  type ContentGap,
  type DriftFinding,
  type FeeAuditLog,
  type FeatureCategory,
} from '@/lib/feature-education/types';

interface Overview {
  features: FeatureRecord[];
  assets: EducationAsset[];
  gaps: ContentGap[];
  drift: DriftFinding[];
  summary: { totalFeatures: number; fullyCovered: number; partiallyCovered: number; uncovered: number; coveragePct: number };
  audit: FeeAuditLog[];
  persistent: boolean;
  backend: string;
  needsReviewCount: number;
}

type Tab = 'overview' | 'registry' | 'gaps' | 'drift' | 'activity';

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'registry', label: 'Registry', icon: ListChecks },
  { id: 'gaps', label: 'Gaps', icon: AlertTriangle },
  { id: 'drift', label: 'Drift', icon: GitBranch },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const DRIFT_TONE: Record<string, BadgeTone> = { high: 'danger', medium: 'warning', low: 'neutral' };

function coverageOf(f: FeatureRecord): { covered: number; total: number } {
  const warranted = warrantedAssetTypes(f);
  const covered = warranted.filter((t) => {
    const s = f.coverage[t]?.status;
    return s === 'published' || s === 'approved';
  }).length;
  return { covered, total: warranted.length };
}

export function FeatureEducationCockpit({ initial }: { initial: Overview }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // registry filters
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<FeatureCategory | 'all'>('all');
  const [reviewOnly, setReviewOnly] = useState(false);

  const { features, gaps, drift, summary, audit } = initial;

  async function scanNow() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/feature-education/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Scan failed (${res.status}).`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed.');
    } finally {
      setBusy(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set<FeatureCategory>();
    features.forEach((f) => set.add(f.category));
    return [...set].sort();
  }, [features]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return features.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (reviewOnly && !f.needsHumanReview) return false;
      if (!term) return true;
      return (
        f.name.toLowerCase().includes(term) ||
        f.slug.toLowerCase().includes(term) ||
        f.routes.some((r) => r.toLowerCase().includes(term))
      );
    });
  }, [features, q, category, reviewOnly]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Feature Education"
        icon={BookOpen}
        description="Every feature you ship, kept taught. The engine detects features from your routes, admin nav and commits, then generates tutorials, how-tos, manuals, FAQs, video scripts, release notes and in-app help — all reviewed here before anything goes live."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={initial.persistent ? 'success' : 'warning'}>
              {initial.persistent ? 'Durable storage' : 'Local mode'}
            </StatusBadge>
            <button
              onClick={scanNow}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-gray-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
              {busy ? 'Scanning…' : 'Scan now'}
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricStat label="Features" value={summary.totalFeatures} icon={ListChecks} hint="in the registry" />
        <MetricStat
          label="Coverage"
          value={`${summary.coveragePct}%`}
          icon={BookOpen}
          tone={summary.coveragePct >= 60 ? 'success' : 'warning'}
          hint="fully covered"
        />
        <MetricStat label="Gaps" value={gaps.length} icon={AlertTriangle} tone={gaps.length ? 'warning' : 'success'} hint="features needing assets" />
        <MetricStat label="Drift" value={drift.length} icon={GitBranch} tone={drift.length ? 'warning' : 'success'} hint="stale / changed" />
        <MetricStat label="Needs review" value={initial.needsReviewCount} icon={ShieldAlert} tone={initial.needsReviewCount ? 'warning' : 'default'} hint="drafts to approve" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-800">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                active ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SectionCard title="Coverage" description="How much of the product is fully taught (published or approved across every warranted asset type).">
              <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${summary.coveragePct}%` }} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span><span className="font-semibold text-emerald-400">{summary.fullyCovered}</span> fully covered</span>
                <span><span className="font-semibold text-amber-400">{summary.partiallyCovered}</span> partial</span>
                <span><span className="font-semibold text-gray-300">{summary.uncovered}</span> uncovered</span>
              </div>
            </SectionCard>

            <SectionCard
              title="Top content gaps"
              description="Highest-impact features missing learning assets."
              actions={<button onClick={() => setTab('gaps')} className="text-xs text-amber-400 hover:underline">View all</button>}
            >
              {gaps.length === 0 ? (
                <p className="text-sm text-gray-500">No gaps — every feature has its warranted assets. 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {gaps.slice(0, 6).map((g) => (
                    <li key={g.featureId}>
                      <Link href={`/admin/feature-education/${g.featureId}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 p-2.5 hover:border-gray-700">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-200">{g.featureName}</span>
                          <span className="block truncate text-xs text-gray-500">{g.missing.length} missing · {g.weak.length} weak</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <StatusBadge tone={g.priorityScore >= 70 ? 'danger' : g.priorityScore >= 40 ? 'warning' : 'neutral'}>P{g.priorityScore}</StatusBadge>
                          <ArrowUpRight className="h-4 w-4 text-gray-600" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Storage">
              <p className="text-sm text-gray-400">{initial.backend}</p>
              {!initial.persistent && (
                <p className="mt-2 text-xs text-gray-500">
                  The registry is read from the committed snapshot; generated drafts live in memory. Apply{' '}
                  <code className="text-gray-400">supabase-feature-education.sql</code> to persist.
                </p>
              )}
            </SectionCard>
            <SectionCard title="Recent activity" actions={<button onClick={() => setTab('activity')} className="text-xs text-amber-400 hover:underline">All</button>}>
              <ActivityList audit={audit.slice(0, 6)} />
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── Registry ── */}
      {tab === 'registry' && (
        <SectionCard
          title={`Feature Registry (${filtered.length})`}
          description="The source of truth for every feature and its learning coverage. Click a feature to generate, review and publish its assets."
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, slug or route…"
                className="w-full rounded-lg border border-gray-800 bg-gray-950 py-2 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeatureCategory | 'all')}
              className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-400">
              <input type="checkbox" checked={reviewOnly} onChange={(e) => setReviewOnly(e.target.checked)} className="accent-amber-500" />
              Needs review
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-2xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-2 pr-3">Feature</th>
                  <th className="pb-2 pr-3">Category</th>
                  <th className="pb-2 pr-3">Coverage</th>
                  <th className="pb-2 pr-3">Confidence</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {filtered.slice(0, 200).map((f) => {
                  const cov = coverageOf(f);
                  const pct = cov.total ? Math.round((cov.covered / cov.total) * 100) : 0;
                  return (
                    <tr key={f.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                      <td className="py-2 pr-3">
                        <Link href={`/admin/feature-education/${f.id}`} className="font-medium text-gray-100 hover:text-amber-400">
                          {f.name}
                        </Link>
                        <span className="block truncate text-xs text-gray-500">{f.routes[0] ?? f.apiEndpoints[0] ?? f.slug}</span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-400">{CATEGORY_LABELS[f.category]}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-800">
                            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500/70' : 'bg-amber-500/70'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="tabular-nums text-xs text-gray-500">{cov.covered}/{cov.total}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-xs text-gray-400">{f.confidence}</td>
                      <td className="py-2">
                        {f.needsHumanReview ? (
                          <StatusBadge tone="warning">review</StatusBadge>
                        ) : f.status === 'removed' ? (
                          <StatusBadge tone="danger">removed</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">{f.status}</StatusBadge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No features match.</p>}
          </div>
        </SectionCard>
      )}

      {/* ── Gaps ── */}
      {tab === 'gaps' && (
        <SectionCard title={`Content gaps (${gaps.length})`} description="Features missing learning assets, ranked by impact (audience reach × importance × how much is missing).">
          {gaps.length === 0 ? (
            <p className="text-sm text-gray-500">No gaps. Every feature has its warranted assets.</p>
          ) : (
            <ul className="space-y-2">
              {gaps.map((g) => (
                <li key={g.featureId} className="rounded-lg border border-gray-800 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/admin/feature-education/${g.featureId}`} className="font-medium text-gray-100 hover:text-amber-400">{g.featureName}</Link>
                    <StatusBadge tone={g.priorityScore >= 70 ? 'danger' : g.priorityScore >= 40 ? 'warning' : 'neutral'}>Priority {g.priorityScore}</StatusBadge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.missing.map((t) => <span key={t} className="rounded bg-gray-800 px-1.5 py-0.5 text-2xs text-gray-400">missing: {t}</span>)}
                    {g.weak.map((t) => <span key={t} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-2xs text-amber-400">weak: {t}</span>)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {/* ── Drift ── */}
      {tab === 'drift' && (
        <SectionCard title={`Drift queue (${drift.length})`} description="Where the product changed but its docs didn't. The engine proposes a fix for each.">
          {drift.length === 0 ? (
            <p className="text-sm text-gray-500">No drift detected. Docs are in sync with the product.</p>
          ) : (
            <ul className="space-y-2">
              {drift.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-800 p-3">
                  <div className="min-w-0">
                    <Link href={`/admin/feature-education/${d.featureId}`} className="text-sm font-medium text-gray-200 hover:text-amber-400">{d.kind}</Link>
                    <p className="mt-0.5 text-xs text-gray-500">{d.detail}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge tone="info">{d.proposedAction}</StatusBadge>
                    <StatusBadge tone={DRIFT_TONE[d.severity]}>{d.severity}</StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {/* ── Activity ── */}
      {tab === 'activity' && (
        <SectionCard title="Activity & audit trail" description="Every scan, generation, review and publish — who did what, when.">
          <ActivityList audit={audit} />
        </SectionCard>
      )}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> An automated documentation department. As you ship
          features (detected from routes, admin nav and commits), it drafts the tutorials, how-tos, manuals, FAQs,
          troubleshooting, video scripts, release notes and in-app help each one warrants.
        </p>
        <p>
          <strong className="text-gray-300">How to use it.</strong> Open a feature, click <em>Generate package</em>,
          review the drafts (each is quality-scored and security-scanned), then approve and publish. Nothing goes live
          without your approval. Use <em>Scan now</em> after big changes; the git hook keeps the registry fresh on every push.
        </p>
        <p>
          <strong className="text-gray-300">Add a feature by hand.</strong> Put a{' '}
          <code>Feature: &lt;name&gt;</code> trailer in any commit and it’s registered with high confidence.
        </p>
      </HelpPanel>
    </div>
  );
}

function ActivityList({ audit }: { audit: FeeAuditLog[] }) {
  if (audit.length === 0) return <p className="text-sm text-gray-500">No activity yet. Run a scan or generate a package.</p>;
  return (
    <ul className="space-y-1.5">
      {audit.map((a) => (
        <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0">
            <span className="text-gray-300">{a.summary}</span>
            <span className="block text-2xs text-gray-600">{a.actor} · {a.action}</span>
          </span>
          <time className="shrink-0 text-2xs text-gray-600">{new Date(a.createdAt).toLocaleString()}</time>
        </li>
      ))}
    </ul>
  );
}
