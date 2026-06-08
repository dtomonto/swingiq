'use client';

// Compact dashboard teaser for the Mental Performance pillar. Self-contained
// (like BodySync's ReadinessSummaryCard) so the dashboard only imports + renders
// one line. Flag-gated via NEXT_PUBLIC_MENTAL_PERFORMANCE (default ON).

import Link from 'next/link';
import { Brain, Wind, ShieldQuestion, Frown, ArrowRight } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMentalPerformance } from '@/lib/mental-performance/useMentalPerformance';

const QUICK = [
  { intent: 'mistake', label: 'I made a mistake', icon: Wind },
  { intent: 'nervous', label: 'I’m nervous', icon: ShieldQuestion },
  { intent: 'confidence', label: 'Lost confidence', icon: Frown },
];

export function MentalPerformanceCard() {
  // Kill-switch: default ON; only the explicit string 'false' hides it.
  if (process.env.NEXT_PUBLIC_MENTAL_PERFORMANCE === 'false') return null;

  return <MentalPerformanceCardInner />;
}

function MentalPerformanceCardInner() {
  const mp = useMentalPerformance();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain size={17} aria-hidden="true" />
          </span>
          <CardTitle>Mental Performance</CardTitle>
        </div>
        <Link href="/mental" className="text-sm font-medium text-primary hover:underline">Open</Link>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Made a mistake or feeling the pressure? Get an instant reset.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.intent}
                href={`/mental?intent=${q.intent}`}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary"
              >
                <Icon size={18} className="text-primary" aria-hidden="true" />
                <span className="text-xs font-medium text-foreground">{q.label}</span>
              </Link>
            );
          })}
        </div>
        {mp.enabled && (
          <Link href={`/mental-performance/${mp.suggestedRoutine.sports[0]}/${mp.suggestedRoutine.slug}`}
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted">
            <span className="text-foreground">Suggested reset: <span className="font-medium">{mp.suggestedRoutine.title}</span></span>
            <ArrowRight size={15} className="text-muted-foreground" aria-hidden="true" />
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
