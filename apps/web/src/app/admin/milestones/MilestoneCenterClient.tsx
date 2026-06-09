'use client';

// ============================================================
// Milestone Authority System — admin center (CLIENT)
// ------------------------------------------------------------
// Re-runs the PURE evaluator with the admin's localStorage overrides (so
// admin-attested values + approvals are live), and renders the cockpit:
// Overview · Definitions · Published · Recommendations · Audit. Approving +
// exporting produces the snippet to commit into content/milestones/published.ts
// — public pages are never written from the browser.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Award, Check, Clipboard, Database, ListChecks, ScrollText, Search, X,
} from 'lucide-react';
import { MetricStat } from '@/components/admin/MetricStat';
import { Panel, StatusPill, AuthorityPill, ProgressBar } from '@/components/milestones/MilestoneUI';
import { useMilestones, buildPublishedExport } from '@/lib/milestones/useMilestones';
import { evaluateMilestones, summarizeMilestones } from '@/lib/milestones/evaluate';
import { generateMilestoneContent } from '@/lib/milestones/content';
import { PUBLISHED_MILESTONES } from '@/content/milestones/published';
import {
  MILESTONE_CATEGORIES,
  type EvaluatedMilestone, type MetricSnapshot,
} from '@/lib/milestones/types';

interface Props {
  actor: string;
  snapshot: MetricSnapshot;
  initialEvaluated: EvaluatedMilestone[];
}

type TabId = 'overview' | 'definitions' | 'published' | 'recommendations' | 'audit';
const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'definitions', label: 'Definitions', icon: ListChecks },
  { id: 'published', label: 'Published', icon: Award },
  { id: 'recommendations', label: 'Recommendations', icon: Search },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
];

const PUBLISHED_SLUGS = new Set(PUBLISHED_MILESTONES.map((p) => p.slug));

