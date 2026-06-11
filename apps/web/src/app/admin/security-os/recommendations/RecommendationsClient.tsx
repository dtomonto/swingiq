'use client';

// ============================================================
// securityOS — recommendations (CLIENT)
// ------------------------------------------------------------
// Recomputes recommendations from OPEN findings (so triage takes effect) and
// renders them grouped into the operator buckets. Each card expands to the
// full why / impact / steps.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, Activity, Settings as SettingsIcon, KeyRound, ChevronDown, Bot } from 'lucide-react';
import { useSecurityOS } from '@/lib/security-os/useSecurityOS';
import { applyFindingOverrides } from '@/lib/security-os/findings';
import { generateRecommendations, bucketRecommendations } from '@/lib/security-os/recommendations';
import {
  BUCKET_LABEL,
  OPEN_FINDING_STATUSES,
  type RecommendationBucket,
  type SecurityFinding,
  type SecurityRecommendation,
} from '@/lib/security-os/types';

const BUCKET_ICON: Record<RecommendationBucket, typeof AlertTriangle> = {
  do_today: AlertTriangle,
  this_week: Clock,
  monitor: Activity,
  needs_manual_setup: SettingsIcon,
  waiting_on_credentials: KeyRound,
};
const BUCKET_ORDER: RecommendationBucket[] = ['do_today', 'this_week', 'needs_manual_setup', 'waiting_on_credentials', 'monitor'];
const EFFORT_LABEL: Record<string, string> = { S: 'Quick', M: 'Moderate', L: 'Larger', XL: 'Project' };

export function RecommendationsClient({ actor, findings, generatedAt }: { actor: string; findings: SecurityFinding[]; generatedAt: string }) {
  const sec = useSecurityOS();
  useEffect(() => {
    if (actor) sec.setActor(actor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  const buckets = useMemo(() => {
    const views = applyFindingOverrides(findings, sec.overrides, generatedAt);
    const open = views.filter((v) => OPEN_FINDING_STATUSES.includes(v.status));
    return bucketRecommendations(generateRecommendations(open));
  }, [findings, sec.overrides, generatedAt]);

  const total = BUCKET_ORDER.reduce((n, b) => n + buckets[b].length, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="text-sm text-foreground">No open recommendations. 🎉</p>
        <p className="mt-1 text-xs text-muted-foreground">Every open finding has been triaged or accepted. Re-run the scan to recompute from the latest signals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {BUCKET_ORDER.map((b) => {
        const items = buckets[b];
        if (items.length === 0) return null;
        const Icon = BUCKET_ICON[b];
        return (
          <section key={b}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="h-4 w-4 text-link" /> {BUCKET_LABEL[b]}
              <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <ul className="space-y-2">
              {items.map((r) => (
                <RecCard key={r.id} rec={r} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function RecCard({ rec }: { rec: SecurityRecommendation }) {
  const [open, setOpen] = useState(false);
  const bandTone =
    rec.priorityBand === 'critical' ? 'text-error-text' : rec.priorityBand === 'high' ? 'text-orange-300' : rec.priorityBand === 'medium' ? 'text-link' : 'text-link';
  return (
    <li className="rounded-xl border border-border bg-card">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{rec.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            <span className={bandTone}>{rec.priorityBand}</span> · {rec.riskDomain} · {EFFORT_LABEL[rec.effort] ?? rec.effort}
            {rec.canClaudeFix && ' · Claude can help'}
            {rec.addToCi && ' · CI/CD'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-muted-foreground">{rec.priorityScore}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground/70 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-4 pt-3">
          <Field label="Why it matters">{rec.whyItMatters}</Field>
          <Field label="What could happen">{rec.whatCouldHappen}</Field>
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Steps</p>
            <ol className="list-decimal space-y-1 pl-5">
              {rec.stepByStepActions.map((s, i) => (
                <li key={i} className="text-sm text-foreground">{s}</li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rec.relatedLinks.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg border border-border px-2 py-1 text-xs text-foreground hover:bg-muted">{l.label}</Link>
            ))}
            {rec.canClaudeFix && (
              <span className="inline-flex items-center gap-1 text-[11px] text-success-text"><Bot className="h-3 w-3" /> Claude Code can implement this now</span>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
