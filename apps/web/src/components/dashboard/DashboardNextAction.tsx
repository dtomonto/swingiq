import Link from 'next/link';
import { RotateCcw, type LucideIcon } from 'lucide-react';
import { Card, CardBody, Eyebrow } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DashboardNextActionProps {
  /** The single next step, e.g. "Work your #1 fix: Early extension". */
  headline: string;
  ctaHref: string;
  ctaLabel: string;
  /** Optional short supporting line. */
  note?: string;
  /** Leading icon. @default RotateCcw */
  icon?: LucideIcon;
}

/**
 * Design V2 dashboard hero — the "one next action" banner. The dashboard always
 * points at exactly one next step, and this is the SOLE glow element (Card glow)
 * so the eye lands on it first. Presentational: the page derives the headline +
 * CTA from data it already has.
 */
export function DashboardNextAction({
  headline,
  ctaHref,
  ctaLabel,
  note,
  icon: Icon = RotateCcw,
}: DashboardNextActionProps) {
  return (
    <Card glow>
      <CardBody className="flex flex-wrap items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow>Your one next action</Eyebrow>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">{headline}</p>
          {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
        </div>
        <Link href={ctaHref} className="shrink-0">
          <Button variant="secondary" size="sm">
            {ctaLabel}
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}
