'use client';

// ============================================================
// Coach Mix — admin console (client shell)
// ------------------------------------------------------------
// Four tabs over the pure Coach Mix engine:
//   Profiles      — the coach-inspired influence frameworks (admin-only)
//   Mix Builder   — blend weights → live CoachingStrategy preview
//   Review Queue  — extracted concepts + the approval gate
//   Test Drive    — run a sample diagnostic through the active mix
// The engine is deterministic + local-first, so everything runs here
// with no network call. Imports TYPES + pure functions only.
// ============================================================

import { useMemo, useState } from 'react';
import {
  Blend, Users, ListChecks, FlaskConical, ShieldCheck, AlertTriangle,
  Check, X, Lock,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { rankDrills } from '@/lib/drillmatch';
import {
  COACH_MIX_DISCLAIMER,
  COACH_MIX_ETHICS,
  SWINGVANTAGE_DEFAULT_COACH_ID,
  resolveCoachMix,
  normalizeMixWeights,
  extractConcepts,
  approveConcept,
  rejectConcept,
  reviewQueueStats,
  approvedInfluencingConcepts,
  buildCuratedRecommendation,
  type CoachProfile,
  type CoachMix,
  type LearnedConcept,
  type LearningSource,
  type UserLabelMode,
} from '@/lib/central-intelligence/coach-mix';

type TabId = 'profiles' | 'builder' | 'queue' | 'test';

const TABS: Array<{ id: TabId; label: string; icon: typeof Blend }> = [
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'builder', label: 'Mix Builder', icon: Blend },
  { id: 'queue', label: 'Review Queue', icon: ListChecks },
  { id: 'test', label: 'Test Drive', icon: FlaskConical },
];

const RISK_TONE: Record<string, BadgeTone> = { low: 'success', medium: 'warning', high: 'danger' };
const LABEL_MODES: Array<{ id: UserLabelMode; label: string }> = [
  { id: 'style_only', label: 'Style only (safe default)' },
  { id: 'coach_inspired', label: 'Coach-inspired label' },
  { id: 'full_mix', label: 'Full mix (shows names)' },
  { id: 'none', label: 'No influence label' },
];

const SAMPLE_FAULTS = [
  { id: 'early_extension', label: 'Early extension' },
  { id: 'over_the_top', label: 'Over the top' },
  { id: 'slice', label: 'Slice' },
];

