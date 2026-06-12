'use client';

// ============================================================
// DecisionDrawer — the "what is this and how do I roll it out?" panel
// ------------------------------------------------------------
// Opens from a Decision Center row (adapts the PublishDetailDrawer pattern).
// Surfaces the interpreted read, the supporting data, an honest "how this
// ranked" breakdown, and a staged-rollout planner (RolloutControls). The
// only write path is the deep-link back to the native tool — this drawer
// never executes a change; the rollout plan it captures is a local intent.
// ============================================================

import { X, Lightbulb, BarChart3, Rocket, ArrowRight, History, Info } from 'lucide-react';
import { RolloutControls } from './RolloutControls';
import { CopyForClaude } from './CopyForClaude';
import type { DecisionBand, DecisionVM } from './DecisionCard';
import type { RolloutPlan } from '@/lib/admin/decision-rollout';
import { fromDecision } from '@/lib/admin/claude-handoff';

const BAND: Record<DecisionBand, { pill: string; bar: string; score: string }> = {
  critical: { pill: 'bg-error/10 text-error-text border-error/30', bar: 'bg-error', score: 'text-error-text' },
  warning: { pill: 'bg-warning/10 text-warning-text border-warning/30', bar: 'bg-warning', score: 'text-warning-text' },
  watch: { pill: 'bg-primary/10 text-link border-primary/30', bar: 'bg-chart-1', score: 'text-link' },
  routine: { pill: 'bg-success/10 text-success-text border-success/30', bar: 'bg-success', score: 'text-success-text' },
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border/60 pt-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

export function DecisionDrawer({
  decision, plan, onPlanChange, savedAt, onClose,
}: {
  decision: DecisionVM;
  plan: RolloutPlan;
  onPlanChange: (plan: RolloutPlan) => void;
  savedAt?: string;
  onClose: () => void;
}) {
  const b = BAND[decision.band];
  const count = decision.count ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/60"
      role="dialog"
      aria-modal="true"
      aria-label={`Decision: ${decision.title}`}
    >
      <button type="button" aria-label="Close decision" className="absolute inset-0 cursor-default" onClick={onClose} />

      <aside className="relative h-full w-full max-w-[560px] overflow-y-auto border-l border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-background/95 p-5 backdrop-blur">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                {decision.type}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${b.pill}`}>
                {decision.band}
              </span>
            </div>
            <h2 className="text-base font-semibold text-foreground">{decision.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Priority gauge */}
        <div className="flex items-center gap-3 p-5 pb-0">
          <p className={`font-mono text-3xl font-bold tabular-nums ${b.score}`} aria-label={`priority ${decision.score} of 100`}>
            {decision.score}
          </p>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">priority</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${decision.score}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {/* Our read */}
          {decision.read && (
            <Section icon={<Lightbulb className="h-3.5 w-3.5" />} title="Our read">
              <p className="text-sm leading-relaxed text-foreground">{decision.read}</p>
            </Section>
          )}

          {/* Supporting data */}
          <Section icon={<BarChart3 className="h-3.5 w-3.5" />} title="Supporting data">
            {decision.meta && decision.meta.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {decision.meta.map((m) => (
                  <span key={m} className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No additional signals recorded.</p>
            )}
            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground/80">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Priority {decision.score}/100 is derived transparently from {decision.severity ?? decision.band} severity
              {count > 0 ? ` and ${count} underlying item${count === 1 ? '' : 's'}` : ''} — nothing is invented.
            </p>
          </Section>

          {/* Staged rollout */}
          <Section icon={<Rocket className="h-3.5 w-3.5" />} title="Staged rollout">
            <RolloutControls
              step={plan.step}
              onStepChange={(step) => onPlanChange({ ...plan, step })}
              autoVerify={plan.autoVerify}
              onAutoVerifyChange={(autoVerify) => onPlanChange({ ...plan, autoVerify })}
            />
            <p className="text-[11px] text-muted-foreground/80">
              {savedAt
                ? `Plan saved on this device · ${fmt(savedAt)}.`
                : 'Plan is saved on this device as you adjust it.'}{' '}
              It records your intent — the actual rollout runs in {decision.type}.
            </p>
          </Section>

          {/* What happens next */}
          <Section icon={<History className="h-3.5 w-3.5" />} title="What happens next">
            <ol className="space-y-2 text-sm">
              <Step n={1} text={`Open ${decision.type} to action this — that surface owns the change.`} />
              <Step n={2} text={`Apply at ${plan.step}% of the audience for the first step.`} />
              <Step
                n={3}
                text={plan.autoVerify
                  ? 'Verification re-runs automatically; it pauses the rollout if anything regresses.'
                  : 'Verify manually before widening the rollout.'}
              />
              {plan.step < 100 && <Step n={4} text="Return here and widen the step once it holds." />}
            </ol>
          </Section>
        </div>

        {/* Footer — hand to Claude Code, or deep-link to the native tool */}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 p-4 backdrop-blur">
          <CopyForClaude input={fromDecision(decision)} />
          <a
            href={decision.href}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/35 bg-primary/[0.06] px-4 py-2 text-sm font-medium text-link hover:border-primary/50"
          >
            {decision.cta} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/[0.08] text-[11px] font-bold text-link">
        {n}
      </span>
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}

function fmt(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16);
}
