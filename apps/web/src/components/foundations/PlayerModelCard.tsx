'use client';

// ============================================================
// SwingIQ — Player Model Card (Training Twin foundation)
// ------------------------------------------------------------
// A structured, user-owned summary of who the player is right now,
// plus a one-tap "copy summary" — the seed a future AI twin could
// ingest. Clearly labeled as a foundation, not an autonomous coach.
// ============================================================

import { useState } from 'react';
import { BrainCircuit, Copy, Check, Info } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import type { PlayerModel } from '@/lib/playerModel';

export function PlayerModelCard({ model }: { model: PlayerModel }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(model.summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  }

  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
            <BrainCircuit size={13} /> Player Model · Training Twin foundation
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy summary'}
          </button>
        </div>

        {model.hasData ? (
          <>
            {model.tendencies.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">How you play right now</p>
                <ul className="space-y-1">
                  {model.tendencies.map((t, i) => (
                    <li key={i} className="text-sm text-foreground/90 flex gap-2">
                      <span className="text-primary">·</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {model.whatWorks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-success mb-1.5">What works for you</p>
                <div className="flex flex-wrap gap-1.5">
                  {model.whatWorks.map((w) => (
                    <span key={w} className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success">{w}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-muted/60 border border-border p-3">
              <p className="text-sm text-foreground/90 leading-relaxed">{model.summaryText}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{model.summaryText}</p>
        )}

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
          <Info size={12} className="shrink-0 mt-0.5" /> {model.disclaimer}
        </p>
      </CardBody>
    </Card>
  );
}
