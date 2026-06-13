// ============================================================
// /admin/deterministic-engine — Deterministic Diagnosis Engine
// ------------------------------------------------------------
// Read-only operator view of the token-free symptom→cause engine: per-sport
// rule/fault coverage, the golden-scenario evaluation lab (pass/fail +
// confidence + escalation), and the confidence distribution. Everything here is
// computed by PURE engine functions (no AI, no I/O), so it is safe to render on
// every load. Read = logs.view (enforced by the admin layout + nav gating).
// See docs/deterministic-intelligence.md.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { BrainCircuit, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { getDeterministicEngineStatus, runGoldenScenarios } from '@/lib/intelligence/coverage';
import { TIER_OP } from '@/lib/intelligence/tiers';
import { estimateCostCents } from '@/lib/ai-budget';
import type { ConfidenceLabel } from '@/lib/intelligence/types';

export const metadata: Metadata = {
  title: 'Deterministic Diagnosis Engine | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

const CONF_TONE: Record<ConfidenceLabel, 'healthy' | 'watch' | 'warning'> = {
  high: 'healthy',
  moderate: 'watch',
  low: 'warning',
};

export default function DeterministicEnginePage() {
  const status = getDeterministicEngineStatus();
  const lab = runGoldenScenarios();
  const allHealthy = status.sports.every((s) => s.healthy);
  // Cost-savings model: every free deterministic diagnosis avoids one AI swing
  // report call. This is a per-diagnosis MODEL (not live spend) — live counts
  // flow to Analytics via the deterministic_* events.
  const centsAvoidedPerDiagnosis = estimateCostCents(TIER_OP.AI_SWING_REPORT);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Deterministic Diagnosis Engine"
        icon={BrainCircuit}
        description="The token-free symptom→cause engine behind Instant Estimate and every heuristic fallback. It ranks likely causes with evidence, confidence, missing data and an honest 'when AI helps' call — no external AI tokens. This page inspects its coverage and runs the golden-scenario lab live."
        badge={
          <StatusBadge tone={allHealthy ? 'healthy' : 'warning'}>
            {allHealthy ? 'All sports covered' : 'Coverage gaps'}
          </StatusBadge>
        }
      />

      {/* ── Headline ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Sports covered" value={`${status.sportCount}/7`} hint="Foundational coverage" tone={status.sportCount >= 7 ? 'success' : 'warning'} />
        <MetricStat label="Reportable symptoms" value={String(status.totalSymptoms)} hint="Across all sports" tone="muted" />
        <MetricStat label="Candidate causes" value={String(status.totalCandidateFaults)} hint="Distinct fault links" tone="muted" />
        <MetricStat label="Engine / rules" value={`v${status.engineVersion}`} hint={`Rules ${status.ruleVersion}`} tone="muted" />
      </div>

      {/* ── Per-sport coverage ───────────────────────────── */}
      <SectionCard
        title="Sport rule coverage"
        description="For each sport: how many miss patterns an athlete can report, the distinct candidate causes those map to, and the curated fault profiles backing them. A sport is healthy with ≥3 symptoms and ≥3 candidate causes."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Sport</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Symptoms</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Causes</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Curated faults</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Prompts</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Escalate &lt;</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {status.sports.map((s) => (
                <tr key={s.sport}>
                  <td className="py-2 pr-3 font-medium text-foreground">{s.displayName}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">{s.symptomCount}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">{s.candidateFaultCount}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">{s.curatedFaultCount}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">{s.missingDataPromptCount}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">{s.escalationThreshold}</td>
                  <td className="py-2">
                    <StatusBadge tone={s.healthy ? 'healthy' : 'warning'}>
                      {s.healthy ? 'Healthy' : 'Weak'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Scenario lab ─────────────────────────────────── */}
      <SectionCard
        title="Scenario evaluation lab"
        description="The golden athlete scenarios, run live through the engine. Each asserts the expected diagnosis family, confidence band and escalation behaviour — a regression guard you can watch in production."
      >
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricStat
            label="Scenarios passing"
            value={`${lab.passed}/${lab.total}`}
            hint={lab.failed === 0 ? 'All green' : `${lab.failed} failing`}
            tone={lab.failed === 0 ? 'success' : 'warning'}
          />
          <MetricStat label="High confidence" value={String(lab.byConfidence.high)} hint="≥ 70" tone="muted" />
          <MetricStat label="Moderate" value={String(lab.byConfidence.moderate)} hint="50–69" tone="muted" />
          <MetricStat label="Escalate to AI" value={`${lab.escalationCount}/${lab.total}`} hint="Deeper analysis advised" tone="muted" />
        </div>

        <ul className="space-y-1.5">
          {lab.rows.map((r) => (
            <li
              key={r.name}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                {r.pass ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success-text" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning-text" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{r.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    → {r.primaryName}
                    {r.escalate ? ' · escalates' : ''}
                    {!r.pass && r.failures.length > 0 ? ` · ${r.failures[0]}` : ''}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">{r.confidence}</span>
                <StatusBadge tone={CONF_TONE[r.confidenceLabel]}>{r.confidenceLabel}</StatusBadge>
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* ── Cost savings & telemetry ─────────────────────── */}
      <SectionCard
        title="Cost savings & telemetry"
        description="The deterministic engine is the token-free floor. Every free / Instant-Estimate diagnosis it serves avoids a paid AI call."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricStat
            label="Avoided / free diagnosis"
            value={`~${centsAvoidedPerDiagnosis}¢`}
            hint="vs one AI swing report (model)"
            tone="success"
          />
          <MetricStat label="External tokens" value="0" hint="Pure engine, no provider" tone="success" />
          <MetricStat label="Escalation rate (golden)" value={`${Math.round((lab.escalationCount / Math.max(1, lab.total)) * 100)}%`} hint="Of scenarios" tone="muted" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This is a per-diagnosis <strong>model</strong>, not live spend. Live counts — most-common diagnoses,
          escalation rate, plan generation and helpfulness — now flow to{' '}
          <Link className="text-success-text hover:underline" href="/admin/analytics">Analytics</Link> via the{' '}
          <code className="rounded bg-muted px-1 text-foreground">deterministic_*</code> events.
        </p>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The deterministic engine produces a complete{' '}
          <em>diagnosis · one fix · one plan · one retest</em> with <strong>zero external AI tokens</strong>. It ranks
          likely causes from a reported miss pattern, attaches supporting and contradicting evidence, names the missing
          data that would sharpen it, and only recommends AI when it genuinely helps (low confidence, contradictions,
          repeated failed fixes, or a regressed retest).
        </p>
        <p>
          <strong className="text-foreground">Cost-saving.</strong> The engine merely <em>recommends</em> escalation —
          the{' '}
          <Link className="text-success-text hover:underline" href="/admin/operating-mode">Operating Mode</Link>{' '}
          router decides whether a paid call is ever made. In Cost-Saving Mode, free and Instant Estimate stay 100%
          deterministic.
        </p>
        <p>
          <strong className="text-foreground">Extending it.</strong> Adding a sport, symptom, or rule is pure data — see{' '}
          <code className="rounded bg-muted px-1 text-foreground">lib/intelligence/symptom-rules.ts</code> and{' '}
          <code className="rounded bg-muted px-1 text-foreground">lib/faults/packs.ts</code>, documented in{' '}
          <code className="rounded bg-muted px-1 text-foreground">docs/deterministic-intelligence.md</code>.
        </p>
      </HelpPanel>
    </div>
  );
}
