'use client';

// ============================================================
// SwingIQ — Athlete General Intelligence: compact summary
// ------------------------------------------------------------
// A small, embeddable card for the Today dashboard. Runs the same engine as
// the full /agi page (via useAthleteGI) and surfaces just the top conclusion +
// the keystone focus, with a link through to the full analysis. Renders
// nothing until there's something honest to say (a session or a stated goal).
// ============================================================

import Link from 'next/link';
import { BrainCircuit, ArrowRight, Target, Gauge } from 'lucide-react';
import { useAthleteGI } from '@/lib/agi/adapters/useAthleteGI';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function AthleteGISummary() {
  const { model, insights, plan } = useAthleteGI();
  const hasData = model.dataMap.totalSessions > 0;
  const top = insights[0];

  // Nothing honest to show yet — stay out of the way.
  if (!hasData && !model.identity?.primaryGoal) return null;

  return (
    <Card>
      <CardBody className="space-y-2.5">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Athlete GI</span>
          <Badge variant="info">General</Badge>
          {hasData && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
              <Gauge className="w-3 h-3" aria-hidden="true" />
              {Math.round(model.coverage * 100)}%
            </span>
          )}
        </div>

        {top ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{top.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{top.summary}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Analyse a session and the engine ties cross-sport insights to your stated goal.
          </p>
        )}

        {plan.keystone && (
          <p className="text-xs text-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground">Focus:</span>
            <span className="font-medium">{plan.keystone.name}</span>
          </p>
        )}

        <Link
          href="/agi"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open Athlete GI
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </CardBody>
    </Card>
  );
}
