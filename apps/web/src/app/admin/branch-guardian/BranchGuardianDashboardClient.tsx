'use client';

// ============================================================
// BranchGuardianOS — dashboard (CLIENT)
// ------------------------------------------------------------
// Re-runs the PURE scanSnapshot() with the operator's settings (so thresholds
// are live), applies the recommendation owner overlay, and renders the tabbed
// cockpit: Overview · Branches · Worktrees · Recommendations · Audit Log ·
// Settings · Monthly. Cleanup commands are copy-paste only — destructive ones
// sit behind an explicit approval and are NEVER executed by the app.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, CalendarClock, Check, ChevronRight, Clipboard, Clock,
  GitBranch, ListChecks, RefreshCw, ScrollText, Settings as SettingsIcon, ShieldCheck,
  TrendingUp, Trash2,
} from 'lucide-react';
import { MetricStat } from '@/components/admin/MetricStat';
import {
  CleanlinessDial, HealthBar, Panel, RiskPill, SeverityPill, CommandSafetyPill, RecSafetyPill, Sparkline,
} from '@/components/branch-guardian/BranchGuardianUI';
import { useBranchGuardian } from '@/lib/branch-guardian/useBranchGuardian';
import { scanSnapshot, type BranchGuardianScanResult } from '@/lib/branch-guardian/scan';
import {
  BRANCH_STATUS_LABEL, BRANCH_TYPE_LABEL, REC_STATUS_LABEL,
  type BranchGuardianSnapshot, type CommandSuggestion, type Recommendation,
  type RecStatus, type ScoredBranch, type ScoredWorktree,
} from '@/lib/branch-guardian/types';

interface Props {
  actor: string;
  snapshot: BranchGuardianSnapshot;
  initialScan: BranchGuardianScanResult;
}

type TabId = 'overview' | 'branches' | 'worktrees' | 'recommendations' | 'audit' | 'settings' | 'monthly';

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'worktrees', label: 'Worktrees', icon: GitBranch },
  { id: 'recommendations', label: 'Recommendations', icon: ListChecks },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'monthly', label: 'Monthly', icon: CalendarClock },
];

