// AlertCard — a severity-coded smart alert for the Command Center and
// notification surfaces. Server-safe. Optional CTA link.

import Link from 'next/link';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'critical';

const STYLES: Record<AlertSeverity, { ring: string; icon: LucideIcon; tint: string }> = {
  info: { ring: 'border-sky-500/30 bg-sky-500/[0.06]', icon: Info, tint: 'text-sky-400' },
  success: { ring: 'border-emerald-500/30 bg-emerald-500/[0.06]', icon: CheckCircle2, tint: 'text-emerald-400' },
  warning: { ring: 'border-amber-500/30 bg-amber-500/[0.06]', icon: AlertTriangle, tint: 'text-amber-400' },
  critical: { ring: 'border-red-500/40 bg-red-500/[0.08]', icon: AlertOctagon, tint: 'text-red-400' },
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
          <p className="text-sm font-semibold text-gray-100">{title}</p>
          {detail && <p className="mt-0.5 text-sm text-gray-400">{detail}</p>}
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
