'use client';

// ============================================================
// CentralIntelligenceOS — admin command center (client shell)
// ------------------------------------------------------------
// Tabbed panels over the server-computed dashboard. Aggregate panels are
// labelled when illustrative (sample) vs live. The Founding campaign data
// is always live; the membership-gate control writes through the admin
// config API. Imports the dashboard TYPE only (server code never bundled).
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Trophy, UserSearch, ClipboardList, Activity, Brain,
  TrendingUp, ShieldCheck, Lightbulb,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { DATA_ETHICS, formatMemberNumber } from '@/lib/central-intelligence';
import type { CIDashboard } from '@/lib/central-intelligence/dashboard';
import type { FoundingCampaignProgress, RecommendationPriority } from '@/lib/central-intelligence';

type TabId =
  | 'overview' | 'founding' | 'profile' | 'sessions' | 'coaching'
  | 'explorer' | 'growthos' | 'governance' | 'recommendations';

const TABS: Array<{ id: TabId; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Executive', icon: BarChart3 },
  { id: 'founding', label: 'Founding Members', icon: Trophy },
  { id: 'profile', label: 'Profile Intel', icon: ClipboardList },
  { id: 'sessions', label: 'Session Intel', icon: Activity },
  { id: 'coaching', label: 'Coaching Memory', icon: Brain },
  { id: 'explorer', label: 'User Explorer', icon: UserSearch },
  { id: 'growthos', label: 'GrowthOS', icon: TrendingUp },
  { id: 'governance', label: 'Data Governance', icon: ShieldCheck },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
];

const PRIORITY_TONE: Record<RecommendationPriority, BadgeTone> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
};

function Bar({ pct, color = 'bg-sky-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800" role="presentation">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function CentralIntelligenceDashboard({ data }: { data: CIDashboard }) {
  const [tab, setTab] = useState<TabId>('overview');
  const [progress, setProgress] = useState<FoundingCampaignProgress>(data.founding.progress);
  const [override, setOverride] = useState<boolean | null>(data.founding.config.manualOverride);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    track(ANALYTICS_EVENTS.CENTRAL_INTELLIGENCE_VIEWED, { data_source: data.dataSource });
  }, [data.dataSource]);

  const saveOverride = async (next: boolean | null) => {
    setSaving(true);
    try {
      const res = await fetch('/api/central-intelligence/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualOverride: next }),
      });
      const json = (await res.json()) as { ok: boolean; progress?: FoundingCampaignProgress };
      if (json.ok && json.progress) {
        setOverride(next);
        setProgress(json.progress);
      }
    } catch {
      /* keep prior state */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Data-source honesty banner */}
      {data.dataSource === 'sample' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Aggregate panels show <strong>illustrative sample data</strong> so you can explore the
          command center. The Founding Members campaign numbers are <strong>live</strong>. Wire the
          relational aggregate (docs) to replace samples with real platform data.
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Central Intelligence sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewPanel data={data} progress={progress} />}
      {tab === 'founding' && (
        <FoundingPanel data={data} progress={progress} override={override} saving={saving} onOverride={saveOverride} />
      )}
      {tab === 'profile' && <ProfilePanel data={data} />}
      {tab === 'sessions' && <SessionPanel data={data} />}
      {tab === 'coaching' && <CoachingPanel data={data} />}
      {tab === 'explorer' && <ExplorerPanel data={data} />}
      {tab === 'growthos' && <GrowthOsPanel data={data} progress={progress} />}
      {tab === 'governance' && <GovernancePanel data={data} />}
      {tab === 'recommendations' && <RecommendationsPanel data={data} />}
    </div>
  );
}

// ── Panels ────────────────────────────────────────────────────

