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
import { BrainCircuit, ArrowRight, Target, Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { useAthleteGI } from '@/lib/agi/adapters/useAthleteGI';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const BAND_DOT: Record<string, string> = {
  sharp: 'bg-success',
  solid: 'bg-success',
  developing: 'bg-warning',
  building: 'bg-warning',
};

export function AthleteGISummary() {
  const { model, insights, plan, progress } = useAthleteGI();
  const hasData = model.dataMap.totalSessions > 0;
  const top = insights[0];
  const readiness = model.readiness;
  const moved = progress?.keystoneMoved;
  const trend = moved && moved.delta !== null && moved.delta !== 0 ? moved : null;

  // Nothing honest to show yet — stay out of the way.
  if (!hasData && !model.identity?.primaryGoal && !readiness) return null;

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

        {readiness && (
          <p className="text-xs text-foreground flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${readiness.caution ? 'bg-error' : BAND_DOT[readiness.band] ?? 'bg-muted'}`}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">Today:</span>
            <span className="font-medium capitalize">{readiness.caution ? 'take care' : readiness.band}</span>
          </p>
        )}

        {plan.keystone && (
          <p className="text-xs text-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground">Focus:</span>
            <span className="font-medium">{plan.keystone.name}</span>
          </p>
        )}

        {trend && (
          <p className="text-xs flex items-center gap-1.5">
            {trend.delta! > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-error shrink-0" aria-hidden="true" />
            )}
            <span className="text-muted-foreground">Trend:</span>
            <span className={`font-medium ${trend.delta! > 0 ? 'text-success' : 'text-error'}`}>
              {trend.name} {trend.delta! > 0 ? '+' : ''}
              {trend.delta}
            </span>
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
