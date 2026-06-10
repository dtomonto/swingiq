'use client';

// ============================================================
// PublishingOS — command center client shell
// ------------------------------------------------------------
// Renders the REAL publish queue, publishable-areas audit and activity feed,
// under a live-switchable design direction (skin). Publish toggles call the
// guarded /api/admin/updates route, which persists durably in production — so
// every control here is functional, never a fake state flip. High/critical-risk
// actions route through an explicit confirmation modal.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  Rocket, ShieldAlert, Database, HardDrive, CloudOff, ExternalLink, Filter,
  CheckCircle2, AlertTriangle, History, Map, ListChecks, LayoutDashboard, X,
} from 'lucide-react';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { getPublishingDirection, setPublishingDirection } from '@/lib/admin/publishing-prefs';
import { DIRECTIONS, DEFAULT_DIRECTION, getDirection, type DirectionId } from './directions';
import { PublishDetailDrawer } from './PublishDetailDrawer';
import { entityKey } from '@/lib/publishing/detail';
import type { PublishingOSData, QueueItem } from '@/lib/publishing/admin-data.server';
import type { PublishableArea } from '@/lib/publishing/entity-registry';
import type { RiskLevel, PublishMode } from '@/lib/publishing/types';

type View = 'overview' | 'queue' | 'areas' | 'activity';

const RISK_TONE: Record<RiskLevel, string> = {
  low: 'bg-gray-800 text-gray-300 border-gray-700',
  medium: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  high: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  critical: 'bg-red-500/10 text-red-300 border-red-500/30',
};

const MODE_LABEL: Record<PublishMode, string> = {
  instant: 'Instant',
  deploy_backed: 'Requires deploy',
  hybrid: 'Hybrid',
};
const MODE_TONE: Record<PublishMode, string> = {
  instant: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  deploy_backed: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  hybrid: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
};

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

export function PublishingOSClient({ data, actor }: { data: PublishingOSData; actor: string }) {
  // Start from the default (so the server render and first client render match —
  // no hydration mismatch), then adopt the operator's persisted choice after
  // mount. Changing the direction persists it device-locally so it sticks.
  const [directionId, setDirectionId] = useState<DirectionId>(DEFAULT_DIRECTION);
  useEffect(() => {
    // Adopt the persisted choice AFTER mount: the first render must match the
    // server (DEFAULT_DIRECTION) to avoid a hydration mismatch, so reading
    // localStorage and updating state here is intentional, not an anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirectionId(getPublishingDirection());
  }, []);
  function changeDirection(id: DirectionId) {
    setDirectionId(id);
    setPublishingDirection(id);
  }
  const [view, setView] = useState<View>('overview');
  const [queue, setQueue] = useState<QueueItem[]>(data.queue);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<QueueItem | null>(null);
  // The drawer tracks an item by identity (kind+id) and re-reads the LIVE row
  // from `queue`, so its publish/draft state stays in sync after a toggle.
  const [detailRef, setDetailRef] = useState<{ kind: QueueItem['kind']; id: string } | null>(null);
  const detailItem = detailRef ? queue.find((q) => q.kind === detailRef.kind && q.id === detailRef.id) ?? null : null;

  const skin = getDirection(directionId);

  async function doToggle(item: QueueItem, riskAcknowledged: boolean) {
    const next = !item.published;
    setBusy(item.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/updates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: item.kind, id: item.id, action: next ? 'publish' : 'unpublish', riskAcknowledged }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.message || body?.error || 'Could not save the change.');
        return;
      }
      setQueue((q) => q.map((r) => (r.id === item.id && r.kind === item.kind ? { ...r, published: next } : r)));
      const where = body.mode === 'instant-db' ? (body.persistent ? 'live (durable)' : 'live (this session)') : 'live (git diff)';
      setNotice(`${next ? 'Published' : 'Unpublished'} “${item.title}” — ${where}.`);
      recordAudit({
        actor,
        action: 'publishingos.toggle',
        entityType: item.entityType,
        entityId: `${item.kind}:${item.id}`,
        summary: `${next ? 'Published' : 'Unpublished'} ${item.entityType} “${item.title}” via PublishingOS`,
        severity: next ? 'info' : 'warning',
      });
    } catch {
      setError('Network error — the change was not saved.');
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  function onToggle(item: QueueItem) {
    if (busy) return;
    const publishing = !item.published;
    // High/critical risk publishes require explicit confirmation.
    if (publishing && (item.risk === 'high' || item.risk === 'critical')) {
      setConfirm(item);
      return;
    }
    doToggle(item, false);
  }

  return (
    <div className={`min-h-screen ${skin.page}`}>
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6">
        <Header skin={skin} directionId={directionId} onDirection={changeDirection} env={data.environment} persistent={data.persistent} />

        <EnvironmentBanner env={data.environment} persistent={data.persistent} skin={skin} />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <p>{error}</p>
          </div>
        )}
        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> <p>{notice}</p>
          </div>
        )}

        <ViewTabs view={view} onView={setView} skin={skin} />

        {view === 'overview' && <Overview data={data} skin={skin} onJump={setView} />}
        {view === 'queue' && (
          <PublishQueue queue={queue} skin={skin} busy={busy} onToggle={onToggle} onOpen={(i) => setDetailRef({ kind: i.kind, id: i.id })} />
        )}
        {view === 'areas' && <AreasAudit areas={data.areas} summary={data.areasSummary} skin={skin} />}
        {view === 'activity' && <Activity data={data} skin={skin} />}
      </div>

      {detailItem && (
        <PublishDetailDrawer
          item={detailItem}
          entity={data.entities[entityKey(detailItem.entityType, detailItem.id)]}
          events={data.eventsByEntity[entityKey(detailItem.entityType, detailItem.id)] ?? []}
          queue={queue}
          busy={busy}
          onToggle={onToggle}
          onClose={() => setDetailRef(null)}
        />
      )}

      {confirm && (
        <ConfirmModal item={confirm} onCancel={() => setConfirm(null)} onConfirm={() => doToggle(confirm, true)} />
      )}
    </div>
  );
}

