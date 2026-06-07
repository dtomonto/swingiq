'use client';

// ============================================================
// SwingVantage — Admin: Video Studio Cockpit
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The control room for the AI video department. Tabs:
//     • Opportunities — what the scanner found, ranked; approve/reject and
//       generate a brief.
//     • Pipeline — review the brief (the approval panel), generate the
//       video, preview it, publish it, and place it.
//     • Library — every generated video; publish/unpublish, set lifecycle.
//     • Queue — generation jobs and their status/history.
//     • Reassess — run the reassessment engine and read its recommendations
//       (the performance view).
//     • Settings — providers (what's connected), the spend budget, storage.
//
//   Every action calls /api/video-studio/* (admin-guarded, rate-limited).
//   It's honest about storage: a banner shows when nothing is durably saved
//   (no Supabase) so you know in-memory state resets on redeploy.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import {
  Radar,
  Clapperboard,
  Library,
  ListChecks,
  RefreshCw,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  VideoOpportunity,
  VideoCreativeBrief,
  VideoGenerationJob,
  VideoAsset,
  StudioPlacement,
  VideoReassessment,
  VideoProviderConfig,
  RiskLevel,
} from '@/lib/video-studio/types';

interface InitialData {
  opportunities: VideoOpportunity[];
  providers: VideoProviderConfig[];
  budgetCents: number;
  storage: { persistent: boolean; label: string };
}

type Tab = 'opportunities' | 'pipeline' | 'library' | 'queue' | 'reassess' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof Radar }[] = [
  { id: 'opportunities', label: 'Opportunities', icon: Radar },
  { id: 'pipeline', label: 'Pipeline', icon: Clapperboard },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'queue', label: 'Queue', icon: ListChecks },
  { id: 'reassess', label: 'Reassess', icon: RefreshCw },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/video-studio/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

const RISK_BADGE: Record<RiskLevel, string> = {
  low: 'bg-success/15 text-success',
  medium: 'bg-warning/15 text-warning',
  high: 'bg-error/15 text-error',
};

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', className)}>
      {children}
    </span>
  );
}

