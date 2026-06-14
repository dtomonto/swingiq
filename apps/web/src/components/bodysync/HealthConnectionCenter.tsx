'use client';

import { Check, Clock } from 'lucide-react';
import { PROVIDER_CATALOG } from '@/lib/bodysync';
import type { ProviderDescriptor } from '@/lib/bodysync';

function StatusBadge({ p }: { p: ProviderDescriptor }) {
  if (p.status === 'manual' || p.status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-2xs font-medium text-success">
        <Check size={11} aria-hidden="true" /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs font-medium text-muted-foreground">
      <Clock size={11} aria-hidden="true" /> Coming soon
    </span>
  );
}

export function HealthConnectionCenter() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground">Connect a device</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Manual check-ins work today. Devices light up as each secure connection ships — we never claim a
        connection we can&apos;t honor (Apple Health, for example, has no direct web access).
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {PROVIDER_CATALOG.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-lg" aria-hidden="true">{p.icon}</span>
                <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
              </span>
              <StatusBadge p={p} />
            </div>
            <p className="mt-1.5 text-2xs text-muted-foreground leading-relaxed">{p.howItConnects}</p>
            <p className="mt-1.5 text-3xs uppercase tracking-wide text-muted-foreground">
              {p.categories.join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