function OverviewPanel({ data, progress }: { data: CIDashboard; progress: FoundingCampaignProgress }) {
  const e = data.executive;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricStat label="Registered users" value={e.totalUsers} />
        <MetricStat label="Profiles complete" value={`${e.profilesComplete}`} hint={`${e.profileCompletionRate}% of users`} tone={e.profileCompletionRate < 60 ? 'warning' : 'success'} />
        <MetricStat label="Total sessions" value={e.totalSessions} />
        <MetricStat label="Avg sessions / user" value={e.avgSessionsPerUser.toFixed(1)} tone={e.avgSessionsPerUser < 3 ? 'warning' : 'success'} />
        <MetricStat label="Founding Members" value={`${progress.qualifiedCount} / ${progress.requiredCount.toLocaleString()}`} tone="muted" />
        <MetricStat label="New this week" value={e.newThisWeek} />
        <MetricStat label="Returning" value={e.returningUsers} />
        <MetricStat label="AI diagnostics complete" value={`${e.aiDiagnosticCompletionRate}%`} tone="success" />
        <MetricStat label="Retest rate" value={`${e.retestRate}%`} tone={e.retestRate < 20 ? 'warning' : 'success'} />
        <MetricStat label="Data quality" value={`${e.dataQualityScorePct}%`} tone="success" />
      </div>
      <SectionCard title="Top sports by sessions">
        <ul className="space-y-2">
          {e.topSports.map((s) => (
            <li key={s.sport} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 capitalize text-gray-300">{s.sport.replace('_', ' ')}</span>
              <Bar pct={(s.sessions / (e.topSports[0]?.sessions || 1)) * 100} color="bg-emerald-500" />
              <span className="w-10 text-right tabular-nums text-gray-400">{s.sessions}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      <HelpPanel>
        <p>This is the platform&apos;s intelligence brain. It saves a user&apos;s profile, equipment, sessions and
          coaching history (ethically and per-user) so SwingVantage gets smarter over time — and surfaces
          what to do next for both athletes and you.</p>
      </HelpPanel>
    </div>
  );
}

function FoundingPanel({
  data, progress, override, saving, onOverride,
}: {
  data: CIDashboard; progress: FoundingCampaignProgress; override: boolean | null; saving: boolean;
  onOverride: (v: boolean | null) => void;
}) {
  const options: Array<{ v: boolean | null; label: string; hint: string }> = [
    { v: null, label: 'Automatic', hint: `Unlock tiers at ${progress.requiredCount.toLocaleString()} members` },
    { v: true, label: 'Force unlock', hint: 'Turn membership tiers on now' },
    { v: false, label: 'Force lock', hint: 'Keep tiers off regardless' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Qualified" value={progress.qualifiedCount} />
        <MetricStat label="Goal" value={progress.requiredCount.toLocaleString()} tone="muted" />
        <MetricStat label="Remaining" value={progress.remaining.toLocaleString()} tone={progress.full ? 'success' : 'default'} />
        <MetricStat label="Persistence" value={data.founding.persistent ? 'Supabase' : 'In-memory'} tone={data.founding.persistent ? 'success' : 'warning'} />
      </div>

      <SectionCard title="Campaign progress" description="Profile complete + 10 valid sessions = a Founding Member. Member numbers are assigned server-side in qualification order.">
        <Bar pct={(progress.qualifiedCount / progress.requiredCount) * 100} color="bg-violet-500" />
        <p className="mt-2 text-xs text-gray-500">{progress.qualifiedCount} of {progress.requiredCount.toLocaleString()} Founding Member spots claimed.</p>
      </SectionCard>

      <SectionCard
        title="Membership-tier gate"
        description="Paid membership tiers stay locked until the first 100 Founding Members qualify — unless you override. Those 100 keep a free account for life."
      >
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = override === o.v;
            return (
              <button
                key={String(o.v)}
                disabled={saving}
                onClick={() => onOverride(o.v)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition disabled:opacity-50 ${
                  active ? 'border-violet-500/50 bg-violet-500/15 text-violet-100' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-[11px] text-gray-500">{o.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-gray-500">Membership tiers:</span>
          <StatusBadge tone={progress.membershipTiersEnabled ? 'success' : 'neutral'}>
            {progress.membershipTiersEnabled ? 'Unlocked' : 'Locked'}
          </StatusBadge>
          <span className="text-gray-500">{progress.membershipUnlockReason}</span>
        </p>
      </SectionCard>

      <SectionCard title={`Founding Members (${data.founding.membersCount})`} description="Most recent qualified members. Numbers are immutable once assigned.">
        {data.founding.members.length === 0 ? (
          <p className="text-sm text-gray-500">No Founding Members yet. The first qualified user becomes {formatMemberNumber(1)}.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {data.founding.members.slice(0, 25).map((m) => (
              <li key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="font-semibold tabular-nums text-violet-300">{m.memberNumber != null ? formatMemberNumber(m.memberNumber) : 'Waitlist'}</span>
                <span className="capitalize text-gray-400">{m.sport ?? '—'}</span>
                <span className="text-xs text-gray-600">{new Date(m.qualifiedAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function ProfilePanel({ data }: { data: CIDashboard }) {
  const p = data.profileIntel;
  return (
    <div className="space-y-4">
      {p.distributions.map((d) => (
        <SectionCard key={d.dimension} title={d.dimension} description={d.suppressed ? 'Cohort too small to anonymize safely.' : `${d.total} players`}>
          {d.suppressed ? (
            <p className="text-sm text-gray-500">Suppressed — not enough data to show without risking identity.</p>
          ) : (
            <ul className="space-y-2">
              {d.buckets.map((b) => (
                <li key={b.label} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 capitalize text-gray-300">{b.label.replace('_', ' ')}</span>
                  <Bar pct={b.percent} />
                  <span className="w-12 text-right tabular-nums text-gray-400">{b.percent}%</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ))}

      <SectionCard title="Most-skipped required fields" description="The biggest profile-completion blockers.">
        <ul className="space-y-2">
          {p.topMissingFields.map((f) => (
            <li key={f.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{f.label}</span>
              <StatusBadge tone="warning">{f.count} missing</StatusBadge>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Completion funnel" description="Registered → qualified.">
        <ul className="space-y-2">
          {p.completionFunnel.map((s) => (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span className="w-44 shrink-0 text-gray-300">{s.label}</span>
              <Bar pct={s.conversionFromTop} color="bg-sky-500" />
              <span className="w-20 text-right tabular-nums text-gray-400">{s.count} ({s.conversionFromTop}%)</span>
            </li>
          ))}
        </ul>
        {p.biggestDropOff && (
          <p className="mt-3 text-xs text-amber-300">
            Biggest drop-off: {p.biggestDropOff.from} → {p.biggestDropOff.to} (−{p.biggestDropOff.lostPercent}%). Focus here first.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function SessionPanel({ data }: { data: CIDashboard }) {
  const s = data.sessionIntel;
  const totalSources = Object.values(s.sourceBreakdown).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricStat label="Avg sessions / user" value={s.avgSessionsPerUser.toFixed(1)} />
        <MetricStat label="Upload failure rate" value={`${s.uploadFailureRate}%`} tone={s.uploadFailureRate >= 10 ? 'warning' : 'success'} />
        <MetricStat label="Sports active" value={s.sessionsBySport.length} />
      </div>
      <SectionCard title="Sessions by source" description="Manual, video, launch monitor, simulator, image.">
        <ul className="space-y-2">
          {Object.entries(s.sourceBreakdown).map(([source, count]) => (
            <li key={source} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 capitalize text-gray-300">{source.replace('_', ' ')}</span>
              <Bar pct={(count / totalSources) * 100} color="bg-emerald-500" />
              <span className="w-10 text-right tabular-nums text-gray-400">{count}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Most common issues across sessions">
        <ul className="space-y-2">
          {s.topRecurringIssues.map((i) => (
            <li key={i.issue} className="flex items-center justify-between text-sm">
              <span className="capitalize text-gray-300">{i.issue}</span>
              <StatusBadge tone="info">{i.count}</StatusBadge>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function CoachingPanel({ data }: { data: CIDashboard }) {
  const c = data.coachingMemory;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricStat label="Plan completion" value={`${c.planCompletionRate}%`} tone="success" />
        <MetricStat label="Reported helpful" value={`${c.helpfulnessPct}%`} tone="success" />
        <MetricStat label="Recurring issues tracked" value={c.recurringIssues.length} />
      </div>
      <SectionCard title="Drill effectiveness" description="Completion + reported helpfulness by drill.">
        <ul className="space-y-3">
          {c.drillEffectiveness.map((d) => (
            <li key={d.drill} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{d.drill} <span className="text-xs text-gray-600">({d.sport})</span></span>
                <span className="text-xs text-gray-500">{d.helpfulPct}% helpful</span>
              </div>
              <div className="mt-1"><Bar pct={d.completionRate} color="bg-violet-500" /></div>
            </li>
          ))}
        </ul>
      </SectionCard>
      <HelpPanel title="How coaching memory works">
        <p>Recurring issues are detected from a user&apos;s own sessions and stored with higher importance so
          the next session prioritizes them. This is what lets the AI say &ldquo;your last three sessions show the
          same pattern&rdquo; instead of starting from scratch each time.</p>
      </HelpPanel>
    </div>
  );
}

function ExplorerPanel({ data }: { data: CIDashboard }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.users.filter((u) =>
      !needle || u.id.includes(needle) || u.primarySport.includes(needle) || u.skillLevel.includes(needle) || u.status.includes(needle),
    );
  }, [q, data.users]);
  return (
    <SectionCard
      title="User Intelligence Explorer"
      description="Search anonymized illustrative records. Real per-user inspection is access-controlled and logged (Data Governance)."
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by id, sport, skill, status…"
        aria-label="Search users"
        className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="py-2 pr-3">Athlete</th><th className="pr-3">Sport</th><th className="pr-3">Profile</th>
              <th className="pr-3">Sessions</th><th className="pr-3">Status</th><th className="pr-3">Top issue</th><th>Consent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map((u) => (
              <tr key={u.id} className="text-gray-300">
                <td className="py-2 pr-3 font-mono text-xs">{u.id}</td>
                <td className="pr-3 capitalize">{u.primarySport.replace('_', ' ')}</td>
                <td className="pr-3 tabular-nums">{u.profilePercent}%</td>
                <td className="pr-3 tabular-nums">{u.validSessions}</td>
                <td className="pr-3"><StatusBadge tone={u.status === 'qualified' ? 'success' : 'neutral'}>{u.status.replace(/_/g, ' ')}</StatusBadge></td>
                <td className="pr-3 text-gray-500">{u.recurringIssue ?? '—'}</td>
                <td><StatusBadge tone={u.consent === 'granted' ? 'success' : 'danger'}>{u.consent}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-4 text-center text-sm text-gray-600">No matching records.</p>}
      </div>
    </SectionCard>
  );
}

function GrowthOsPanel({ data, progress }: { data: CIDashboard; progress: FoundingCampaignProgress }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Founding Fathers campaign (GrowthOS view)" description="CentralIntelligenceOS feeds this campaign to GrowthOS as a major activation initiative.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricStat label="Status" value={progress.full ? 'Full' : 'Active'} tone={progress.full ? 'success' : 'default'} />
          <MetricStat label="Qualified" value={progress.qualifiedCount} />
          <MetricStat label="Conversion to qualified" value={`${Math.round((data.profileIntel.completionFunnel.at(-1)?.conversionFromTop ?? 0))}%`} />
          <MetricStat label="Membership readiness" value={progress.membershipTiersEnabled ? 'Ready' : 'Locked'} tone={progress.membershipTiersEnabled ? 'success' : 'warning'} />
        </div>
      </SectionCard>
      <SectionCard title="Recommended growth actions" description="Generated from platform signals.">
        <ul className="space-y-2">
          {data.recommendations.filter((r) => ['growth', 'retention', 'onboarding', 'content'].includes(r.area)).slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-start gap-2 text-sm">
              <StatusBadge tone={PRIORITY_TONE[r.priority]}>{r.priority}</StatusBadge>
              <span className="text-gray-300">{r.title}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      <HelpPanel title="GrowthOS integration">
        <p>The Founding Members campaign appears in GrowthOS as a launch-era activation campaign. The
          membership-tier strategy stays locked until 100 members qualify — keeping the free-first
          go-to-market intact.</p>
      </HelpPanel>
    </div>
  );
}

function GovernancePanel({ data }: { data: CIDashboard }) {
  const g = data.governance;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Consent records" value={g.consentRecords} />
        <MetricStat label="Export requests" value={g.exportRequests} />
        <MetricStat label="Delete requests" value={g.deleteRequests} />
        <MetricStat label="Sensitive flags" value={g.sensitiveDataFlags} tone={g.sensitiveDataFlags === 0 ? 'success' : 'warning'} />
        <MetricStat label="Personalization opt-in" value={`${Math.round((g.personalizationGranted / g.consentRecords) * 100)}%`} />
        <MetricStat label="Product-improvement opt-in" value={`${Math.round((g.productImprovementGranted / g.consentRecords) * 100)}%`} />
        <MetricStat label="Anonymization health" value={`${g.anonymizationHealthPct}%`} tone="success" />
        <MetricStat label="Missing purpose labels" value={g.missingPurposeLabels} tone={g.missingPurposeLabels === 0 ? 'success' : 'warning'} />
      </div>
      <SectionCard title="Our data ethics" description="The promises surfaced to users — enforced in code.">
        <ul className="space-y-2 text-sm text-gray-300">
          {Object.values(DATA_ETHICS).map((line) => (
            <li key={line} className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      <HelpPanel title="Privacy review items (before public launch)">
        <p>Real per-user inspection should write an audit log entry; data export/delete pathways should be
          finalized with legal. See docs/CENTRAL_INTELLIGENCE_OS.md for the full checklist.</p>
      </HelpPanel>
    </div>
  );
}

function RecommendationsPanel({ data }: { data: CIDashboard }) {
  return (
    <div className="space-y-3">
      {data.recommendations.length === 0 && (
        <SectionCard><p className="text-sm text-gray-400">No recommendations right now — the platform signals look healthy.</p></SectionCard>
      )}
      {data.recommendations.map((r) => (
        <SectionCard key={r.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={PRIORITY_TONE[r.priority]}>{r.priority}</StatusBadge>
                <h3 className="font-semibold text-gray-100">{r.title}</h3>
              </div>
              <p className="mt-1 text-sm text-gray-400">{r.rationale}</p>
              <p className="mt-1 text-xs text-gray-500"><strong>Impact:</strong> {r.expectedImpact}</p>
              <p className="mt-0.5 text-xs text-gray-500"><strong>How:</strong> {r.suggestedImplementation}</p>
            </div>
            <span className="shrink-0 text-[11px] uppercase tracking-wide text-gray-600">{r.area.replace('_', ' ')}</span>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
