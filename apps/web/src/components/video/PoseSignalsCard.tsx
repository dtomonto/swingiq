'use client';

// ============================================================
// SwingIQ — Measured Body Signals
// Shows the objective, on-device pose-detection proxies that helped
// ground the AI's read. Movement proxies, clearly labeled — not lab
// measurements. Rendered only when pose detection actually succeeded.
// ============================================================

import { Activity } from 'lucide-react';
import type { PoseMetrics } from '@/lib/pose/pose-metrics';

export function PoseSignalsCard({ metrics }: { metrics: PoseMetrics }) {
  const items = [
    { label: 'Shoulder rotation', value: `~${metrics.shoulderTurnRangeDeg}°`, hint: 'range across the motion' },
    { label: 'Spine posture', value: `~${metrics.spineAngleRangeDeg}°`, hint: 'tilt change (early-extension proxy)' },
    { label: 'Head stability', value: `~${metrics.headSwayPct}%`, hint: 'horizontal head movement' },
    { label: 'Hip sway', value: `~${metrics.hipSwayPct}%`, hint: 'horizontal hip movement' },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-accent-secondary" />
        <h3 className="text-sm font-bold text-foreground">Measured body signals</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Detected on your device with pose tracking on {metrics.framesWithPose} frames. These movement
        proxies helped ground the AI&apos;s read — they are not lab measurements.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border border-border bg-muted p-2.5">
            <p className="text-xs font-semibold text-muted-foreground">{it.label}</p>
            <p className="text-base font-bold text-foreground">{it.value}</p>
            <p className="text-[10px] text-muted-foreground leading-snug">{it.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