// ── Header + direction switcher ───────────────────────────────────────────
function Header({
  skin, directionId, onDirection, env, persistent,
}: {
  skin: ReturnType<typeof getDirection>;
  directionId: DirectionId;
  onDirection: (id: DirectionId) => void;
  env: PublishingOSData['environment'];
  persistent: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 -mx-4 -mt-4 mb-1 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center ${skin.radius} bg-white/5 ${skin.accentText}`}>
          <Rocket className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">PublishingOS</h1>
          <p className="text-xs text-gray-400">Turn admin decisions into safe, live product changes.</p>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <EnvChip env={env} persistent={persistent} />
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1" role="tablist" aria-label="Design direction">
          {DIRECTIONS.map((d) => {
            const active = d.id === directionId;
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onDirection(d.id)}
                title={d.blurb}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${active ? skin.tabActive : skin.tabIdle}`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </div>
      <p className="w-full text-xs text-gray-500">
        <span className={skin.accentText}>{skin.name}.</span> {skin.blurb}
      </p>
    </header>
  );
}

function EnvChip({ env, persistent }: { env: PublishingOSData['environment']; persistent: boolean }) {
  if (env === 'local-file') {
    return <Pill className="bg-sky-500/10 text-sky-300 border-sky-500/30"><HardDrive className="h-3 w-3" /> Local · file-backed</Pill>;
  }
  if (env === 'durable-db' || persistent) {
    return <Pill className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30"><Database className="h-3 w-3" /> Durable · DB-backed</Pill>;
  }
  return <Pill className="bg-amber-500/10 text-amber-300 border-amber-500/30"><CloudOff className="h-3 w-3" /> Ephemeral · this session</Pill>;
}