export function VideoStudioCockpit({ initial }: { initial: InitialData }) {
  const [tab, setTab] = useState<Tab>('opportunities');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [opportunities, setOpportunities] = useState(initial.opportunities);
  const [jobs, setJobs] = useState<VideoGenerationJob[]>([]);
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [placements, setPlacements] = useState<StudioPlacement[]>([]);
  const [reassessments, setReassessments] = useState<VideoReassessment[]>([]);
  const [activeBrief, setActiveBrief] = useState<VideoCreativeBrief | null>(null);
  const [activeAsset, setActiveAsset] = useState<VideoAsset | null>(null);

  const run = useCallback(async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }, []);

  // Load list data when a tab opens. setState happens only after await, so it
  // never fires synchronously in the effect body (no cascading renders).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (tab === 'queue') {
          const d = await api<{ jobs: VideoGenerationJob[] }>('jobs');
          if (!cancelled) setJobs(d.jobs);
        } else if (tab === 'reassess') {
          const d = await api<{ reassessments: VideoReassessment[] }>('reassess');
          if (!cancelled) setReassessments(d.reassessments);
        } else if (tab === 'library') {
          const [a, p] = await Promise.all([
            api<{ assets: VideoAsset[] }>('assets'),
            api<{ placements: StudioPlacement[] }>('placements'),
          ]);
          if (cancelled) return;
          setAssets((prev) => {
            const byId = new Map(prev.map((x) => [x.id, x]));
            for (const x of a.assets) byId.set(x.id, x);
            return [...byId.values()];
          });
          setPlacements(p.placements);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const rescan = () =>
    run('scan', async () => {
      const data = await api<{ opportunities: VideoOpportunity[] }>('scan', { method: 'POST' });
      setOpportunities(data.opportunities);
    });

  const decide = (o: VideoOpportunity, decision: 'approve' | 'reject') =>
    run(`decide:${o.id}`, async () => {
      await api('opportunities', { method: 'PATCH', body: JSON.stringify({ opportunityId: o.id, decision }) });
      setOpportunities((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: decision === 'approve' ? 'approved' : 'rejected' } : x)));
    });

  const genBrief = (o: VideoOpportunity) =>
    run(`brief:${o.id}`, async () => {
      const { brief } = await api<{ brief: VideoCreativeBrief }>('brief', { method: 'POST', body: JSON.stringify({ opportunityId: o.id }) });
      setActiveBrief(brief);
      setActiveAsset(null);
      setTab('pipeline');
    });

  const genVideo = (brief: VideoCreativeBrief) =>
    run(`job:${brief.id}`, async () => {
      const { asset } = await api<{ job: VideoGenerationJob; asset?: VideoAsset }>('jobs', { method: 'POST', body: JSON.stringify({ briefId: brief.id }) });
      if (asset) {
        setActiveAsset(asset);
        setAssets((prev) => [asset, ...prev.filter((a) => a.id !== asset.id)]);
      }
    });

  const publish = (asset: VideoAsset, published: boolean) =>
    run(`pub:${asset.id}`, async () => {
      const { asset: updated } = await api<{ asset: VideoAsset }>('publish', { method: 'POST', body: JSON.stringify({ assetId: asset.id, published }) });
      setActiveAsset((a) => (a && a.id === updated.id ? updated : a));
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    });

  const assignPlacement = (asset: VideoAsset) =>
    run(`place:${asset.id}`, async () => {
      const opp = opportunities.find((o) => o.id === asset.opportunityId);
      await api('placements', {
        method: 'POST',
        body: JSON.stringify({
          assetId: asset.id,
          surfaceId: opp?.surfaceId ?? 'home-hero',
          display: opp?.suggestedPlacement ?? 'inline',
          trigger: 'click-to-play',
          cta: opp?.suggestedCta ?? 'See how it works',
          audience: opp?.audience ?? 'all',
          sport: opp?.sport ?? 'all',
          enabled: true,
          priority: Math.round(opp?.priorityScore ?? 50),
        }),
      });
      const p = await api<{ placements: StudioPlacement[] }>('placements');
      setPlacements(p.placements);
    });

  const runReassess = () =>
    run('reassess', async () => {
      const { reassessments: r } = await api<{ reassessments: VideoReassessment[] }>('reassess', { method: 'POST', body: JSON.stringify({}) });
      setReassessments(r);
    });

  const providerSummary = `${initial.providers.filter((p) => p.configured).length}/${initial.providers.length} providers`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-gray-100">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles size={20} className="text-emerald-400" /> Video Studio
          </h1>
          <p className="text-sm text-gray-400">The intelligent video department — scan, generate, place, measure, improve.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-800 text-gray-300">{providerSummary}</Badge>
          <Badge className="bg-gray-800 text-gray-300">budget {(initial.budgetCents / 100).toFixed(2)}$/job</Badge>
          <button
            onClick={rescan}
            disabled={busy === 'scan'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy === 'scan' ? <Loader2 size={15} className="animate-spin" /> : <Radar size={15} />} Re-scan
          </button>
        </div>
      </div>

      {/* Honest storage banner */}
      {!initial.storage.persistent && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <Database size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>In-memory mode.</strong> {initial.storage.label}. Approvals, briefs, and generated videos work, but reset on
            redeploy until you apply <code className="rounded bg-black/30 px-1">supabase-video-studio.sql</code> and set the
            service-role key.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-800">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                tab === t.id ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-gray-400 hover:text-gray-200',
              )}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'opportunities' && (
        <OpportunitiesPanel
          opportunities={opportunities}
          busy={busy}
          onApprove={(o) => decide(o, 'approve')}
          onReject={(o) => decide(o, 'reject')}
          onBrief={genBrief}
        />
      )}

      {tab === 'pipeline' && (
        <PipelinePanel
          brief={activeBrief}
          asset={activeAsset}
          busy={busy}
          onGenerate={genVideo}
          onPublish={publish}
          onAssign={assignPlacement}
        />
      )}

      {tab === 'library' && <LibraryPanel assets={assets} placements={placements} busy={busy} onPublish={publish} onAssign={assignPlacement} />}

      {tab === 'queue' && <QueuePanel jobs={jobs} />}

      {tab === 'reassess' && <ReassessPanel reassessments={reassessments} busy={busy} onRun={runReassess} />}

      {tab === 'settings' && <SettingsPanel providers={initial.providers} budgetCents={initial.budgetCents} storage={initial.storage} />}
    </div>
  );
}

