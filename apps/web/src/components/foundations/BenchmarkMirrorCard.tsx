'use client';

// ============================================================
// SwingVantage — Benchmark Mirror Card (foundation preview)
// ------------------------------------------------------------
// Typical windows for the player's level — an honest "mirror to aim
// at", never a measured percentile or a ranking against others.
// ============================================================

import { Crosshair, Info } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import type { BenchmarkMirror } from '@/lib/benchmarkMirror';

export function BenchmarkMirrorCard({ mirror }: { mirror: BenchmarkMirror }) {
  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-link uppercase tracking-wide">
            <Crosshair size={13} /> Benchmark Mirror
          </div>
          <span className="text-xs text-muted-foreground capitalize">{mirror.skill} level</span>
        </div>

        <p className="text-sm text-muted-foreground">{mirror.framing}</p>

        {mirror.available ? (
          <div className="space-y-2">
            {mirror.metrics.map((m) => (
              <div key={m.key} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.min}–{m.max} {m.unit} · aim {m.target}
                  </p>
                </div>
                {/* simple target band */}
                <div className="relative h-2 mt-2 bg-muted rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 bg-primary/30" style={{ left: '8%', right: '8%' }} />
                  <div className="absolute inset-y-0 w-1 bg-primary rounded-full" style={{ left: '50%' }} />
                </div>
                {m.confidenceNote && (
                  <p className="text-xs text-muted-foreground mt-1">{m.confidenceNote}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/90">{mirror.note}</p>
        )}

        {mirror.available && mirror.note && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
            <Info size={12} className="shrink-0 mt-0.5" /> {mirror.note}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