export function MilestoneCenterClient({ actor, snapshot, initialEvaluated }: Props) {
  const ms = useMilestones();
  const [tab, setTab] = useState<TabId>('overview');

  useEffect(() => {
    if (actor) ms.setActor(actor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  const evaluated = useMemo(
    () => (ms.ready ? evaluateMilestones(snapshot, ms.overrides) : initialEvaluated),
    [ms.ready, ms.overrides, snapshot, initialEvaluated],
  );
  const counts = useMemo(() => summarizeMilestones(evaluated), [evaluated]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5 border-b border-gray-800 pb-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.id ? 'bg-emerald-500/90 text-gray-950' : 'border border-gray-700 text-gray-300 hover:bg-gray-800'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab evaluated={evaluated} counts={counts} onJump={setTab} />}
      {tab === 'definitions' && <DefinitionsTab evaluated={evaluated} ms={ms} />}
      {tab === 'published' && <PublishedTab evaluated={evaluated} ms={ms} />}
      {tab === 'recommendations' && <RecommendationsTab evaluated={evaluated} />}
      {tab === 'audit' && <AuditTab ms={ms} />}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ evaluated, counts, onJump }: { evaluated: EvaluatedMilestone[]; counts: ReturnType<typeof summarizeMilestones>; onJump: (t: TabId) => void }) {
  const close = evaluated.filter((e) => e.status === 'in_progress' && (e.progressPct ?? 0) >= 70)
    .sort((a, b) => (b.progressPct ?? 0) - (a.progressPct ?? 0)).slice(0, 6);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Earned" value={counts.byStatus.earned} icon={Award} tone="success" />
        <MetricStat label="In progress" value={counts.byStatus.in_progress} icon={Activity} tone={counts.byStatus.in_progress > 0 ? 'warning' : 'muted'} />
        <MetricStat label="Needs data source" value={counts.needsDataSource} icon={Database} tone={counts.needsDataSource > 0 ? 'warning' : 'muted'} />
        <MetricStat label="Total milestones" value={counts.total} icon={ListChecks} />
      </div>

      <Panel title="Authority distribution" hint="Admin-only Authority Impact Score bands across all 100 milestones.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(['strategic', 'high_value', 'supporting', 'low_priority', 'do_not_publish'] as const).map((b) => (
            <div key={b} className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-gray-100">{counts.byAuthority[b]}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{b.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Close to earning" hint={`${close.length} milestone(s) at ≥70% — your highest-leverage next wins.`}
        actions={<button onClick={() => onJump('definitions')} className="text-xs text-emerald-300 underline">All definitions →</button>}>
        {close.length === 0 ? (
          <p className="text-xs text-gray-500">Nothing within reach yet. Most milestones need more data or are already earned.</p>
        ) : (
          <ul className="space-y-2">
            {close.map((e) => (
              <li key={e.definition.id} className="rounded-lg border border-gray-800 bg-gray-950 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-200">{e.definition.title}</span>
                  <AuthorityPill band={e.authority.band} value={e.authority.value} />
                </div>
                <div className="mt-1.5"><ProgressBar pct={e.progressPct} /></div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ── Definitions ──────────────────────────────────────────────────────────────
function DefinitionsTab({ evaluated, ms }: { evaluated: EvaluatedMilestone[]; ms: ReturnType<typeof useMilestones> }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const filtered = evaluated.filter((e) =>
    (status === 'all' || e.status === status) &&
    (category === 'all' || e.definition.category === category) &&
    e.definition.title.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Panel title={`Milestone definitions (${filtered.length}/${evaluated.length})`} hint="Real progress, data source, Authority Impact and the review/publish controls for each.">
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-600" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200">
          <option value="all">All statuses</option>
          <option value="earned">Earned</option>
          <option value="in_progress">In progress</option>
          <option value="needs_data_source">Needs data source</option>
          <option value="not_started">Not started</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200">
          <option value="all">All categories</option>
          {MILESTONE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {filtered.map((e) => <DefinitionCard key={e.definition.id} e={e} ms={ms} />)}
        {filtered.length === 0 && <p className="text-xs text-gray-500">No milestones match.</p>}
      </div>
    </Panel>
  );
}

function DefinitionCard({ e, ms }: { e: EvaluatedMilestone; ms: ReturnType<typeof useMilestones> }) {
  const def = e.definition;
  const ov = ms.overrides[def.id];
  const content = useMemo(() => generateMilestoneContent(def, { verifiedMetric: e.currentValue != null ? `${e.currentValue}` : undefined }), [def, e.currentValue]);
  const thin = content.internalLinkSuggestions.length < 5;

  return (
    <details className="rounded-lg border border-gray-800 bg-gray-950 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm text-gray-100">{def.title}</span>
            <StatusPill status={e.status} />
            <AuthorityPill band={e.authority.band} value={e.authority.value} />
            {ov?.status === 'approved' && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">approved</span>}
          </div>
          <p className="mt-1 text-xs text-gray-500">{def.category} · {e.rationale}</p>
        </div>
        <div className="w-28 shrink-0"><ProgressBar pct={e.progressPct} /></div>
      </summary>

      <div className="mt-3 space-y-3 border-t border-gray-800 pt-3 text-xs text-gray-400">
        <p><span className="text-gray-300">Authority purpose:</span> {def.authorityPurpose}</p>

        {/* Review actions */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => ms.setEditorial(def.id, 'approved', def.title)} className="inline-flex items-center gap-1 rounded border border-emerald-700 px-2 py-1 text-emerald-300 hover:bg-emerald-500/10"><Check className="h-3 w-3" /> Approve</button>
          <button onClick={() => ms.setEditorial(def.id, 'rejected', def.title)} className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 hover:bg-gray-800"><X className="h-3 w-3" /> Reject</button>
          {ov && <button onClick={() => ms.clearOverride(def.id)} className="rounded border border-gray-700 px-2 py-1 hover:bg-gray-800">Reset</button>}
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4">
          <Toggle label="Update-page card" checked={!!ov?.updateCardEnabled} onChange={(v) => ms.patchOverride(def.id, { updateCardEnabled: v })} />
          <Toggle label="Dedicated page" checked={!!ov?.dedicatedPageEnabled} onChange={(v) => ms.patchOverride(def.id, { dedicatedPageEnabled: v })} />
          <Toggle label="noindex" checked={!!ov?.noindex} onChange={(v) => ms.patchOverride(def.id, { noindex: v })} />
        </div>

        {/* Attest / override value */}
        <label className="block">
          <span className="text-gray-300">Verify / override current value</span>
          <input type="number" defaultValue={ov?.verifiedValueOverride ?? ''} placeholder={e.currentValue != null ? String(e.currentValue) : 'admin-entered'}
            onBlur={(ev) => { const v = ev.target.value.trim(); ms.patchOverride(def.id, { verifiedValueOverride: v === '' ? undefined : Number(v) }, { action: 'milestone.attest', entityType: 'milestone', entityId: def.id, summary: `Attested ${def.title} = ${v || 'cleared'}` }); }}
            className="mt-1 w-40 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200" />
          {e.dataSource === 'needs_data_source' && <span className="ml-2 text-amber-300">Needs a data source — verify manually or connect one.</span>}
        </label>

        {/* Generated content preview */}
        <details className="rounded border border-gray-800 bg-gray-900 p-2">
          <summary className="cursor-pointer text-gray-300">Preview generated page content {thin && <span className="text-amber-300">(thin — &lt;5 internal links)</span>}</summary>
          <div className="mt-2 space-y-1.5">
            <p><span className="text-gray-500">SEO title:</span> {content.seoTitle}</p>
            <p><span className="text-gray-500">Meta:</span> {content.metaDescription}</p>
            <p><span className="text-gray-500">Educational:</span> {content.educationalContext}</p>
            <p><span className="text-gray-500">Internal links ({content.internalLinkSuggestions.length}):</span> {content.internalLinkSuggestions.map((l) => l.label).join(', ')}</p>
            <p><span className="text-gray-500">FAQs:</span> {content.faqs.length}</p>
          </div>
        </details>

        {/* Authority breakdown */}
        <details className="rounded border border-gray-800 bg-gray-900 p-2">
          <summary className="cursor-pointer text-gray-300">Authority Impact breakdown ({e.authority.value})</summary>
          <ul className="mt-1 space-y-0.5">{e.authority.factors.map((f, i) => <li key={i} className="flex justify-between"><span>{f.label}</span><span className={f.delta < 0 ? 'text-red-300' : 'text-emerald-300'}>{f.delta > 0 ? '+' : ''}{f.delta}</span></li>)}</ul>
        </details>
      </div>
    </details>
  );
}

// ── Published ────────────────────────────────────────────────────────────────
function PublishedTab({ evaluated, ms }: { evaluated: EvaluatedMilestone[]; ms: ReturnType<typeof useMilestones> }) {
  const [copied, setCopied] = useState(false);
  // Eligible to publish = earned + approved + dedicated-page enabled.
  const eligible = evaluated.filter((e) => {
    const ov = ms.overrides[e.definition.id];
    return e.status === 'earned' && ov?.status === 'approved' && ov?.dedicatedPageEnabled && !PUBLISHED_SLUGS.has(e.definition.slug);
  });
  const exportText = buildPublishedExport(
    eligible.map((e) => ({
      slug: e.definition.slug,
      definitionId: e.definition.id,
      verifiedMetric: e.currentValue != null ? `${e.currentValue} ${e.definition.trigger.type.replace(/_/g, ' ')}` : e.definition.pageAngle,
      achievedAt: new Date().toISOString().slice(0, 10),
      noindex: !!ms.overrides[e.definition.id]?.noindex,
    })),
  );

  function copy() {
    try { navigator.clipboard?.writeText(exportText); setCopied(true); ms.recordAudit({ action: 'milestone.export', entityType: 'milestone', summary: `Exported ${eligible.length} approved milestone(s)` }); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      <Panel title={`Live public pages (${PUBLISHED_MILESTONES.length})`} hint="Committed in content/milestones/published.ts — these have a page at /milestones/<slug> and are in the sitemap.">
        <ul className="space-y-1.5">
          {PUBLISHED_MILESTONES.map((p) => (
            <li key={p.slug} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2 text-xs">
              <a href={`/milestones/${p.slug}`} className="text-emerald-300 hover:underline">/milestones/{p.slug}</a>
              <span className="text-gray-500">{p.verifiedMetric}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={`Ready to publish (${eligible.length})`} hint="Earned + approved + dedicated-page enabled, not yet committed. Export and commit to publish."
        actions={eligible.length > 0 ? <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-medium text-gray-950 hover:bg-emerald-400">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Export approved'}</button> : undefined}>
        {eligible.length === 0 ? (
          <p className="text-xs text-gray-500">Nothing waiting. Approve an earned milestone and enable its dedicated page in Definitions, then export here.</p>
        ) : (
          <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-black/40 p-3 text-[11px] text-gray-300">{exportText}</pre>
        )}
      </Panel>
    </div>
  );
}

// ── Recommendations ──────────────────────────────────────────────────────────
function RecommendationsTab({ evaluated }: { evaluated: EvaluatedMilestone[] }) {
  const earnedUnpublished = evaluated.filter((e) => e.status === 'earned' && !PUBLISHED_SLUGS.has(e.definition.slug) && e.authority.band !== 'do_not_publish')
    .sort((a, b) => b.authority.value - a.authority.value);
  const close = evaluated.filter((e) => e.status === 'in_progress' && (e.progressPct ?? 0) >= 70);
  const needsData = evaluated.filter((e) => e.status === 'needs_data_source');

  const recs: { title: string; tone: string; detail: string }[] = [];
  if (earnedUnpublished.length > 0) recs.push({ title: `${earnedUnpublished.length} earned milestone(s) eligible to publish`, tone: 'emerald', detail: earnedUnpublished.slice(0, 5).map((e) => e.definition.title).join('; ') });
  if (close.length > 0) recs.push({ title: `${close.length} milestone(s) close to earning (≥70%)`, tone: 'amber', detail: close.slice(0, 5).map((e) => `${e.definition.title} (${e.progressPct}%)`).join('; ') });
  if (needsData.length > 0) recs.push({ title: `${needsData.length} milestone(s) need a data source`, tone: 'gray', detail: 'Connect analytics / Search Console / backlink data, or verify these manually. They will never auto-publish.' });

  return (
    <div className="space-y-3">
      {recs.length === 0 && <p className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Nothing to recommend right now.</p>}
      {recs.map((r, i) => (
        <div key={i} className={`rounded-xl border p-4 ${r.tone === 'emerald' ? 'border-emerald-500/40 bg-emerald-500/5' : r.tone === 'amber' ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-800 bg-gray-900'}`}>
          <p className="text-sm font-semibold text-gray-100">{r.title}</p>
          <p className="mt-1 text-xs text-gray-400">{r.detail}</p>
        </div>
      ))}
      <Panel title="Top publish candidates by Authority Impact" hint="Earned, not yet published, ranked by authority value.">
        {earnedUnpublished.length === 0 ? <p className="text-xs text-gray-500">None right now.</p> : (
          <ul className="space-y-1.5">
            {earnedUnpublished.slice(0, 10).map((e) => (
              <li key={e.definition.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2 text-sm">
                <span className="text-gray-200">{e.definition.title}</span>
                <AuthorityPill band={e.authority.band} value={e.authority.value} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ── Audit ────────────────────────────────────────────────────────────────────
function AuditTab({ ms }: { ms: ReturnType<typeof useMilestones> }) {
  return (
    <Panel title={`Audit log (${ms.auditLog.length})`} hint="Every Milestone Center action, saved locally and redacted."
      actions={ms.auditLog.length > 0 ? <button onClick={ms.clearAudit} className="text-xs text-gray-400 underline hover:text-gray-200">Clear</button> : undefined}>
      {ms.auditLog.length === 0 ? (
        <p className="text-xs text-gray-500">No actions yet. Approving, attesting or exporting will appear here.</p>
      ) : (
        <ul className="space-y-1.5">
          {ms.auditLog.slice(0, 100).map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950 p-2 text-xs">
              <div className="min-w-0"><p className="text-gray-300">{a.summary}</p><p className="text-[10px] text-gray-600">{a.action} · {a.actor}</p></div>
              <time className="shrink-0 text-[10px] text-gray-600">{new Date(a.at).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-gray-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-700 bg-gray-950" />
      {label}
    </label>
  );
}
