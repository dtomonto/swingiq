'use client';

// ============================================================
// Coach Mix — admin console (client shell, persisted)
// ------------------------------------------------------------
// Five tabs over the pure Coach Mix engine + the local-first store:
//   Profiles  — frameworks; set visibility / archive (persisted)
//   Sources   — add approved sources, extract concepts into the queue
//   Mix Builder — blend weights → live strategy; save / load / activate
//   Review Queue — approve/reject extracted concepts (the gate; persisted)
//   Test Drive — run a sample diagnostic through the current mix
// Everything is admin-only and runs locally (no network call).
// ============================================================

import { useCallback, useMemo, useState } from 'react';
import {
  Blend, Users, ListChecks, FlaskConical, ShieldCheck, AlertTriangle,
  Check, X, Lock, BookOpen, Plus, Trash2, Star, Save, Download, TrendingUp, Film,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { rankDrills } from '@/lib/drillmatch';
import {
  COACH_MIX_DISCLAIMER,
  SOURCE_TYPES,
  SOURCE_TYPE_LABELS,
  SWINGVANTAGE_DEFAULT_COACH_ID,
  resolveCoachMix,
  normalizeMixWeights,
  reviewQueueStats,
  approvedInfluencingConcepts,
  buildCuratedRecommendation,
  analyzeTrends,
  resolveTrendInput,
  buildVideoConcept,
  type CoachMix,
  type LearnedConcept,
  type LearningSource,
  type SourceType,
  type UserLabelMode,
  type Visibility,
} from '@/lib/central-intelligence/coach-mix';
import {
  useCoachMixData,
  mergeProfiles,
  setProfileOverride,
  addSource,
  removeSource,
  extractFromSource,
  decideConcept,
  saveMix,
  deleteMix,
  setActiveMixId,
  addVideoConcept,
  setVideoConceptStatus,
  removeVideoConcept,
} from '@/lib/central-intelligence/coach-mix/store';

type TabId = 'profiles' | 'sources' | 'builder' | 'queue' | 'videos' | 'trends' | 'test';

const TABS: Array<{ id: TabId; label: string; icon: typeof Blend }> = [
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'sources', label: 'Sources', icon: BookOpen },
  { id: 'builder', label: 'Mix Builder', icon: Blend },
  { id: 'queue', label: 'Review Queue', icon: ListChecks },
  { id: 'videos', label: 'Video Concepts', icon: Film },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'test', label: 'Test Drive', icon: FlaskConical },
];

const RISK_TONE: Record<string, BadgeTone> = { low: 'success', medium: 'warning', high: 'danger' };
const VISIBILITIES: Visibility[] = ['admin_only', 'beta', 'user_visible'];
const LABEL_MODES: Array<{ id: UserLabelMode; label: string }> = [
  { id: 'style_only', label: 'Style only (safe default)' },
  { id: 'coach_inspired', label: 'Coach-inspired label' },
  { id: 'full_mix', label: 'Full mix (shows names)' },
  { id: 'none', label: 'No influence label' },
];
const SPORTS = ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'] as const;
const PERMISSIONS: LearningSource['permissionStatus'][] = ['unknown', 'public', 'licensed', 'partnership', 'restricted'];
const COPYRIGHTS: LearningSource['copyrightStatus'][] = ['unknown', 'cleared', 'attribution_required', 'restricted'];
const SAMPLE_FAULTS = [
  { id: 'early_extension', label: 'Early extension' },
  { id: 'over_the_top', label: 'Over the top' },
  { id: 'slice', label: 'Slice' },
];

