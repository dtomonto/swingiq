'use client';

import { useState } from 'react';
import {
  Play, RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, ChevronDown, ChevronUp, Info,
  Database, Shield, Zap, BookOpen, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BASELINE_VERSION, CURATED_SOURCES, PROMPT_VERSION, TARGET_WINDOWS } from '@swingiq/core';

// ──────────────────────────────────────────────────────────────
// Types for local state
// ──────────────────────────────────────────────────────────────

interface RunResult {
  run: {
    id: string;
    status: string;
    sources_reviewed: number;
    sources_accepted: number;
    proposals_created: number;
    summary: string | null;
    errors: string[];
    completed_at: string | null;
  };
  proposals: Array<{
    id: string;
    metric_name: string;
    club_type: string;
    change_type: string;
    risk_level: string;
    confidence_score: number;
    review_status: string;
    rationale: string;
  }>;
  next_scheduled_at: string;
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: CheckCircle },
    running:   { color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: RefreshCw },
    failed:    { color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: XCircle },
    pending:   { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: Clock },
    approved:  { color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: CheckCircle },
    rejected:  { color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: XCircle },
    deferred:  { color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', icon: Clock },
  }[status] ?? { color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', icon: Info };

  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm border font-medium', config.color)}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const config = {
    low:    'text-green-400 bg-green-400/10 border-green-400/30',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    high:   'text-red-400 bg-red-400/10 border-red-400/30',
  }[risk] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/30';

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-sm border font-medium', config)}>
      {risk} risk
    </span>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-800/50">
        <Icon className="w-4 h-4 text-green-400" />
        <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export function ResearchAdminContent() {
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isDryRun, setIsDryRun] = useState(true);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [scope, setScope] = useState<string>('full');
  // Admin secret entered at runtime — never from NEXT_PUBLIC_ env vars
  const [adminSecret, setAdminSecret] = useState('');

  const triggerRun = async () => {
    if (!adminSecret.trim()) {
      setRunError('Enter the admin secret before triggering a run.');
      return;
    }
    setIsRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          scope: scope === 'full' ? ['full'] : [scope],
          dry_run: isDryRun,
          triggered_by: 'admin',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error ?? `Server returned ${res.status}`);
      }

      const data = await res.json();
      setRunResult(data);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  // Current benchmark overview data
  const benchmarkClubs = Object.keys(TARGET_WINDOWS);
  const totalMetrics = benchmarkClubs.reduce(
    (acc, club) => acc + Object.keys(TARGET_WINDOWS[club] ?? {}).length, 0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">
          Golf Research &amp; Benchmark Evolution
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          90-day research cycle · evidence-backed benchmark updates · admin review workflow
        </p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Version', value: BASELINE_VERSION.version, icon: Database, color: 'text-green-400' },
          { label: 'Total Metrics', value: totalMetrics, icon: BarChart2, color: 'text-blue-400' },
          { label: 'Curated Sources', value: CURATED_SOURCES.length, icon: BookOpen, color: 'text-purple-400' },
          { label: 'Prompt Version', value: PROMPT_VERSION, icon: Zap, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <stat.icon className={cn('w-4 h-4 mb-2', stat.color)} />
            <p className={cn('text-lg font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Research run trigger */}
      <SectionCard title="Trigger Research Run" icon={Play}>
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
            <strong>⚠ How this works:</strong> Triggering a research run evaluates {CURATED_SOURCES.length} curated
            sources, scores their credibility, uses the configured AI provider to summarize findings,
            and generates benchmark change proposals. No benchmarks are changed automatically —
            all proposals require your review before being applied.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="research-scope" className="text-xs font-medium text-gray-400 mb-1 block">Research scope</label>
              <select
                id="research-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-hidden"
              >
                <option value="full">Full (all domains)</option>
                <option value="launch_monitor_benchmarks">Launch Monitor Benchmarks</option>
                <option value="biomechanics">Biomechanics</option>
                <option value="practice_science">Practice Science</option>
                <option value="equipment_technology">Equipment &amp; Technology</option>
                <option value="drill_library">Drill Library</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Mode</label>
              <div className="flex gap-2">
                {[
                  { value: true, label: 'Dry Run (no persist)' },
                  { value: false, label: 'Live Run (persist)' },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setIsDryRun(opt.value)}
                    className={cn(
                      'flex-1 text-xs py-2 rounded-lg border transition-colors',
                      isDryRun === opt.value
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="research-admin-secret" className="text-xs font-medium text-gray-400 mb-1 block">Admin Secret</label>
            <input
              id="research-admin-secret"
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter ADMIN_SECRET to authenticate"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-green-500"
            />
            <p className="text-xs text-gray-600 mt-1">Never stored — entered each session. Set ADMIN_SECRET in your environment.</p>
          </div>

          <button
            onClick={triggerRun}
            disabled={isRunning || !adminSecret.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
              isRunning
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white',
            )}
          >
            {isRunning ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Running research workflow…</>
            ) : (
              <><Play className="w-4 h-4" /> {isDryRun ? 'Dry Run' : 'Trigger Research Run'}</>
            )}
          </button>

          {runError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {runError}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Run results */}
      {runResult && (
        <SectionCard title="Run Results" icon={CheckCircle}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={runResult.run.status} />
              <span className="text-xs text-gray-400">
                {runResult.run.sources_reviewed} sources reviewed ·{' '}
                {runResult.run.sources_accepted} accepted ·{' '}
                {runResult.run.proposals_created} proposals generated
              </span>
            </div>

            {runResult.run.summary && (
              <div className="rounded-lg bg-gray-800 p-3">
                <p className="text-xs font-semibold text-gray-400 mb-1">Summary</p>
                <p className="text-sm text-gray-300 leading-relaxed">{runResult.run.summary}</p>
              </div>
            )}

            {runResult.run.errors.length > 0 && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs font-semibold text-red-400 mb-2">Errors during run:</p>
                <ul className="space-y-1">
                  {runResult.run.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-300">• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Next scheduled run: {new Date(runResult.next_scheduled_at).toLocaleDateString()}
            </p>
          </div>
        </SectionCard>
      )}

      {/* Proposals from run */}
      {runResult && runResult.proposals.length > 0 && (
        <SectionCard title={`Benchmark Change Proposals (${runResult.proposals.length})`} icon={AlertTriangle}>
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
              Review each proposal below. Approve low-risk changes from high-credibility sources.
              Reject anything that lacks sufficient evidence. Changes only apply after your approval
              and are published as a new benchmark version.
            </div>

            {runResult.proposals.map((proposal) => (
              <div key={proposal.id} className="rounded-xl border border-gray-700 bg-gray-800 overflow-hidden">
                <button
                  onClick={() => setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-750 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-200">{proposal.metric_name}</span>
                      <span className="text-xs text-gray-500">({proposal.club_type})</span>
                      <RiskBadge risk={proposal.risk_level} />
                      <StatusBadge status={proposal.review_status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{proposal.rationale}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{proposal.confidence_score}% confidence</span>
                    {expandedProposal === proposal.id
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>

                {expandedProposal === proposal.id && (
                  <div className="border-t border-gray-700 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">Change type</p>
                        <p className="text-gray-300">{proposal.change_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Confidence</p>
                        <p className="text-gray-300">{proposal.confidence_score}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rationale</p>
                      <p className="text-sm text-gray-300">{proposal.rationale}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await fetch('/api/research/proposals', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ proposal_id: proposal.id, action: 'approve' }),
                          });
                        }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={async () => {
                          await fetch('/api/research/proposals', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ proposal_id: proposal.id, action: 'reject' }),
                          });
                        }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={async () => {
                          await fetch('/api/research/proposals', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ proposal_id: proposal.id, action: 'defer' }),
                          });
                        }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" /> Defer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Current benchmarks overview */}
      <SectionCard title="Current Benchmark Library" icon={Database}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-200">Version {BASELINE_VERSION.version}</p>
              <p className="text-xs text-gray-400">{BASELINE_VERSION.description.slice(0, 120)}…</p>
            </div>
            <StatusBadge status={BASELINE_VERSION.status} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400 font-medium">Club</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Face-to-Path ideal</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Smash factor ideal</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Spin rate ideal</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Launch angle ideal</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(TARGET_WINDOWS).map(([club, w]) => (
                  <tr key={club} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-2 text-gray-300 font-medium capitalize">{club.replace('_', ' ')}</td>
                    <td className="py-2 text-right text-gray-400">{w.face_to_path.ideal}° ({w.face_to_path.min}–{w.face_to_path.max})</td>
                    <td className="py-2 text-right text-gray-400">{w.smash_factor.ideal}</td>
                    <td className="py-2 text-right text-gray-400">{w.spin_rate.ideal.toLocaleString()} rpm</td>
                    <td className="py-2 text-right text-gray-400">{w.launch_angle.ideal}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* Source library */}
      <SectionCard title={`Curated Research Sources (${CURATED_SOURCES.length})`} icon={BookOpen}>
        <div className="space-y-2">
          {CURATED_SOURCES.map((source, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
              <Shield className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{source.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{source.publisher} · {source.scope.join(', ')}</p>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 shrink-0"
              >
                View →
              </a>
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">
            Sources are evaluated for credibility before being used to generate benchmark proposals.
            See source-evaluator.ts for scoring logic.
          </p>
        </div>
      </SectionCard>

      {/* Privacy & responsible learning */}
      <SectionCard title="Privacy &amp; Responsible Learning" icon={Shield}>
        <div className="space-y-2 text-xs text-gray-400">
          {[
            '✓ No private user videos are processed by the research system',
            '✓ No private user data is passed to LLM providers during research',
            '✓ User feedback is aggregated by segment — never by individual',
            '✓ Benchmarks can only change via evidence-backed proposals + admin approval',
            '✓ All research runs are logged with full audit trail',
            '✓ Copyrighted content is never reproduced — summaries and citations only',
            '✓ YouTube search links only — no hardcoded video URLs',
            '✓ High-risk proposals require manual admin approval regardless of confidence',
          ].map((rule, i) => (
            <p key={i} className="text-green-400/80">{rule}</p>
          ))}
        </div>
      </SectionCard>

      {/* Production TODO */}
      <SectionCard title="Production Deployment Checklist" icon={AlertTriangle}>
        <div className="space-y-2 text-xs text-amber-400">
          {[
            '[ ] Run server/supabase_schema_research.sql in Supabase SQL editor',
            '[ ] Set ADMIN_SECRET environment variable in Vercel dashboard',
            '[ ] Set CRON_SECRET environment variable (must match vercel.json cron auth)',
            '[ ] Set AI_PROVIDER + API key (OPENAI_API_KEY or ANTHROPIC_API_KEY)',
            '[ ] Deploy vercel.json — cron runs every 90 days (quarterly)',
            '[ ] Replace in-memory benchmark registry with DB-backed version',
            '[ ] Add Supabase RLS policies for research tables',
            '[ ] Test dry run before first live research run',
            '[ ] Review and approve/reject any generated proposals before v1.1.0 publish',
          ].map((item, i) => (
            <p key={i}>{item}</p>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