export function BranchGuardianDashboardClient({ actor, snapshot, initialScan }: Props) {
  const bg = useBranchGuardian();
  const [tab, setTab] = useState<TabId>('overview');

  useEffect(() => {
    if (actor) bg.setActor(actor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  // Re-run the pure scan with the operator's live settings (after hydration).
  const scan = useMemo(
    () => (bg.ready ? scanSnapshot(snapshot, bg.settings) : initialScan),
    [bg.ready, bg.settings, snapshot, initialScan],
  );

  // Record one cleanliness snapshot per day so the trend accrues.
  useEffect(() => {
    if (!bg.ready) return;
    bg.recordSnapshot({
      cleanliness: scan.cleanliness.value,
      staleBranches: scan.cleanliness.counts.staleBranches,
      worktreesNeedingReview: scan.cleanliness.counts.worktreesNeedingReview,
      highRisk: scan.cleanliness.counts.highRiskBranches,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg.ready]);

  if (!scan.isGitRepo) return <NoSnapshot />;

  return (
    <div className="space-y-6">
      <FreshnessBanner scan={scan} />

      <div className="flex flex-wrap gap-1.5 border-b border-gray-800 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? 'bg-emerald-500/90 text-gray-950' : 'border border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab scan={scan} bg={bg} onJump={setTab} />}
      {tab === 'branches' && <BranchesTab branches={scan.branches} />}
      {tab === 'worktrees' && <WorktreesTab worktrees={scan.worktrees} />}
      {tab === 'recommendations' && <RecommendationsTab scan={scan} bg={bg} />}
      {tab === 'audit' && <AuditTab bg={bg} />}
      {tab === 'settings' && <SettingsTab bg={bg} detectedMain={snapshot.mainBranch} />}
      {tab === 'monthly' && <MonthlyTab scan={scan} bg={bg} />}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({
  scan, bg, onJump,
}: { scan: BranchGuardianScanResult; bg: ReturnType<typeof useBranchGuardian>; onJump: (t: TabId) => void }) {
  const c = scan.cleanliness.counts;
  const openRecs = useMemo(() => activeRecommendations(scan.recommendations, bg.overrides), [scan.recommendations, bg.overrides]);
  const today = openRecs.slice(0, 6);

  return (
    <div className="space-y-6">
      {scan.inProgressOp && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          An in-progress <strong>{scan.inProgressOp}</strong> is open on <code>{scan.currentBranch}</code>. Finish or abort it before switching work.
        </div>
      )}

      <section className="grid gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5 sm:grid-cols-[auto,1fr]">
        <div className="flex flex-col items-center justify-center gap-2">
          <CleanlinessDial value={scan.cleanliness.value} band={scan.cleanliness.band} />
          <p className="text-xs text-gray-500">Git Cleanliness Score</p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <CountTile label="Branches" value={c.branches} />
            <CountTile label="Active" value={c.activeBranches} tone="good" />
            <CountTile label="Stale" value={c.staleBranches} tone={c.staleBranches > 0 ? 'warning' : 'muted'} />
            <CountTile label="Merged-eligible" value={c.mergedEligible} tone={c.mergedEligible > 0 ? 'warning' : 'muted'} />
            <CountTile label="Worktrees" value={c.worktrees} />
            <CountTile label="Need review" value={c.worktreesNeedingReview} tone={c.worktreesNeedingReview > 0 ? 'warning' : 'muted'} />
            <CountTile label="High-risk" value={c.highRiskBranches} tone={c.highRiskBranches > 0 ? 'danger' : 'muted'} />
            <CountTile label="Risky untracked" value={c.riskyUntracked} tone={c.riskyUntracked > 0 ? 'danger' : 'muted'} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onJump('recommendations')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-sm font-medium text-gray-950 hover:bg-emerald-400">
              <ListChecks className="h-4 w-4" /> Recommendations ({openRecs.length})
            </button>
            <button onClick={() => onJump('branches')} className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-gray-800">
              <GitBranch className="h-4 w-4" /> Branches
            </button>
            <button onClick={() => onJump('worktrees')} className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-gray-800">
              <GitBranch className="h-4 w-4" /> Worktrees
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recommended actions today" hint={`${today.length} of ${openRecs.length} open item(s)`}>
          {today.length === 0 ? (
            <p className="text-xs text-gray-500">Nothing needs attention — the repo is tidy. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {today.map((r) => (
                <li key={r.id}>
                  <button onClick={() => onJump('recommendations')} className="group flex w-full items-start justify-between gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2.5 text-left hover:border-gray-700">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5"><SeverityPill severity={r.severity} /><RecSafetyPill safety={r.safety} /></div>
                      <p className="mt-1 truncate text-sm text-gray-200">{r.title}</p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-600 group-hover:text-gray-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="What's driving the score" hint="Transparent factor breakdown.">
          <ul className="space-y-1.5">
            {scan.cleanliness.factors.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-300">{f.label}</span>
                {f.delta !== 0 && <span className={`tabular-nums ${f.delta < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{f.delta > 0 ? '+' : ''}{f.delta}</span>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ── Branches ─────────────────────────────────────────────────────────────────

function BranchesTab({ branches }: { branches: ScoredBranch[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = branches.filter((b) =>
    (status === 'all' || b.status === status) && b.name.toLowerCase().includes(q.toLowerCase()),
  );
  const statuses = Array.from(new Set(branches.map((b) => b.status)));

  return (
    <Panel title={`Branches (${filtered.length}/${branches.length})`} hint="Health, status and the next step for every local branch.">
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search branches…"
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-600" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200">
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{BRANCH_STATUS_LABEL[s]}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {filtered.map((b) => (
          <details key={b.name} className="group rounded-lg border border-gray-800 bg-gray-950 p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-mono text-sm text-gray-100">{b.name}</span>
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">{BRANCH_TYPE_LABEL[b.type]}</span>
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">{BRANCH_STATUS_LABEL[b.status]}</span>
                  <RiskPill risk={b.risk} />
                  {b.isProtected && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {b.ageDays !== null ? `${b.ageDays}d old` : 'age unknown'} · {b.aheadOfMain ?? '?'}↑/{b.behindMain ?? '?'}↓ main · {b.upstream ? b.upstream : 'no upstream'}{b.hasWorktree ? ' · has worktree' : ''}
                </p>
              </div>
              <div className="w-28 shrink-0"><HealthBar value={b.health.value} band={b.health.band} /></div>
            </summary>
            <div className="mt-3 space-y-2 border-t border-gray-800 pt-3 text-xs text-gray-400">
              <p className="text-gray-300">{b.suggestedAction}</p>
              <ul className="space-y-1">
                {b.health.factors.length === 0 ? <li className="text-gray-500">No deductions — healthy.</li> : b.health.factors.map((f, i) => (
                  <li key={i} className="flex justify-between"><span>{f.label}</span><span className="tabular-nums text-red-300">{f.delta}</span></li>
                ))}
              </ul>
              {!b.conformsToNaming && <p className="text-amber-300">Naming: {b.namingReason}</p>}
            </div>
          </details>
        ))}
        {filtered.length === 0 && <p className="text-xs text-gray-500">No branches match.</p>}
      </div>
    </Panel>
  );
}

// ── Worktrees ────────────────────────────────────────────────────────────────

function WorktreesTab({ worktrees }: { worktrees: ScoredWorktree[] }) {
  return (
    <Panel title={`Worktrees (${worktrees.length})`} hint="Every git worktree, its health and the next step.">
      <div className="space-y-2">
        {worktrees.map((w) => (
          <details key={w.path} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-mono text-sm text-gray-100">{w.path}</span>
                  {w.isPrimary && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">primary</span>}
                  <RiskPill risk={w.risk} />
                  {w.missingPath && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">missing path</span>}
                  {w.prunable && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">prunable</span>}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {w.branch ? <span className="font-mono">{w.branch}</span> : 'detached'} · {w.ageDays !== null ? `${w.ageDays}d` : 'age unknown'}
                  {w.dirty ? ` · ${w.dirty.modified} changed, ${w.dirty.untracked} untracked` : ' · status unread'}
                </p>
              </div>
              <div className="w-28 shrink-0"><HealthBar value={w.health.value} band={w.health.band} /></div>
            </summary>
            <div className="mt-3 space-y-2 border-t border-gray-800 pt-3 text-xs text-gray-400">
              <p className="text-gray-300">{w.suggestedAction}</p>
              {(w.dirty?.untrackedRisky.length ?? 0) > 0 && (
                <p className="text-red-300">Risky untracked: {w.dirty?.untrackedRisky.map((r) => `${r.kind}:${r.path}`).join(', ')}</p>
              )}
              <ul className="space-y-1">
                {w.health.factors.length === 0 ? <li className="text-gray-500">No deductions — healthy.</li> : w.health.factors.map((f, i) => (
                  <li key={i} className="flex justify-between"><span>{f.label}</span><span className="tabular-nums text-red-300">{f.delta}</span></li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </Panel>
  );
}

// ── Recommendations ──────────────────────────────────────────────────────────

function RecommendationsTab({ scan, bg }: { scan: BranchGuardianScanResult; bg: ReturnType<typeof useBranchGuardian> }) {
  const [showDone, setShowDone] = useState(false);
  const ranked = scan.recommendations;
  const open = ranked.filter((r) => effectiveStatus(r, bg.overrides) === 'open');
  const done = ranked.filter((r) => effectiveStatus(r, bg.overrides) !== 'open');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{open.length} open · {done.length} handled</p>
        <button onClick={() => setShowDone((v) => !v)} className="text-xs text-gray-400 underline hover:text-gray-200">
          {showDone ? 'Hide' : 'Show'} handled
        </button>
      </div>
      {open.length === 0 && <p className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">No open recommendations — the repo is tidy. 🎉</p>}
      {open.map((r) => <RecCard key={r.id} rec={r} bg={bg} status="open" />)}
      {showDone && done.map((r) => <RecCard key={r.id} rec={r} bg={bg} status={effectiveStatus(r, bg.overrides)} />)}
    </div>
  );
}

function RecCard({ rec, bg, status }: { rec: Recommendation; bg: ReturnType<typeof useBranchGuardian>; status: RecStatus }) {
  const approved = status === 'cleanup_approved';
  const set = (s: RecStatus) => bg.setRecStatus(rec.id, s, { title: rec.title });

  function approveCleanup() {
    if (window.confirm(
      `Approve cleanup for "${rec.title}"?\n\nThis ONLY reveals the destructive command(s) for you to copy. ` +
      `BranchGuardianOS never runs git for you — you must paste and run the command yourself after backing up.`,
    )) {
      set('cleanup_approved');
    }
  }

  return (
    <article className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <SeverityPill severity={rec.severity} />
        <RecSafetyPill safety={rec.safety} />
        {rec.approvalRequired && <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-300">Approval required</span>}
        {status !== 'open' && <span className="rounded-full border border-gray-600/50 bg-gray-700/40 px-2 py-0.5 text-[11px] text-gray-300">{REC_STATUS_LABEL[status]}</span>}
      </div>
      <h4 className="mt-2 text-sm font-semibold text-gray-100">{rec.title}</h4>
      <p className="mt-1 text-sm text-gray-400">{rec.reason}</p>

      {rec.evidence.length > 0 && (
        <details className="mt-2 text-xs text-gray-400">
          <summary className="cursor-pointer text-gray-500">Evidence ({rec.evidence.length})</summary>
          <ul className="mt-1 space-y-0.5">{rec.evidence.map((e, i) => <li key={i}>• {e}</li>)}</ul>
        </details>
      )}

      {rec.recovery.length > 0 && (
        <div className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5 text-xs text-sky-200">
          <p className="font-semibold">Before you act — recovery first:</p>
          <ul className="mt-1 space-y-0.5">{rec.recovery.map((e, i) => <li key={i}>• {e}</li>)}</ul>
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        {rec.commands.map((cmd, i) => (
          <CommandRow key={i} cmd={cmd} gated={cmd.safety === 'destructive' && !approved} onCopy={() => {
            bg.recordAudit({ action: 'command.copy', entityType: 'branch-guardian-command', entityId: rec.id, summary: `Copied: ${cmd.command}`, metadata: { safety: cmd.safety } });
          }} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {rec.approvalRequired && !approved && (
          <button onClick={approveCleanup} className="inline-flex items-center gap-1 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-gray-950 hover:bg-red-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Approve cleanup
          </button>
        )}
        {status !== 'reviewed' && <ActionBtn onClick={() => set('reviewed')} icon={Check} label="Mark reviewed" />}
        {status !== 'snoozed' && <ActionBtn onClick={() => bg.setRecStatus(rec.id, 'snoozed', { title: rec.title, snoozeDays: 7 })} icon={Clock} label="Snooze 7d" />}
        {status !== 'dismissed' && <ActionBtn onClick={() => set('dismissed')} icon={Trash2} label="Dismiss" />}
        {status !== 'open' && <ActionBtn onClick={() => bg.clearOverride(rec.id)} icon={RefreshCw} label="Reopen" />}
        {rec.relatedLinks.map((l) => (
          <a key={l.href} href={l.href} className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">{l.label}</a>
        ))}
      </div>
    </article>
  );
}

function CommandRow({ cmd, gated, onCopy }: { cmd: CommandSuggestion; gated: boolean; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (gated) return;
    try {
      navigator.clipboard?.writeText(cmd.command);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — ignore */ }
  }
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">{cmd.label}</span>
        <div className="flex items-center gap-1.5">
          <CommandSafetyPill safety={cmd.safety} />
          <button onClick={copy} disabled={gated}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${gated ? 'cursor-not-allowed text-gray-600' : 'text-gray-300 hover:bg-gray-800'}`}>
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}{gated ? 'Approve to copy' : copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <code className={`mt-1 block overflow-x-auto whitespace-pre rounded bg-black/40 px-2 py-1 font-mono text-[11px] ${gated ? 'blur-[3px] select-none text-gray-600' : 'text-gray-200'}`}>{cmd.command}</code>
      {cmd.note && !gated && <p className="mt-1 text-[10px] text-gray-500">{cmd.note}</p>}
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, label }: { onClick: () => void; icon: typeof Check; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// ── Audit log ────────────────────────────────────────────────────────────────

function AuditTab({ bg }: { bg: ReturnType<typeof useBranchGuardian> }) {
  return (
    <Panel title={`Audit log (${bg.auditLog.length})`} hint="Every BranchGuardianOS action, saved locally and redacted." actions={
      bg.auditLog.length > 0 ? <button onClick={bg.clearAudit} className="text-xs text-gray-400 underline hover:text-gray-200">Clear</button> : undefined
    }>
      {bg.auditLog.length === 0 ? (
        <p className="text-xs text-gray-500">No actions yet. Reviewing, snoozing, approving or copying a command will appear here.</p>
      ) : (
        <ul className="space-y-1.5">
          {bg.auditLog.slice(0, 100).map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950 p-2 text-xs">
              <div className="min-w-0">
                <p className="text-gray-300">{e.summary}</p>
                <p className="text-[10px] text-gray-600">{e.action} · {e.actor}</p>
              </div>
              <time className="shrink-0 text-[10px] text-gray-600">{new Date(e.at).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

function SettingsTab({ bg, detectedMain }: { bg: ReturnType<typeof useBranchGuardian>; detectedMain: string | null }) {
  const s = bg.settings;
  return (
    <Panel title="Settings" hint="Tune thresholds and rules. Saved in your browser; the scan re-scores live." actions={
      <button onClick={bg.resetSettings} className="text-xs text-gray-400 underline hover:text-gray-200">Reset</button>
    }>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumField label="Stale branch threshold (days)" value={s.staleBranchDays} onChange={(v) => bg.updateSettings({ staleBranchDays: v })} />
        <NumField label="Abandoned branch threshold (days)" value={s.abandonedBranchDays} onChange={(v) => bg.updateSettings({ abandonedBranchDays: v })} />
        <NumField label="Stale worktree threshold (days)" value={s.staleWorktreeDays} onChange={(v) => bg.updateSettings({ staleWorktreeDays: v })} />
        <NumField label="Behind-main threshold (commits)" value={s.behindMainThreshold} onChange={(v) => bg.updateSettings({ behindMainThreshold: v })} />
        <NumField label="Audit log retention (entries)" value={s.auditLogRetention} onChange={(v) => bg.updateSettings({ auditLogRetention: v })} />
        <div>
          <label htmlFor="bg-main-branch" className="block text-xs text-gray-400">Main branch override</label>
          <input id="bg-main-branch" value={s.mainBranchOverride} onChange={(e) => bg.updateSettings({ mainBranchOverride: e.target.value })}
            placeholder={detectedMain ?? 'detected automatically'}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200" />
          <p className="mt-0.5 text-[10px] text-gray-600">Detected: {detectedMain ?? 'unknown'}. Leave blank to use it.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bg-protected-patterns" className="block text-xs text-gray-400">Extra protected branch patterns (comma-separated, supports trailing /*)</label>
          <input id="bg-protected-patterns" value={s.protectedPatterns.join(', ')} onChange={(e) => bg.updateSettings({ protectedPatterns: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
            placeholder="e.g. integration/*, demo"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200" />
          <p className="mt-0.5 text-[10px] text-gray-600">Always protected: main, master, production, staging, develop, release/*, hotfix/*.</p>
        </div>
        <Toggle label="Include experiment/* branches in stale flags" checked={s.includeExperimental} onChange={(v) => bg.updateSettings({ includeExperimental: v })} />
        <Toggle label="Include remote-only branches in views" checked={s.includeRemote} onChange={(v) => bg.updateSettings({ includeRemote: v })} />
      </div>
    </Panel>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-400">{label}</label>
      <input type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-gray-200" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-700 bg-gray-950" />
      {label}
    </label>
  );
}

// ── Monthly ──────────────────────────────────────────────────────────────────

function MonthlyTab({ scan, bg }: { scan: BranchGuardianScanResult; bg: ReturnType<typeof useBranchGuardian> }) {
  const trend = bg.history.map((h) => h.cleanliness);
  return (
    <div className="space-y-4">
      <Panel title="Monthly hygiene review" hint="BranchGuardianOS runs on a monthly cadence (npm run scan:branches).">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricStat label="Cleanliness" value={scan.cleanliness.value} icon={ShieldCheck} tone={scan.cleanliness.value >= 70 ? 'success' : 'warning'} />
          <MetricStat label="Stale branches" value={scan.cleanliness.counts.staleBranches} icon={GitBranch} tone={scan.cleanliness.counts.staleBranches > 0 ? 'warning' : 'muted'} />
          <MetricStat label="Worktrees to review" value={scan.cleanliness.counts.worktreesNeedingReview} icon={Activity} tone={scan.cleanliness.counts.worktreesNeedingReview > 0 ? 'warning' : 'muted'} />
        </div>
      </Panel>
      <Panel title="Cleanliness trend" hint="One snapshot per day you visit (full monthly reports are a fast-follow).">
        <div className="flex items-center gap-3"><TrendingUp className="h-4 w-4 text-emerald-400" /><Sparkline points={trend} /></div>
      </Panel>
    </div>
  );
}

// ── shared bits ──────────────────────────────────────────────────────────────

function FreshnessBanner({ scan }: { scan: BranchGuardianScanResult }) {
  const f = scan.snapshotFreshness;
  const when = f.generatedAt ? new Date(f.generatedAt).toLocaleString() : 'unknown';
  const age = f.ageHours === null ? '' : f.ageHours < 48 ? `${f.ageHours}h ago` : `${Math.round(f.ageHours / 24)}d ago`;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-xs ${f.stale ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-gray-800 bg-gray-900 text-gray-400'}`}>
      <span>Snapshot as of <strong>{when}</strong>{age && ` (${age})`} · main <code>{scan.mainBranch}</code> · current <code>{scan.currentBranch}</code></span>
      <span className="text-gray-500">Refresh with <code>npm run scan:branches</code></span>
    </div>
  );
}

function CountTile({ label, value, tone = 'muted' }: { label: string; value: number; tone?: 'good' | 'warning' | 'danger' | 'muted' }) {
  const cls =
    value === 0 && tone !== 'good'
      ? 'border-gray-800 text-gray-500'
      : tone === 'danger'
        ? 'border-red-500/40 text-red-300'
        : tone === 'warning'
          ? 'border-amber-500/40 text-amber-300'
          : tone === 'good'
            ? 'border-emerald-500/40 text-emerald-300'
            : 'border-gray-700 text-gray-300';
  return (
    <div className={`rounded-lg border bg-gray-950 p-3 text-center ${cls}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function NoSnapshot() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-100">
      <p className="font-semibold">No git snapshot found.</p>
      <p className="mt-1 text-amber-200/80">Generate the inventory with <code className="rounded bg-black/30 px-1">npm run scan:branches</code>, commit the result, and reload. BranchGuardianOS never runs git from the app — it reads the committed snapshot.</p>
    </div>
  );
}

// ── owner-overlay helpers ────────────────────────────────────────────────────

function effectiveStatus(rec: Recommendation, overrides: ReturnType<typeof useBranchGuardian>['overrides']): RecStatus {
  const o = overrides[rec.id];
  if (!o) return 'open';
  if (o.status === 'snoozed' && o.snoozedUntil && Date.parse(o.snoozedUntil) < Date.now()) return 'open';
  return o.status;
}

function activeRecommendations(recs: Recommendation[], overrides: ReturnType<typeof useBranchGuardian>['overrides']): Recommendation[] {
  return recs.filter((r) => effectiveStatus(r, overrides) === 'open');
}