// ── Opportunities (with the approval panel) ───────────────────

function PriorityBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-800">
      <div className="h-full bg-emerald-400" style={{ width: `${value}%` }} />
    </div>
  );
}

function OpportunitiesPanel({
  opportunities,
  busy,
  onApprove,
  onReject,
  onBrief,
}: {
  opportunities: VideoOpportunity[];
  busy: string | null;
  onApprove: (o: VideoOpportunity) => void;
  onReject: (o: VideoOpportunity) => void;
  onBrief: (o: VideoOpportunity) => void;
}) {
  const [hideCovered, setHideCovered] = useState(false);
  const list = hideCovered ? opportunities.filter((o) => !o.alreadyCovered) : opportunities;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-gray-400">
        <input type="checkbox" checked={hideCovered} onChange={(e) => setHideCovered(e.target.checked)} />
        Hide surfaces already covered by a tutorial video
      </label>
      {list.map((o) => (
        <div key={o.id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-100">{o.businessRationale.split(':')[0]}</h3>
                <Badge className="bg-gray-800 text-gray-300">{o.recommendedType.replace(/_/g, ' ')}</Badge>
                <Badge className={RISK_BADGE[o.riskLevel]}>{o.riskLevel} risk</Badge>
                {o.requiresApproval ? (
                  <Badge className="bg-amber-500/15 text-amber-300">needs approval</Badge>
                ) : (
                  <Badge className="bg-success/15 text-success">auto-eligible</Badge>
                )}
                {o.alreadyCovered && <Badge className="bg-gray-800 text-gray-400">covered</Badge>}
                <Badge className="bg-gray-800 text-gray-400">{o.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {o.page} · {o.zone}
              </p>
              <p className="mt-1 text-sm text-gray-300">{o.estimatedImpact}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">priority</span>
                <PriorityBar value={o.priorityScore} />
                <span className="w-7 text-sm font-bold text-emerald-300">{o.priorityScore}</span>
              </div>
              <span className="text-xs text-gray-500">confidence {o.confidence} · ~{o.suggestedLengthSec}s · {o.suggestedStyle.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => onApprove(o)}
              disabled={busy === `decide:${o.id}` || o.status === 'approved'}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-gray-700 disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Approve
            </button>
            <button
              onClick={() => onReject(o)}
              disabled={busy === `decide:${o.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-gray-700 disabled:opacity-50"
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              onClick={() => onBrief(o)}
              disabled={busy === `brief:${o.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy === `brief:${o.id}` ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />} Generate brief
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pipeline (brief review → generate → preview → publish → place) ──

function PipelinePanel({
  brief,
  asset,
  busy,
  onGenerate,
  onPublish,
  onAssign,
}: {
  brief: VideoCreativeBrief | null;
  asset: VideoAsset | null;
  busy: string | null;
  onGenerate: (b: VideoCreativeBrief) => void;
  onPublish: (a: VideoAsset, published: boolean) => void;
  onAssign: (a: VideoAsset) => void;
}) {
  if (!brief) {
    return <p className="text-sm text-gray-400">Pick an opportunity and click “Generate brief” to start the pipeline.</p>;
  }
  const blockers = brief.complianceNotes.filter((n) => n.startsWith('[block]'));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Brief / approval panel */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <h3 className="font-semibold text-gray-100">{brief.seo.title}</h3>
        <p className="mt-1 text-sm text-gray-400">{brief.objective}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>Style: <span className="text-gray-200">{brief.visualStyle.replace(/_/g, ' ')}</span></div>
          <div>Length: <span className="text-gray-200">{brief.durationTargetSec}s</span></div>
          <div>Aspect: <span className="text-gray-200">{brief.aspectRatio}</span></div>
          <div>CTA: <span className="text-gray-200">{brief.cta}</span></div>
        </dl>

        <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">Script</h4>
        <ol className="mt-1 space-y-1 text-sm text-gray-300">
          {brief.script.map((l, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gray-600">{i + 1}.</span> {l}
            </li>
          ))}
        </ol>

        {brief.complianceNotes.length > 0 && (
          <div className={cn('mt-4 rounded-lg border p-2 text-xs', blockers.length ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-gray-700 bg-gray-800/50 text-gray-300')}>
            <p className="font-semibold">Compliance / guardrails</p>
            <ul className="mt-1 list-disc pl-4">
              {brief.complianceNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => onGenerate(brief)}
          disabled={busy === `job:${brief.id}` || blockers.length > 0}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          title={blockers.length ? 'Resolve blocking guardrails first' : undefined}
        >
          {busy === `job:${brief.id}` ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Generate video
        </button>
      </div>

      {/* Admin preview + publish/place */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <h3 className="font-semibold text-gray-100">Preview & publish</h3>
        {!asset ? (
          <p className="mt-2 text-sm text-gray-400">Generate the video to preview it here.</p>
        ) : (
          <AdminPreview asset={asset} busy={busy} onPublish={onPublish} onAssign={onAssign} />
        )}
      </div>
    </div>
  );
}

function AdminPreview({
  asset,
  busy,
  onPublish,
  onAssign,
}: {
  asset: VideoAsset;
  busy: string | null;
  onPublish: (a: VideoAsset, published: boolean) => void;
  onAssign: (a: VideoAsset) => void;
}) {
  return (
    <div className="mt-2 space-y-3">
      <div className="overflow-hidden rounded-lg border border-gray-800">
        {asset.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.poster} alt={asset.title} loading="lazy" className="aspect-video w-full object-cover" />
        ) : (
          <div className="aspect-video w-full bg-gray-800" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <Badge className={asset.published ? 'bg-success/15 text-success' : 'bg-gray-800 text-gray-400'}>
          {asset.published ? 'published' : 'draft'}
        </Badge>
        <Badge className="bg-gray-800 text-gray-400">{asset.lifecycle}</Badge>
        {asset.isPlaceholder && <Badge className="bg-amber-500/15 text-amber-300">placeholder footage</Badge>}
        <span>{asset.durationSec}s · {asset.aspectRatio} · {asset.captions.length} caption track(s)</span>
      </div>
      <details className="rounded-lg border border-gray-800 bg-gray-800/40 p-2 text-xs text-gray-300">
        <summary className="cursor-pointer font-medium text-gray-200">Transcript</summary>
        <pre className="mt-2 whitespace-pre-wrap font-sans">{asset.transcript}</pre>
      </details>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onPublish(asset, !asset.published)}
          disabled={busy === `pub:${asset.id}`}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {asset.published ? 'Unpublish' : 'Publish'}
        </button>
        <button
          onClick={() => onAssign(asset)}
          disabled={busy === `place:${asset.id}`}
          className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          Assign to placement
        </button>
      </div>
    </div>
  );
}

// ── Library ───────────────────────────────────────────────────

function LibraryPanel({
  assets,
  placements,
  busy,
  onPublish,
  onAssign,
}: {
  assets: VideoAsset[];
  placements: StudioPlacement[];
  busy: string | null;
  onPublish: (a: VideoAsset, published: boolean) => void;
  onAssign: (a: VideoAsset) => void;
}) {
  if (assets.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No generated videos in this session yet. Generate one from the Pipeline tab. (Library is hydrated from the current
        session + repo; connect Supabase to keep a durable library.)
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((a) => {
        const placed = placements.filter((p) => p.assetId === a.id);
        return (
          <div key={a.id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
            {a.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.poster} alt={a.title} loading="lazy" className="aspect-video w-full rounded-lg object-cover" />
            ) : (
              <div className="aspect-video w-full rounded-lg bg-gray-800" />
            )}
            <h3 className="mt-2 truncate text-sm font-semibold text-gray-100">{a.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge className={a.published ? 'bg-success/15 text-success' : 'bg-gray-800 text-gray-400'}>{a.published ? 'published' : 'draft'}</Badge>
              <Badge className="bg-gray-800 text-gray-400">{a.lifecycle}</Badge>
              {placed.length > 0 && <Badge className="bg-gray-800 text-gray-400">{placed.length} placement(s)</Badge>}
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => onPublish(a, !a.published)} disabled={busy === `pub:${a.id}`} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {a.published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => onAssign(a)} disabled={busy === `place:${a.id}`} className="rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-50">
                Place
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Queue ─────────────────────────────────────────────────────

function QueuePanel({ jobs }: { jobs: VideoGenerationJob[] }) {
  if (jobs.length === 0) return <p className="text-sm text-gray-400">No generation jobs yet.</p>;
  return (
    <div className="space-y-2">
      {jobs.map((j) => (
        <div key={j.id} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs text-gray-400">{j.id}</span>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-800 text-gray-300">{j.providerId}</Badge>
              <Badge
                className={cn(
                  j.status === 'completed' ? 'bg-success/15 text-success' : j.status === 'failed' ? 'bg-error/15 text-error' : 'bg-amber-500/15 text-amber-300',
                )}
              >
                {j.status}
              </Badge>
              <span className="text-xs text-gray-500">{j.attempts}/{j.maxAttempts} · {j.estimatedCostCents}¢</span>
            </div>
          </div>
          {j.history.length > 0 && <p className="mt-1 text-xs text-gray-500">{j.history[j.history.length - 1].message}</p>}
          {j.error && <p className="mt-1 text-xs text-red-300">{j.error}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Reassess (performance) ────────────────────────────────────

function ReassessPanel({
  reassessments,
  busy,
  onRun,
}: {
  reassessments: VideoReassessment[];
  busy: string | null;
  onRun: () => void;
}) {
  return (
    <div className="space-y-3">
      <button onClick={onRun} disabled={busy === 'reassess'} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
        {busy === 'reassess' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Run reassessment now
      </button>
      {reassessments.length === 0 ? (
        <p className="text-sm text-gray-400">No reassessments yet. Publish a video, then run a reassessment (it’s also schedulable via /api/video-studio/reassess with CRON_SECRET).</p>
      ) : (
        reassessments.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-gray-400">{r.assetId}</span>
              <Badge className="bg-emerald-500/15 text-emerald-300">{r.primaryAction.replace(/_/g, ' ')}</Badge>
              {r.requiresHuman && <Badge className="bg-amber-500/15 text-amber-300">human review</Badge>}
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-300">
              {r.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-8 text-right text-xs font-bold text-emerald-300">{rec.weight}</span>
                  <span className="text-gray-400">{rec.action.replace(/_/g, ' ')}:</span> {rec.rationale}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────

function SettingsPanel({
  providers,
  budgetCents,
  storage,
}: {
  providers: VideoProviderConfig[];
  budgetCents: number;
  storage: { persistent: boolean; label: string };
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <h3 className="font-semibold text-gray-100">Storage</h3>
        <p className="mt-1 text-sm text-gray-400">{storage.label}</p>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <h3 className="font-semibold text-gray-100">Spend guardrail</h3>
        <p className="mt-1 text-sm text-gray-400">
          Max per job: <span className="text-gray-200">{(budgetCents / 100).toFixed(2)}$</span>. Default is $0 (free mock only).
          Raise <code className="rounded bg-black/30 px-1">VIDEO_STUDIO_MAX_COST_CENTS</code> to allow paid providers.
        </p>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <h3 className="mb-2 font-semibold text-gray-100">Providers</h3>
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-800/40 px-3 py-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-100">{p.label}</span>
                  <Badge className={p.configured ? 'bg-success/15 text-success' : 'bg-gray-700 text-gray-400'}>{p.configured ? 'configured' : 'not set'}</Badge>
                  {p.enabled && <Badge className="bg-emerald-500/15 text-emerald-300">implemented</Badge>}
                </div>
                <p className="text-xs text-gray-500">{p.note}</p>
                {p.requiredEnv.length > 0 && <p className="mt-0.5 text-[11px] text-gray-600">env: {p.requiredEnv.join(', ')}</p>}
              </div>
              <span className="text-xs text-gray-500">{p.capabilities.join(' · ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
