'use client';

// ============================================================
// SwingIQ — Skill Transfer Map Card
// ------------------------------------------------------------
// Shows cross-sport transfer patterns for a multi-sport player, or
// the shared movement principles for a single-sport player. Honest:
// a shared principle is a hint, not a guaranteed carry-over.
// ============================================================

import { Shuffle, ArrowRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { SPORT_EMOJI } from '@/lib/progress/display';
import type { TransferPattern, MovementPrinciple } from '@/lib/skillTransfer';

export function SkillTransferCard({
  primaryLabel,
  transfers,
  principles,
}: {
  primaryLabel: string;
  transfers: TransferPattern[];
  principles: MovementPrinciple[];
}) {
  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
          <Shuffle size={13} /> Skill Transfer Map
        </div>

        {transfers.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              You train more than one sport — here&apos;s how the same skills carry across.
            </p>
            <div className="space-y-3">
              {transfers.map((t, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold text-foreground">{t.principle}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-xs">
                    <span className="flex-1 text-muted-foreground">
                      {SPORT_EMOJI[t.fromSport]} {t.fromExpression}
                    </span>
                    <ArrowRight size={13} className="text-primary shrink-0 hidden sm:block" />
                    <span className="flex-1 text-muted-foreground">
                      {SPORT_EMOJI[t.toSport]} {t.toExpression}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{transfers[0].note}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              The movement principles behind {primaryLabel.toLowerCase()}. Add a second sport to your
              profile and SwingIQ will map how these skills transfer.
            </p>
            <div className="space-y-2">
              {principles.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