// ── Environment banner (replaces the "view-only" dead end) ────────────────
function EnvironmentBanner({
  env, persistent, skin,
}: { env: PublishingOSData['environment']; persistent: boolean; skin: ReturnType<typeof getDirection> }) {
  if (env === 'local-file') {
    return (
      <Banner
        tone="sky"
        icon={<HardDrive className="h-4 w-4" />}
        skin={skin}
        lead="Local environment — file-backed publishing."
        body="Toggles write a versioned data file (a reviewable git diff). Commit & push to ship, or configure Supabase to publish instantly in production. Either way, nothing here dead-ends."
      />
    );
  }
  if (env === 'durable-db' || persistent) {
    return (
      <Banner
        tone="emerald"
        icon={<Database className="h-4 w-4" />}
        skin={skin}
        lead="Production — durable publishing is live."
        body="Publishing writes a durable override in the database and revalidates the affected route. Changes go live immediately. No commit, push or redeploy required."
      />
    );
  }
  return (
    <Banner
      tone="amber"
      icon={<ShieldAlert className="h-4 w-4" />}
      skin={skin}
      lead="Publishing works, but is not yet durable here."
      body="Supabase is not configured, so decisions persist only for this server session. Run apps/web/supabase-publishing.sql and set SUPABASE_SERVICE_ROLE_KEY to make production publishing durable."
    />
  );
}