function Bar({ pct, color = 'bg-violet-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800" role="presentation">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function CoachMixDashboard({ profiles }: { profiles: CoachProfile[] }) {
  const [tab, setTab] = useState<TabId>('profiles');

  const coachInspired = useMemo(
    () => profiles.filter((p) => p.id !== SWINGVANTAGE_DEFAULT_COACH_ID),
    [profiles],
  );

  // ── Mix-builder state ──
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(coachInspired.map((p) => [p.id, p.defaultInfluenceWeight])),
  );
  const [labelMode, setLabelMode] = useState<UserLabelMode>('style_only');

  const mix: CoachMix = useMemo(
    () => ({
      id: 'admin_preview',
      name: 'Admin Preview Mix',
      description: 'Live preview',
      sport: 'golf',
      entries: coachInspired.map((p) => ({ coachProfileId: p.id, weightPct: weights[p.id] ?? 0 })),
      visibility: 'admin_only',
      userLabelMode: labelMode,
      createdAt: '2026-06-08T00:00:00.000Z',
    }),
    [coachInspired, weights, labelMode],
  );

  const strategy = useMemo(() => resolveCoachMix(mix, profiles), [mix, profiles]);
  const resolvedWeights = useMemo(() => normalizeMixWeights(mix, profiles), [mix, profiles]);

  // ── Review-queue state (seeded from a sample approved source) ──
  const sampleSource: LearningSource = useMemo(
    () => ({
      id: 'sample_src',
      coachProfileId: coachInspired[0]?.id ?? 'gankas-inspired-athletic',
      title: 'Admin note: shallowing fundamentals',
      urlOrUploadRef: 'internal://admin-note',
      type: 'admin_notes',
      sport: 'golf',
      topic: 'shallowing',
      techniqueCategory: 'pivot-driven movement',
      drillCategory: 'rotation & sequencing',
      permissionStatus: 'public',
      copyrightStatus: 'cleared',
      approvedForLearning: true,
      createdAt: '2026-06-08T00:00:00.000Z',
      notes: 'Lead with the lower body; let the arms follow.',
    }),
    [coachInspired],
  );
  const [concepts, setConcepts] = useState<LearnedConcept[]>(() => extractConcepts(sampleSource));
  const stats = useMemo(() => reviewQueueStats(concepts), [concepts]);
  const influencing = useMemo(() => approvedInfluencingConcepts(concepts), [concepts]);

  const decide = (id: string, action: 'approve' | 'reject') =>
    setConcepts((prev) =>
      prev.map((c) => (c.id === id ? (action === 'approve' ? approveConcept(c) : rejectConcept(c)) : c)),
    );

  // ── Test-drive state ──
  const [faultId, setFaultId] = useState('early_extension');
  const recommendation = useMemo(() => {
    const ranked = rankDrills({ sport: 'golf', faultId });
    const label = SAMPLE_FAULTS.find((f) => f.id === faultId)?.label ?? faultId;
    return buildCuratedRecommendation({ topIssue: label }, strategy, ranked);
  }, [faultId, strategy]);

  return (
    <div className="space-y-4">
      {/* Ethics banner — always visible */}
      <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Ethical by design.</strong> Coach Mix learns generalized principles, never content.
          Profiles are admin-only and disclaimer-stamped; coach names are hidden from users unless you
          explicitly enable them; and nothing influences the product until you approve it.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-800">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'border-violet-500 text-violet-300'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
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
                <span className="flex items-center gap-2">
                  {p.name}
                  {p.visibility === 'admin_only' ? (
                    <StatusBadge tone="warning">
                      <Lock className="h-3 w-3" /> Admin-only
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="success">User-visible</StatusBadge>
                  )}
                  {p.needsReview && <StatusBadge tone="info">Needs review</StatusBadge>}
                </span>
              }
              description={p.teachingStyleSummary}
            >
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-1.5">
                  {p.styleTags.map((tag) => (
                    <StatusBadge key={tag} tone="accent">{tag}</StatusBadge>
                  ))}
                  {p.swingModelTraits.slice(0, 4).map((t) => (
                    <StatusBadge key={t} tone="neutral">{t.replace(/_/g, ' ')}</StatusBadge>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  <span className="text-gray-500">Swing model:</span> {p.swingModelTarget.name} ·{' '}
                  {p.swingModelTarget.primaryMovementPattern}
                </p>
                {p.adminNote && (
                  <p className="flex items-start gap-1.5 rounded border border-amber-500/20 bg-amber-500/5 p-2 text-xs text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {p.adminNote}
                  </p>
                )}
                <p className="border-t border-gray-800 pt-2 text-[11px] italic text-gray-500">
                  {COACH_MIX_DISCLAIMER}
                </p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'builder' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Blend weights" description="Set how much each coach-inspired model influences SwingVantage. The house model always fills the remainder.">
            <div className="space-y-4">
              {coachInspired.map((p) => (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-200">{p.name}</span>
                    <span className="tabular-nums text-gray-400">{weights[p.id] ?? 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={weights[p.id] ?? 0}
                    onChange={(e) => setWeights((w) => ({ ...w, [p.id]: Number(e.target.value) }))}
                    className="w-full accent-violet-500"
                    aria-label={`${p.name} influence weight`}
                  />
                </div>
              ))}
              <div className="border-t border-gray-800 pt-3">
                <label className="mb-1 block text-xs text-gray-500">User label mode</label>
                <select
                  value={labelMode}
                  onChange={(e) => setLabelMode(e.target.value as UserLabelMode)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200"
                >
                  {LABEL_MODES.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-xs">
                <p className="mb-1.5 text-gray-500">Resolved blend (normalized to 100%):</p>
                {resolvedWeights.map((r) => (
                  <div key={r.profile.id} className="mb-1 flex items-center gap-2">
                    <span className="w-40 shrink-0 truncate text-gray-300">{r.profile.name}</span>
                    <Bar pct={r.weightPct} />
                    <span className="w-10 shrink-0 text-right tabular-nums text-gray-400">{r.weightPct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Resolved coaching strategy" description="How this blend changes SwingVantage's coaching.">
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <p className="text-gray-200">{strategy.influenceSummary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {strategy.influenceTags.map((t) => (
                    <StatusBadge key={t} tone="accent">{t}</StatusBadge>
                  ))}
                  <StatusBadge tone={strategy.coachNamesVisible ? 'warning' : 'neutral'}>
                    {strategy.coachNamesVisible ? 'Coach names: visible' : 'Coach names: hidden'}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Explanation style</p>
                <StatusBadge tone="info">{strategy.explanationStyle.replace(/_/g, ' ')}</StatusBadge>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Diagnostic priority</p>
                <ol className="list-inside list-decimal text-gray-300">
                  {strategy.diagnosticPriority.slice(0, 6).map((d) => (
                    <li key={d}>{d.replace(/_/g, ' ')}</li>
                  ))}
                  {strategy.diagnosticPriority.length === 0 && <li className="list-none text-gray-500">—</li>}
                </ol>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Lead movement cues</p>
                <ul className="list-inside list-disc text-gray-300">
                  {strategy.movementCues.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Favored drill families</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(strategy.drillCategoryWeights)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([cat, w]) => (
                      <StatusBadge key={cat} tone={w > 1 ? 'accent' : 'neutral'}>
                        {cat} ×{w}
                      </StatusBadge>
                    ))}
                </div>
              </div>
              <p className="border-t border-gray-800 pt-2 text-xs text-gray-500">
                <span className="text-gray-400">Retest:</span> {strategy.retestProtocol}
              </p>
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
            description="Everything the engine extracted from approved sources — original SwingVantage rewrites, awaiting your decision. Nothing influences the product until approved."
          >
            <div className="space-y-2">
              {concepts.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge tone="neutral">{c.type.replace(/_/g, ' ')}</StatusBadge>
                    <StatusBadge tone={RISK_TONE[c.ipRisk]}>IP risk: {c.ipRisk}</StatusBadge>
                    <StatusBadge tone="info">conf {Math.round(c.confidence * 100)}%</StatusBadge>
                    <StatusBadge
                      tone={c.reviewStatus === 'approved' ? 'success' : c.reviewStatus === 'rejected' ? 'danger' : 'warning'}
                    >
                      {c.reviewStatus.replace(/_/g, ' ')}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-gray-300">{c.summary}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="text-gray-400">SwingVantage rewrite:</span> {c.suggestedRewrite}
                  </p>
                  {(c.reviewStatus === 'pending' || c.reviewStatus === 'needs_source_review') && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => decide(c.id, 'approve')}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => decide(c.id, 'reject')}
                        className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {concepts.length === 0 && <p className="text-sm text-gray-500">No concepts extracted.</p>}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {influencing.length} approved concept{influencing.length === 1 ? '' : 's'} would influence
              recommendations. (Persisting approvals to a store is Phase 2.)
            </p>
          </SectionCard>
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
                  faultId === f.id
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">1 · Top issue</p>
              <p className="text-gray-200">{recommendation.topIssue}</p>
              <p className="mt-1 text-xs text-gray-400">{recommendation.whyItMatters}</p>
            </div>
            {recommendation.firstDrill && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">2 · Do this first</p>
                <p className="font-medium text-gray-100">{recommendation.firstDrill.drill.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">{recommendation.firstDrill.why}</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs text-gray-400 sm:grid-cols-3">
                  <span><span className="text-gray-500">Feel:</span> {recommendation.whatToFeel}</span>
                  <span><span className="text-gray-500">Success:</span> {recommendation.whatSuccessLooksLike}</span>
                  <span><span className="text-gray-500">~min:</span> {recommendation.firstDrill.drill.estimatedMinutes}</span>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">3 · Retest &amp; connection</p>
              <p className="text-gray-300">{recommendation.howToRetest}</p>
              <p className="mt-1 text-xs text-gray-400">{recommendation.howItConnectsToYourGame}</p>
            </div>
            {recommendation.alternatives.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Alternatives</p>
                <ul className="space-y-1">
                  {recommendation.alternatives.map((d) => (
                    <li key={d.drill.id} className="flex items-center justify-between text-xs text-gray-400">
                      <span>{d.drill.name}</span>
                      <span className="tabular-nums">score {d.coachScore}{d.influenceMultiplier > 1 ? ` (×${d.influenceMultiplier})` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="border-t border-gray-800 pt-2 text-[11px] italic text-gray-500">
              {recommendation.influenceSummary} {recommendation.coachNamesVisible ? '' : 'Coach names are hidden in user output.'}
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
