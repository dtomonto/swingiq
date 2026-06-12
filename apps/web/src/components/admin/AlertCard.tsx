// AlertCard — a severity-coded smart alert for the Command Center and
// notification surfaces. Server-safe. The only tinted surface (L1): it carries
// an interpreted sentence, optional evidence chips and a recommended-action
// inset. Interactive controls (mute/assign) are passed in via the `action` slot
// by client callers so this component stays server-safe.

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Info, CheckCircle2, Eye, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CopyForClaude } from './CopyForClaude';
import type { ClaudeFixInput } from '@/lib/admin/claude-handoff';

export type AlertSeverity = 'info' | 'success' | 'watch' | 'warning' | 'critical';

const STYLES: Record<AlertSeverity, { ring: string; icon: LucideIcon; tint: string; well: string }> = {
  info: { ring: 'border-primary/30 bg-primary/[0.06]', icon: Info, tint: 'text-link', well: 'border-primary/30 bg-primary/10 text-link' },
  success: { ring: 'border-success/30 bg-success/[0.06]', icon: CheckCircle2, tint: 'text-success-text', well: 'border-success/30 bg-success/10 text-success-text' },
  watch: { ring: 'border-primary/30 bg-primary/[0.05]', icon: Eye, tint: 'text-link', well: 'border-primary/30 bg-primary/10 text-link' },
  warning: { ring: 'border-warning/35 bg-warning/[0.06]', icon: AlertTriangle, tint: 'text-warning-text', well: 'border-warning/30 bg-warning/10 text-warning-text' },
  critical: { ring: 'border-error/40 bg-error/[0.08]', icon: AlertOctagon, tint: 'text-error-text', well: 'border-error/30 bg-error/10 text-error-text' },
};

export interface AlertCardProps {
  severity: AlertSeverity;
  /** Record id (e.g. "INC-204"), shown as a mono chip next to the title. */
  id?: string;
  title: string;
  /** Interpreted sentence — segment, likely cause, what's ruled out. */
  interpretation?: string;
  /** @deprecated use `interpretation`. Kept for backward compatibility. */
  detail?: string;
  /** Mono onset time (e.g. "Jun 8 · 14:00"). */
  startedAt?: string;
  /** Evidence chips (mono, bordered). */
  evidence?: string[];
  /** Recommended-action panel — rendered in an inset. Pass interactive
   *  controls (approve / mute / assign) here from a client component. */
  action?: ReactNode;
  href?: string;
  cta?: string;
  /** When set, shows a "Copy for Claude Code" affordance that turns this alert
   *  into a ready-to-paste fix prompt. */
  fix?: ClaudeFixInput;
}

export function AlertCard({
  severity, id, title, interpretation, detail, startedAt, evidence, action, href, cta, fix,
}: AlertCardProps) {
  const s = STYLES[severity];
  const Icon = s.icon;
  const body = interpretation ?? detail;
  return (
    <div className={`rounded-xl border p-4 ${s.ring}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${s.well}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {id && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">{id}</span>
            )}
            {startedAt && <span className="font-mono text-[10px] text-muted-foreground">{startedAt}</span>}
          </div>
          {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
          {evidence && evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {evidence.map((e) => (
                <span key={e} className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          )}
          {action && <div className="mt-3 rounded-lg border border-border bg-card p-3">{action}</div>}
          {(href || fix) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              {href && (
                <Link
                  href={href}
                  className={`inline-flex items-center gap-1 text-xs font-medium ${s.tint} hover:underline`}
                >
                  {cta ?? 'View'} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
              {fix && <CopyForClaude input={fix} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