function Bar({ pct, color = 'bg-primary' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="presentation">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function CoachMixDashboard() {
  const [tab, setTab] = useState<TabId>('profiles');
  const data = useCoachMixData();

  const profiles = useMemo(
    () => mergeProfiles(data.customProfiles, data.profileOverrides),
    [data.customProfiles, data.profileOverrides],
  );
  const coachInspired = useMemo(
    () => profiles.filter((p) => p.id !== SWINGVANTAGE_DEFAULT_COACH_ID && p.status !== 'archived'),
    [profiles],
  );

  // ── Mix builder state ──
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [labelMode, setLabelMode] = useState<UserLabelMode>('style_only');
  const [mixName, setMixName] = useState('My Mix');
  const [editingMixId, setEditingMixId] = useState<string | null>(null);

  const weightFor = useCallback((id: string, fallback: number) => weights[id] ?? fallback, [weights]);

  const mix: CoachMix = useMemo(
    () => ({
      id: editingMixId ?? 'admin_preview',
      name: mixName || 'Untitled Mix',
      description: 'Admin-built mix',
      sport: 'golf',
      entries: coachInspired.map((p) => ({ coachProfileId: p.id, weightPct: weightFor(p.id, p.defaultInfluenceWeight) })),
      visibility: 'admin_only',
      userLabelMode: labelMode,
      createdAt: '2026-06-08T00:00:00.000Z',
    }),
    [coachInspired, labelMode, mixName, editingMixId, weightFor],
  );

  const strategy = useMemo(() => resolveCoachMix(mix, profiles), [mix, profiles]);
  const resolvedWeights = useMemo(() => normalizeMixWeights(mix, profiles), [mix, profiles]);

  const loadMix = (m: CoachMix) => {
    setWeights(Object.fromEntries(m.entries.map((e) => [e.coachProfileId, e.weightPct])));
    setLabelMode(m.userLabelMode);
    setMixName(m.name);
    setEditingMixId(m.id);
    setTab('builder');
  };
  const onSaveMix = () => {
    const saved = saveMix(mix);
    setEditingMixId(saved.id);
  };

  // ── Review queue (from the store) ──
  const stats = useMemo(() => reviewQueueStats(data.concepts), [data.concepts]);
  const influencing = useMemo(() => approvedInfluencingConcepts(data.concepts), [data.concepts]);

  // ── Source form ──
  const blankSource: Omit<LearningSource, 'id' | 'createdAt'> = {
    coachProfileId: coachInspired[0]?.id ?? '',
    title: '',
    urlOrUploadRef: '',
    type: 'admin_notes',
    sport: 'golf',
    topic: '',
    techniqueCategory: '',
    drillCategory: '',
    permissionStatus: 'public',
    copyrightStatus: 'cleared',
    approvedForLearning: false,
  };
  const [form, setForm] = useState(blankSource);
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const submitSource = () => {
    if (!form.title.trim() || !form.coachProfileId) return;
    addSource(form);
    setForm(blankSource);
  };

  // ── Test drive ──
  const [faultId, setFaultId] = useState('early_extension');
  const recommendation = useMemo(() => {
    const ranked = rankDrills({ sport: 'golf', faultId });
    const label = SAMPLE_FAULTS.find((f) => f.id === faultId)?.label ?? faultId;
    return buildCuratedRecommendation({ topIssue: label }, strategy, ranked);
  }, [faultId, strategy]);

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.name ?? id;

  // ── Trends (real aggregates when wired; labelled sample until then) ──
  const trendData = useMemo(() => resolveTrendInput(), []);
  const trends = useMemo(() => analyzeTrends(trendData.input), [trendData]);

  const makeVideoConcept = (c: LearnedConcept) => {
    const target = c.suggestedDrillConnection || c.suggestedFaultId || c.type.replace(/_/g, ' ');
    const v = buildVideoConcept({ sport: 'golf', targetProblem: target, strategy, drills: strategy.movementCues, sourceConcept: c });
    if (v) {
      addVideoConcept(v);
      setTab('videos');
    }
  };

  return (
    <div className="space-y-4">
      {/* Ethics banner */}
      <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success-text">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Ethical by design.</strong> Coach Mix learns generalized principles, never content.
          Profiles are admin-only and disclaimer-stamped; coach names are hidden from users unless you
          explicitly enable them; and nothing influences the product until you approve it.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
                active ? 'border-primary text-link' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profiles' && (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <SectionCard
              key={p.id}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {p.name}
                  {p.visibility === 'user_visible' ? (
                    <StatusBadge tone="success">User-visible</StatusBadge>
                  ) : p.visibility === 'beta' ? (
                    <StatusBadge tone="info">Beta</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning"><Lock className="h-3 w-3" /> Admin-only</StatusBadge>
                  )}
                  {p.needsReview && <StatusBadge tone="info">Needs review</StatusBadge>}
                  {p.status === 'archived' && <StatusBadge tone="neutral">Archived</StatusBadge>}
                </span>
              }
              description={p.teachingStyleSummary}
            >
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-1.5">
                  {p.styleTags.map((tag) => <StatusBadge key={tag} tone="accent">{tag}</StatusBadge>)}
                  {p.swingModelTraits.slice(0, 4).map((t) => (
                    <StatusBadge key={t} tone="neutral">{t.replace(/_/g, ' ')}</StatusBadge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-muted-foreground">Swing model:</span> {p.swingModelTarget.name} ·{' '}
                  {p.swingModelTarget.primaryMovementPattern}
                </p>
                {p.adminNote && (
                  <p className="flex items-start gap-1.5 rounded border border-primary/20 bg-primary/5 p-2 text-xs text-link">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {p.adminNote}
                  </p>
                )}
                {p.id !== SWINGVANTAGE_DEFAULT_COACH_ID && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">Visibility:</span>
                    <select
                      value={p.visibility}
                      onChange={(e) => setProfileOverride(p.id, { visibility: e.target.value as Visibility })}
                      className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                    >
                      {VISIBILITIES.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                    </select>
                    <button
                      onClick={() => setProfileOverride(p.id, { status: p.status === 'archived' ? 'active' : 'archived' })}
                      className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
                    >
                      {p.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                )}
                <p className="border-t border-border pt-2 text-2xs italic text-muted-foreground">{COACH_MIX_DISCLAIMER}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'sources' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Add a learning source" description="Only approved, permission-cleared sources can be learned from. Nothing is published — concepts go to the review queue.">
            <div className="space-y-2.5 text-sm">
              <input
                placeholder="Source title"
                value={form.title}
                onChange={(e) => setF('title', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
              <input
                placeholder="URL or upload reference"
                value={form.urlOrUploadRef}
                onChange={(e) => setF('urlOrUploadRef', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.coachProfileId} onChange={(e) => setF('coachProfileId', e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-foreground">
                  <option value="">Coach profile…</option>
                  {coachInspired.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={form.type} onChange={(e) => setF('type', e.target.value as SourceType)} className="rounded-lg border border-border bg-background px-2 py-2 text-foreground">
                  {SOURCE_TYPES.map((s) => <option key={s} value={s}>{SOURCE_TYPE_LABELS[s]}</option>)}
                </select>
                <select value={form.sport} onChange={(e) => setF('sport', e.target.value as LearningSource['sport'])} className="rounded-lg border border-border bg-background px-2 py-2 text-foreground">
                  {SPORTS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <input placeholder="Topic (e.g. shallowing)" value={form.topic} onChange={(e) => setF('topic', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                <input placeholder="Technique category" value={form.techniqueCategory} onChange={(e) => setF('techniqueCategory', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                <input placeholder="Drill category" value={form.drillCategory} onChange={(e) => setF('drillCategory', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                <select value={form.permissionStatus} onChange={(e) => setF('permissionStatus', e.target.value as LearningSource['permissionStatus'])} className="rounded-lg border border-border bg-background px-2 py-2 text-foreground">
                  {PERMISSIONS.map((p) => <option key={p} value={p}>permission: {p}</option>)}
                </select>
                <select value={form.copyrightStatus} onChange={(e) => setF('copyrightStatus', e.target.value as LearningSource['copyrightStatus'])} className="rounded-lg border border-border bg-background px-2 py-2 text-foreground">
                  {COPYRIGHTS.map((c) => <option key={c} value={c}>copyright: {c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <input type="checkbox" checked={form.approvedForLearning} onChange={(e) => setF('approvedForLearning', e.target.checked)} className="accent-primary" />
                Approved for learning (admin confirms permission to learn from this source)
              </label>
              <button
                onClick={submitSource}
                disabled={!form.title.trim() || !form.coachProfileId}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-link hover:bg-primary/20 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> Add source
              </button>
            </div>
          </SectionCard>

          <SectionCard title={`Sources (${data.sources.length})`} description="Extract concepts from a cleared source into the review queue.">
            <div className="space-y-2">
              {data.sources.length === 0 && <p className="text-sm text-muted-foreground">No sources yet. Add one to begin.</p>}
              {data.sources.map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{profileName(s.coachProfileId)} · {s.topic || '—'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {s.approvedForLearning ? <StatusBadge tone="success">approved</StatusBadge> : <StatusBadge tone="warning">not approved</StatusBadge>}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => { extractFromSource(s.id); setTab('queue'); }} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-link hover:bg-primary/20">
                      <Download className="h-3.5 w-3.5" /> Extract
                    </button>
                    <button onClick={() => removeSource(s.id)} className="inline-flex items-center gap-1 rounded-md border border-error/40 bg-error/10 px-2.5 py-1 text-xs font-medium text-error-text hover:bg-error/20">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'builder' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Blend weights" description="Set how much each coach-inspired model influences SwingVantage. The house model always fills the remainder.">
            <div className="space-y-4">
              {coachInspired.map((p) => (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{weightFor(p.id, p.defaultInfluenceWeight)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={weightFor(p.id, p.defaultInfluenceWeight)}
                    onChange={(e) => setWeights((w) => ({ ...w, [p.id]: Number(e.target.value) }))}
                    className="w-full accent-primary"
                    aria-label={`${p.name} influence weight`}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <div>
                  <label htmlFor="cm-mix-name" className="mb-1 block text-xs text-muted-foreground">Mix name</label>
                  <input id="cm-mix-name" value={mixName} onChange={(e) => setMixName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label htmlFor="cm-label-mode" className="mb-1 block text-xs text-muted-foreground">User label mode</label>
                  <select id="cm-label-mode" value={labelMode} onChange={(e) => setLabelMode(e.target.value as UserLabelMode)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                    {LABEL_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={onSaveMix} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-link hover:bg-primary/20">
                <Save className="h-4 w-4" /> {editingMixId ? 'Update mix' : 'Save mix'}
              </button>

              <div className="rounded-lg border border-border bg-background p-3 text-xs">
                <p className="mb-1.5 text-muted-foreground">Resolved blend (normalized to 100%):</p>
                {resolvedWeights.map((r) => (
                  <div key={r.profile.id} className="mb-1 flex items-center gap-2">
                    <span className="w-40 shrink-0 truncate text-foreground">{r.profile.name}</span>
                    <Bar pct={r.weightPct} />
                    <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{r.weightPct}%</span>
                  </div>
                ))}
              </div>

              {data.mixes.length > 0 && (
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Saved mixes</p>
                  <div className="space-y-1.5">
                    {data.mixes.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1.5 text-foreground">
                          {data.activeMixId === m.id && <Star className="h-3.5 w-3.5 text-link" />}
                          {m.name}
                        </span>
                        <span className="flex shrink-0 gap-1">
                          <button onClick={() => loadMix(m)} className="rounded border border-border px-2 py-0.5 text-xs text-foreground hover:bg-muted">Load</button>
                          <button onClick={() => setActiveMixId(m.id)} className="rounded border border-border px-2 py-0.5 text-xs text-foreground hover:bg-muted">Set active</button>
                          <button onClick={() => deleteMix(m.id)} className="rounded border border-error/30 px-2 py-0.5 text-xs text-error-text hover:bg-error/10">Delete</button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Resolved coaching strategy" description="How this blend changes SwingVantage's coaching.">
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-foreground">{strategy.influenceSummary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {strategy.influenceTags.map((t) => <StatusBadge key={t} tone="accent">{t}</StatusBadge>)}
                  <StatusBadge tone={strategy.coachNamesVisible ? 'warning' : 'neutral'}>
                    {strategy.coachNamesVisible ? 'Coach names: visible' : 'Coach names: hidden'}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Explanation style</p>
                <StatusBadge tone="info">{strategy.explanationStyle.replace(/_/g, ' ')}</StatusBadge>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Diagnostic priority</p>
                <ol className="list-inside list-decimal text-foreground">
                  {strategy.diagnosticPriority.slice(0, 6).map((d) => <li key={d}>{d.replace(/_/g, ' ')}</li>)}
                  {strategy.diagnosticPriority.length === 0 && <li className="list-none text-muted-foreground">—</li>}
                </ol>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Lead movement cues</p>
                <ul className="list-inside list-disc text-foreground">
                  {strategy.movementCues.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Favored drill families</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(strategy.drillCategoryWeights).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cat, w]) => (
                    <StatusBadge key={cat} tone={w > 1 ? 'accent' : 'neutral'}>{cat} ×{w}</StatusBadge>
                  ))}
                </div>
              </div>
              <p className="border-t border-border pt-2 text-xs text-muted-foreground"><span className="text-muted-foreground">Retest:</span> {strategy.retestProtocol}</p>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'queue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricStat label="Total" value={stats.total} />
            <MetricStat label="Pending" value={stats.pending} tone="warning" />
            <MetricStat label="Approved" value={stats.approved} tone="success" />
            <MetricStat label="High IP-risk pending" value={stats.highIpRiskPending} tone={stats.highIpRiskPending ? 'warning' : 'muted'} />
          </div>
          <SectionCard
            title="Learned coaching concepts"
            description="Original SwingVantage rewrites extracted from approved sources, awaiting your decision. Nothing influences the product until approved."
          >
            <div className="space-y-2">
              {data.concepts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Queue is empty. Add a source under <button onClick={() => setTab('sources')} className="text-link underline">Sources</button> and click Extract.
                </p>
              )}
              {data.concepts.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge tone="neutral">{c.type.replace(/_/g, ' ')}</StatusBadge>
                    <StatusBadge tone={RISK_TONE[c.ipRisk]}>IP risk: {c.ipRisk}</StatusBadge>
                    <StatusBadge tone="info">conf {Math.round(c.confidence * 100)}%</StatusBadge>
                    <StatusBadge tone={c.reviewStatus === 'approved' ? 'success' : c.reviewStatus === 'rejected' ? 'danger' : 'warning'}>
                      {c.reviewStatus.replace(/_/g, ' ')}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-foreground">{c.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground"><span className="text-muted-foreground">SwingVantage rewrite:</span> {c.suggestedRewrite}</p>
                  {(c.reviewStatus === 'pending' || c.reviewStatus === 'needs_source_review') && (
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => decideConcept(c.id, 'approve')} className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success-text hover:bg-success/20">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => decideConcept(c.id, 'reject')} className="inline-flex items-center gap-1 rounded-md border border-error/40 bg-error/10 px-2.5 py-1 text-xs font-medium text-error-text hover:bg-error/20">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  {c.reviewStatus === 'approved' && (
                    <div className="mt-2">
                      <button onClick={() => makeVideoConcept(c)} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-link hover:bg-primary/20">
                        <Film className="h-3.5 w-3.5" /> Make video concept
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{influencing.length} approved concept{influencing.length === 1 ? '' : 's'} would influence recommendations.</p>
          </SectionCard>
        </div>
      )}

      {tab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-link">
            <Film className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Original SwingVantage video concepts built from <strong>approved</strong> learned concepts + your active
              blend. They&apos;re <strong>drafts</strong> — approve one, then hand it to <strong>Video Studio</strong> to
              produce. SwingVantage never copies or recreates a coach&apos;s video.
            </p>
          </div>
          {data.videoConcepts.length === 0 && (
            <SectionCard>
              <p className="text-sm text-muted-foreground">
                No video concepts yet. In the{' '}
                <button onClick={() => setTab('queue')} className="text-link underline">Review Queue</button>, approve a
                concept and click “Make video concept”.
              </p>
            </SectionCard>
          )}
          {data.videoConcepts.map((v) => (
            <SectionCard
              key={v.id}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {v.title}
                  <StatusBadge tone={v.approvalStatus === 'approved' ? 'success' : v.approvalStatus === 'rejected' ? 'danger' : 'warning'}>
                    {v.approvalStatus}
                  </StatusBadge>
                </span>
              }
              description={v.coachMixInfluence}
            >
              <div className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  <span className="text-muted-foreground">Target:</span> {v.targetProblem} · <span className="text-muted-foreground">Objective:</span> {v.swingModelObjective}
                </p>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Script outline</p>
                  <ol className="list-inside list-decimal space-y-0.5 text-xs text-foreground">
                    {v.scriptOutline.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Shot list</p>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-foreground">
                    {v.shotList.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground"><span className="text-muted-foreground">Retest:</span> {v.retestInstructions}</p>
                <div className="flex flex-wrap gap-1.5">
                  {v.seoKeywords.slice(0, 6).map((k) => <StatusBadge key={k} tone="neutral">{k}</StatusBadge>)}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border pt-2">
                  {v.approvalStatus !== 'approved' && (
                    <button onClick={() => setVideoConceptStatus(v.id, 'approved')} className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success-text hover:bg-success/20">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  {v.approvalStatus !== 'rejected' && (
                    <button onClick={() => setVideoConceptStatus(v.id, 'rejected')} className="inline-flex items-center gap-1 rounded-md border border-error/40 bg-error/10 px-2.5 py-1 text-xs font-medium text-error-text hover:bg-error/20">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  )}
                  <button onClick={() => removeVideoConcept(v.id)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <p className="text-2xs italic text-muted-foreground">Approved concepts are ready to hand to Video Studio (Admin → Video Studio) for production.</p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'trends' && (
        <div className="space-y-4">
          {trendData.isSample && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-link">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Showing <strong>illustrative sample data</strong>. Once privacy-safe aggregates are wired in, this reads
                which swing problems are most common, which drills get abandoned, and which styles complete more practice —
                then recommends what to build and how to adjust the mix. Cohorts below the privacy threshold are never shown.
              </p>
            </div>
          )}
          {([
            ['Videos to produce', trends.videosToProduce],
            ['Drills to create', trends.drillsToCreate],
            ['Drills to promote', trends.drillsToPromote],
            ['Mix adjustments', trends.mixAdjustments],
            ['Dashboard improvements', trends.dashboardImprovements],
          ] as const).map(([title, items]) => (
            <SectionCard key={title} title={title}>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((s, i) => (
                    <li key={i} className="rounded-lg border border-border bg-background p-2.5 text-sm">
                      <p className="text-foreground">{s.suggestion}</p>
                      <p className="text-xs text-muted-foreground">{s.reason} · cohort {s.cohort}</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'test' && (
        <SectionCard
          title="Test drive against a sample diagnostic"
          description="Pick a fault and see the focused recommendation this mix produces — drills come from the real DrillMatch engine, re-weighted by the blend."
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {SAMPLE_FAULTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFaultId(f.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  faultId === f.id ? 'border-primary bg-primary/10 text-link' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">1 · Top issue</p>
              <p className="text-foreground">{recommendation.topIssue}</p>
              <p className="mt-1 text-xs text-muted-foreground">{recommendation.whyItMatters}</p>
            </div>
            {recommendation.firstDrill && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">2 · Do this first</p>
                <p className="font-medium text-foreground">{recommendation.firstDrill.drill.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{recommendation.firstDrill.why}</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span><span className="text-muted-foreground">Feel:</span> {recommendation.whatToFeel}</span>
                  <span><span className="text-muted-foreground">Success:</span> {recommendation.whatSuccessLooksLike}</span>
                  <span><span className="text-muted-foreground">~min:</span> {recommendation.firstDrill.drill.estimatedMinutes}</span>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">3 · Retest &amp; connection</p>
              <p className="text-foreground">{recommendation.howToRetest}</p>
              <p className="mt-1 text-xs text-muted-foreground">{recommendation.howItConnectsToYourGame}</p>
            </div>
            {recommendation.alternatives.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Alternatives</p>
                <ul className="space-y-1">
                  {recommendation.alternatives.map((d) => (
                    <li key={d.drill.id} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{d.drill.name}</span>
                      <span className="tabular-nums">score {d.coachScore}{d.influenceMultiplier > 1 ? ` (×${d.influenceMultiplier})` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="border-t border-border pt-2 text-2xs italic text-muted-foreground">
              {recommendation.influenceSummary} {recommendation.coachNamesVisible ? '' : 'Coach names are hidden in user output.'}
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