// `lead` + `body` are explicit strings (not JSX whitespace) so server and client
// render byte-identical text — no hydration mismatch around the bold lead-in.
function Banner({
  tone, icon, skin, lead, body,
}: {
  tone: 'sky' | 'emerald' | 'amber';
  icon: React.ReactNode;
  skin: ReturnType<typeof getDirection>;
  lead: string;
  body: string;
}) {
  const tones = {
    sky: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  } as const;
  return (
    <div className={`flex items-start gap-3 ${skin.radius} border p-4 text-sm ${tones[tone]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="leading-relaxed">
        <strong className="font-semibold">{lead}</strong>{' '}{body}
      </p>
    </div>
  );
}

// ── View tabs ─────────────────────────────────────────────────────────────
function ViewTabs({ view, onView, skin }: { view: View; onView: (v: View) => void; skin: ReturnType<typeof getDirection> }) {
  const tabs: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'queue', label: 'Publish Queue', icon: <ListChecks className="h-4 w-4" /> },
    { id: 'areas', label: 'Publishable Areas', icon: <Map className="h-4 w-4" /> },
    { id: 'activity', label: 'Activity', icon: <History className="h-4 w-4" /> },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="PublishingOS views">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={view === t.id}
          onClick={() => onView(t.id)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${view === t.id ? skin.tabActive : skin.tabIdle}`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────
function Overview({ data, skin, onJump }: { data: PublishingOSData; skin: ReturnType<typeof getDirection>; onJump: (v: View) => void }) {
  const s = data.stats;
  const tiles = [
    { label: 'Live', value: s.live, hint: 'Currently public' },
    { label: 'Drafts', value: s.drafts, hint: 'Awaiting publish' },
    { label: 'High-risk', value: s.highRisk, hint: 'Need explicit confirm' },
    { label: 'Published (session)', value: s.recentlyPublished, hint: 'Recent publish events' },
    { label: 'Failed', value: s.failed, hint: 'Publish failures' },
    { label: 'Areas tracked', value: data.areasSummary.total, hint: `${data.areasSummary.liveConnected} live-connected` },
  ];
  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6`}>
        {tiles.map((t) => (
          <div key={t.label} className={`${skin.stat} p-4`}>
            <p className={skin.statValue}>{t.value}</p>
            <p className="mt-1 text-xs font-medium text-gray-300">{t.label}</p>
            <p className="text-[11px] text-gray-500">{t.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${skin.card} p-5`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={skin.heading}>What needs me</h2>
            <button onClick={() => onJump('queue')} className={`text-xs ${skin.accentText} hover:underline`}>Open queue →</button>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between"><span className="text-gray-300">Drafts ready to review</span><span className="tabular-nums text-gray-100">{s.drafts}</span></li>
            <li className="flex items-center justify-between"><span className="text-gray-300">High-risk pending</span><span className="tabular-nums text-amber-300">{s.highRisk}</span></li>
            <li className="flex items-center justify-between"><span className="text-gray-300">Failed publishes</span><span className="tabular-nums text-red-300">{s.failed}</span></li>
          </ul>
        </div>

        <div className={`${skin.card} p-5`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={skin.heading}>Recent activity</h2>
            <button onClick={() => onJump('activity')} className={`text-xs ${skin.accentText} hover:underline`}>All activity →</button>
          </div>
          {data.recentEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No publish events yet. Publish something from the queue to see it here.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.recentEvents.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-gray-300">{e.message}</span>
                  <span className="shrink-0 font-mono text-[11px] text-gray-500">{e.createdAt.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Publish queue ─────────────────────────────────────────────────────────
function PublishQueue({
  queue, skin, busy, onToggle, onOpen,
}: { queue: QueueItem[]; skin: ReturnType<typeof getDirection>; busy: string | null; onToggle: (i: QueueItem) => void; onOpen: (i: QueueItem) => void }) {
  const [risk, setRisk] = useState<'all' | RiskLevel>('all');
  const [status, setStatus] = useState<'all' | 'live' | 'draft'>('all');
  const [type, setType] = useState<'all' | string>('all');

  const types = useMemo(() => Array.from(new Set(queue.map((q) => q.entityType))), [queue]);
  const filtered = queue.filter(
    (q) =>
      (risk === 'all' || q.risk === risk) &&
      (status === 'all' || (status === 'live' ? q.published : !q.published)) &&
      (type === 'all' || q.entityType === type),
  );

  return (
    <div className={`${skin.card} p-5`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select value={type} onChange={setType} options={[['all', 'All types'], ...types.map((t) => [t, t] as [string, string])]} />
        <Select value={risk} onChange={(v) => setRisk(v as 'all' | RiskLevel)} options={[['all', 'All risk'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']]} />
        <Select value={status} onChange={(v) => setStatus(v as 'all' | 'live' | 'draft')} options={[['all', 'All status'], ['live', 'Live'], ['draft', 'Draft']]} />
        <span className="ml-auto text-xs text-gray-500">{filtered.length} item{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Nothing matches these filters.</p>
      ) : (
        <ul className={skin.density === 'compact' ? 'space-y-1.5' : 'space-y-2.5'}>
          {/* index in the key guards against duplicate slugs in the source
              registries (e.g. a repeated SEO slug) — keeps keys unique. */}
          {filtered.map((item, idx) => (
            <li key={`${item.kind}:${item.id}:${idx}`} className={`flex flex-wrap items-center justify-between gap-3 ${skin.row} ${skin.density === 'compact' ? 'p-2.5' : 'p-3.5'}`}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="min-w-0 flex-1 cursor-pointer rounded-md text-left transition-colors hover:bg-white/5"
                aria-label={`Open details for ${item.title}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-100">{item.title}</span>
                  <Pill className={item.published ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}>
                    {item.published ? 'Live' : 'Draft'}
                  </Pill>
                  <Pill className={RISK_TONE[item.risk]}>{item.risk}</Pill>
                  <Pill className={MODE_TONE[item.publishMode]}>{MODE_LABEL[item.publishMode]}</Pill>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-gray-600">{[item.entityType, item.category, item.date].filter(Boolean).join(' · ')} · view details</p>
              </button>
              <button
                role="switch"
                aria-checked={item.published}
                aria-label={`${item.published ? 'Unpublish' : 'Publish'} ${item.title}`}
                disabled={busy === item.id}
                onClick={() => onToggle(item)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${item.published ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${item.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

// ── Publishable areas audit ───────────────────────────────────────────────
const SOURCE_TONE: Record<PublishableArea['source'], string> = {
  'live-connected': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  'db-ready': 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  'file-backed': 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  'mock-backed': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  hardcoded: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  'needs-integration': 'bg-red-500/10 text-red-300 border-red-500/30',
};

function AreasAudit({
  areas, summary, skin,
}: { areas: PublishableArea[]; summary: PublishingOSData['areasSummary']; skin: ReturnType<typeof getDirection> }) {
  const [onlyHighRisk, setOnlyHighRisk] = useState(false);
  const rows = onlyHighRisk ? areas.filter((a) => a.riskLevel === 'high' || a.riskLevel === 'critical') : areas;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['Total', summary.total],
          ['Live-connected', summary.liveConnected],
          ['DB-ready', summary.dbReady],
          ['File-backed', summary.fileBacked],
          ['High-risk', summary.highRisk],
        ].map(([l, v]) => (
          <div key={String(l)} className={`${skin.stat} p-3`}>
            <p className={skin.statValue}>{v as number}</p>
            <p className="text-[11px] text-gray-400">{l as string}</p>
          </div>
        ))}
      </div>

      <div className={`${skin.card} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h2 className={skin.heading}>Publishable areas</h2>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={onlyHighRisk} onChange={(e) => setOnlyHighRisk(e.target.checked)} className="accent-emerald-500" />
            High-risk only
          </label>
        </div>
        <div className="divide-y divide-gray-800">
          {rows.map((a) => (
            <div key={a.key} className="grid gap-2 p-4 lg:grid-cols-[1.4fr_1fr_1.6fr] lg:items-center">
              <div>
                <p className="text-sm font-medium text-gray-100">{a.area}</p>
                <p className="font-mono text-[11px] text-gray-600">{a.entityType} · {a.owner}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill className={SOURCE_TONE[a.source]}>{a.source}</Pill>
                <Pill className={MODE_TONE[a.publishMode]}>{MODE_LABEL[a.publishMode]}</Pill>
                <Pill className={RISK_TONE[a.riskLevel]}>{a.riskLevel}</Pill>
                {a.liveConnected && <Pill className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30"><CheckCircle2 className="h-3 w-3" /> live</Pill>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">{a.recommendedAction}</p>
                <a href={a.adminHref} className={`shrink-0 text-xs ${skin.accentText} hover:underline`}>Open <ExternalLink className="inline h-3 w-3" /></a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Activity ──────────────────────────────────────────────────────────────
function Activity({ data, skin }: { data: PublishingOSData; skin: ReturnType<typeof getDirection> }) {
  return (
    <div className={`${skin.card} p-5`}>
      <h2 className={`mb-3 ${skin.heading}`}>Publish activity (audit trail)</h2>
      {data.recentEvents.length === 0 ? (
        <p className="text-sm text-gray-500">No publish events recorded yet this session.</p>
      ) : (
        <ul className="space-y-2">
          {data.recentEvents.map((e) => (
            <li key={e.id} className={`flex flex-wrap items-center justify-between gap-2 ${skin.row} p-3`}>
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-200">{e.message}</p>
                <p className="font-mono text-[11px] text-gray-600">
                  {e.entityType} · {e.fromStatus} → {e.toStatus} · {e.actorEmail ?? 'system'}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-gray-500">{e.createdAt.replace('T', ' ').slice(0, 16)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Risk confirmation modal ───────────────────────────────────────────────
function ConfirmModal({ item, onCancel, onConfirm }: { item: QueueItem; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Confirm publish">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-gray-900 p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="font-semibold">Confirm {item.risk}-risk publish</h3>
          </div>
          <button onClick={onCancel} aria-label="Cancel" className="text-gray-500 hover:text-gray-200"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-gray-300">
          You are about to publish <strong className="text-gray-100">“{item.title}”</strong> ({item.entityType}). This is a
          {' '}<span className="text-amber-300">{item.risk}-risk</span> change to a search- or product-critical surface.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-gray-400">
          <li>• It will be published via the <strong className="text-gray-200">{MODE_LABEL[item.publishMode].toLowerCase()}</strong> path and the route revalidated.</li>
          <li>• A rollback target is kept — you can unpublish or roll back from the queue.</li>
          <li>• This action is recorded in the audit trail.</li>
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-gray-950 hover:bg-amber-400">Confirm &amp; publish</button>
        </div>
      </div>
    </div>
  );
}
