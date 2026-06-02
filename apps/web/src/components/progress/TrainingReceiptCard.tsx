'use client';

// ============================================================
// SwingIQ — Training Receipt Card
// ------------------------------------------------------------
// Proof of a practice→retest cycle: diagnosed → practised →
// what changed → drill effectiveness → next move. Honest by
// design: a video retest is directional, never a guarantee.
// ============================================================

import Link from 'next/link';
import { Receipt, Stethoscope, Dumbbell, GitCompareArrows, Lightbulb, Info, ArrowRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import type { TrainingReceipt } from '@/lib/progress';
import type { RetestOutcome } from '@/lib/retest';

const OUTCOME_STYLE: Record<RetestOutcome, { label: string; cls: string }> = {
  improved: { label: 'Looks like progress', cls: 'bg-success/15 text-success' },
  persisting: { label: 'Still your top issue', cls: 'bg-warning/15 text-warning' },
  inconclusive: { label: 'Not enough to judge', cls: 'bg-muted text-muted-foreground' },
  regressed: { label: 'Slipped back', cls: 'bg-error/15 text-error' },
};

function Row({ icon: Icon, label, children }: { icon: typeof Receipt; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{children}</p>
      </div>
    </div>
  );
}

export function TrainingReceiptCard({ receipt }: { receipt: TrainingReceipt }) {
  if (!receipt.available) {
    return (
      <Card className="border-dashed border-border">
        <CardBody className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Receipt size={13} /> Training Receipt
          </div>
          <p className="text-sm text-muted-foreground">{receipt.nextRecommendation}</p>
          <Link href="/retest" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Go to Retest <ArrowRight size={12} />
          </Link>
        </CardBody>
      </Card>
    );
  }

  const outcome = receipt.outcome ? OUTCOME_STYLE[receipt.outcome] : null;

  return (
    <Card className="border-primary/30">
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
            <Receipt size={13} /> Training Receipt
          </div>
          {outcome && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${outcome.cls}`}>{outcome.label}</span>
          )}
        </div>

        <Row icon={Stethoscope} label="Diagnosed">{receipt.diagnosed}</Row>
        <Row icon={Dumbbell} label="Practised">{receipt.practiced}</Row>
        <Row icon={GitCompareArrows} label="What changed">{receipt.whatChanged}</Row>
        <Row icon={Lightbulb} label="Drill effectiveness">{receipt.drillEffectiveness}</Row>

        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <p className="text-xs font-semibold text-primary">Next move</p>
          <p className="text-sm text-foreground mt-0.5">{receipt.nextRecommendation}</p>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground border-t border-border pt-2">
          <Info size={12} className="shrink-0 mt-0.5" /> {receipt.confidenceNote}
        </p>
      </CardBody>
    </Card>
  );
}
