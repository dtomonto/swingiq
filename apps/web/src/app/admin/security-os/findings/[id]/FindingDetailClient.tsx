'use client';

// ============================================================
// securityOS — finding detail + status workflow (CLIENT)
// ------------------------------------------------------------
// The full picture for one finding: evidence, business + technical impact,
// framework mapping, recommended fix and ordered steps — plus the status
// workflow (New → Triaged → In Progress → Needs Review → Resolved, with
// Accept Risk / False Positive / Deferred). Every change persists locally and
// writes a redacted security-audit entry.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert, Wrench, ListOrdered, Activity, FileText, AlertTriangle, CheckCircle2, Bot, KeyRound,
} from 'lucide-react';
import { SeverityPill, FrameworkTags } from '@/components/security-os/SecurityUI';
import { CopyForClaude } from '@/components/admin/CopyForClaude';
import { fromSecurityFinding } from '@/lib/admin/claude-handoff';
import { useSecurityOS } from '@/lib/security-os/useSecurityOS';
import { applyFindingOverrides } from '@/lib/security-os/findings';
import {
  CATEGORY_LABEL,
  FINDING_STATUS_LABEL,
  type FindingStatus,
  type SecurityFinding,
} from '@/lib/security-os/types';

const STATUS_FLOW: FindingStatus[] = ['new', 'triaged', 'in_progress', 'needs_review', 'resolved'];
const EFFORT_LABEL: Record<string, string> = { S: 'Quick fix', M: 'Moderate', L: 'Larger effort', XL: 'Project' };

export function FindingDetailClient({ actor, finding, generatedAt }: { actor: string; finding: SecurityFinding; generatedAt: string }) {
  const sec = useSecurityOS();
  useEffect(() => {
    if (actor) sec.setActor(actor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  const view = useMemo(
    () => applyFindingOverrides([finding], sec.overrides, generatedAt)[0],
    [finding, sec.overrides, generatedAt],
  );

  const [note, setNote] = useState('');
  const [justification, setJustification] = useState('');
  useEffect(() => {
    setNote(view.note ?? '');
    setJustification(view.acceptedRiskJustification ?? '');
  }, [view.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = (status: FindingStatus) =>
    sec.setFindingStatus(finding.id, status, { note: note || undefined, justification: justification || undefined, title: finding.title });

  return (
    <article className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityPill severity={finding.severity} />
          <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{CATEGORY_LABEL[finding.category]}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{finding.source}</span>
          {view.overdue && <span className="rounded bg-error/15 px-1.5 py-0.5 text-[10px] font-semibold text-error-text">Overdue</span>}
          {finding.isSeed && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-link">Sample</span>}
        </div>
        <h1 className="flex items-start gap-2 text-xl font-bold text-foreground">
          <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-link" />
          {finding.title}
        </h1>
        <p className="text-sm text-muted-foreground">{finding.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Risk score <span className="font-semibold text-foreground">{finding.riskScore}</span></span>
          <span>Likelihood {finding.likelihood}</span>
          <span>Impact {finding.impact}</span>
          <span>Effort {EFFORT_LABEL[finding.effort] ?? finding.effort}</span>
          <span>Due {finding.dueDate}</span>
        </div>
        <FrameworkTags frameworks={finding.frameworks} />
        <div className="pt-1">
          <CopyForClaude input={fromSecurityFinding(finding)} />
        </div>
      </div>

      {/* Status workflow */}
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status: <span className="text-link">{FINDING_STATUS_LABEL[view.status]}</span></p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                view.status === s ? 'border-primary/60 bg-primary/10 text-link' : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              {FINDING_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button onClick={() => setStatus('false_positive')} className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">Mark false positive</button>
          <button onClick={() => setStatus('deferred')} className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">Defer</button>
          {view.status !== 'new' && (
            <button onClick={() => sec.clearOverride(finding.id)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">Reset to New</button>
          )}
        </div>

        {/* Accept risk */}
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-medium text-link">Accept risk (with justification)</p>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Why is accepting this risk acceptable? (compensating control, low exploitability, business trade-off…)"
            rows={2}
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
          <button
            onClick={() => setStatus('accepted_risk')}
            disabled={!justification.trim()}
            className="mt-2 rounded-lg bg-primary/90 px-2.5 py-1.5 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40 hover:bg-warning"
          >
            Accept risk
          </button>
          {view.status === 'accepted_risk' && view.acceptedRiskJustification && (
            <p className="mt-2 text-[11px] text-link/80">Accepted: {view.acceptedRiskJustification}</p>
          )}
        </div>

        {/* Note */}
        <div className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (view.note ?? '') && sec.addNote(finding.id, note)}
            placeholder="Add a note (saved on blur)…"
            rows={2}
            className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
        </div>
      </section>

      {/* Impact + fix */}
      <DetailBlock icon={AlertTriangle} title="Why it matters (business impact)">{finding.businessImpact}</DetailBlock>
      <DetailBlock icon={Activity} title="What could happen (technical impact)">{finding.technicalImpact}</DetailBlock>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><FileText className="h-4 w-4 text-muted-foreground" /> Evidence</h2>
        <ul className="space-y-1">
          {finding.evidence.map((e, i) => (
            <li key={i} className="text-xs text-muted-foreground">• {e}</li>
          ))}
        </ul>
      </section>

      <DetailBlock icon={Wrench} title="Recommended fix">{finding.recommendedFix}</DetailBlock>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><ListOrdered className="h-4 w-4 text-muted-foreground" /> Step-by-step</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          {finding.stepByStepActions.map((s, i) => (
            <li key={i} className="text-sm text-foreground">{s}</li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${finding.canClaudeFix ? 'border-success/40 text-success-text' : 'border-border text-muted-foreground'}`}>
            <Bot className="h-3 w-3" /> {finding.canClaudeFix ? 'Claude Code can help implement this' : 'Manual implementation'}
          </span>
          {finding.needsCredentials && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2 py-0.5 text-link">
              <KeyRound className="h-3 w-3" /> Needs credentials / env setup
            </span>
          )}
          {finding.addToCi && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2 py-0.5 text-link">
              <CheckCircle2 className="h-3 w-3" /> Belongs in CI/CD
            </span>
          )}
        </div>
      </section>
    </article>
  );
}

function DetailBlock({ icon: Icon, title, children }: { icon: typeof Wrench; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="h-4 w-4 text-muted-foreground" /> {title}</h2>
      <p className="text-sm text-muted-foreground">{children}</p>
    </section>
  );
}
