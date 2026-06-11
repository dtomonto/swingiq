// AlertCard — a severity-coded smart alert for the Command Center and
// notification surfaces. Server-safe. Optional CTA link.

import Link from 'next/link';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'critical';

const STYLES: Record<AlertSeverity, { ring: string; icon: LucideIcon; tint: string }> = {
  info: { ring: 'border-primary/30 bg-primary/[0.06]', icon: Info, tint: 'text-link' },
  success: { ring: 'border-success/30 bg-success/[0.06]', icon: CheckCircle2, tint: 'text-success-text' },
  warning: { ring: 'border-warning/35 bg-warning/[0.06]', icon: AlertTriangle, tint: 'text-warning-text' },
  critical: { ring: 'border-error/40 bg-error/[0.08]', icon: AlertOctagon, tint: 'text-error-text' },
};

export interface AlertCardProps {
  severity: AlertSeverity;
  title: string;
  detail?: string;
  href?: string;
  cta?: string;
}

export function AlertCard({ severity, title, detail, href, cta }: AlertCardProps) {
  const s = STYLES[severity];
  const Icon = s.icon;
  return (
    <div className={`rounded-xl border p-4 ${s.ring}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.tint}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {detail && <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>}
          {href && (
            <Link
              href={href}
              className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${s.tint} hover:underline`}
            >
              {cta ?? 'View'} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
