'use client';

// ============================================================
// SwingVantage — Fix Stack Panel
// ------------------------------------------------------------
// The drop-in "One Fix First" block. It reads the normalized
// AgentContext, finds the user's most recent diagnosed issue for
// the active sport, and builds a Fix Stack for it. When the user
// records "did this drill help?", it re-ranks on the spot.
//
// Honest first-run behaviour: with no diagnosis yet, it does NOT
// fabricate a fix — it points the user to a real analysis.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Compass } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAgentContext } from '@/hooks/useAgentContext';
import { buildFixStack } from '@/lib/drillmatch';
import { track } from '@/lib/analytics';
import { FixStackCard } from './FixStackCard';

function Skeleton() {
  return (
    <Card className="border-primary/20">
      <CardBody>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </CardBody>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardBody className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
          <Sparkles size={13} /> Your One Fix
        </div>
        <p className="text-sm text-foreground">
          Once SwingVantage has looked at a swing, this is where your single highest-impact fix
          will live — a feel cue, the right drill, and exactly how to retest it.
        </p>
        <p className="text-xs text-muted-foreground">
          You don&apos;t have a diagnosis yet, so there&apos;s nothing to base a fix on. Start there
          and your Fix Stack will appear automatically.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/start">
            <Button size="sm">
              <Compass size={14} /> Find my first fix
            </Button>
          </Link>
          <Link href="/diagnose">
            <Button size="sm" variant="outline">Run a diagnosis</Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

export function FixStackPanel() {
  const { ready, ctx } = useAgentContext();
  // Bumped when the user records drill feedback, to force a re-rank.
  const [version, setVersion] = useState(0);

  const faultName =
    ctx?.latestDiagnosedSession?.primaryFocus ?? ctx?.latestSession?.primaryFocus ?? null;
  const sport = ctx?.activeSport ?? 'golf';
  const skillLevel = ctx?.profile.skillLevel ?? undefined;

  const fixStack = useMemo(() => {
    if (!ctx || !faultName) return null;
    return buildFixStack({ sport, faultName, skillLevel });
    // version is an intentional recompute trigger after feedback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, faultName, sport, skillLevel, version]);

  useEffect(() => {
    if (fixStack) {
      track('fix_stack_created', {
        sport: fixStack.sport,
        fault_id: fixStack.faultId,
        drill_id: fixStack.drill.id,
        confidence: fixStack.confidence.level,
      });
    }
  }, [fixStack]);

  // Feed the First-Party Intelligence OS: report the deterministic Fix Stack
  // (drill + retest) so recurring fixes dedupe into pattern memories and become
  // reusable first-party knowledge. Fire-and-forget, deduped per (sport, fault,
  // drill), error-swallowed — never blocks or changes what the athlete sees.
  const observedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!fixStack) return;
    const { sport: fsSport, faultId, faultName, drill, retest } = fixStack;
    const sig = `${fsSport}|${faultId}|${drill.id}`;
    if (observedRef.current === sig) return;
    observedRef.current = sig;
    const intent = `${fsSport}: ${faultName}`;
    const observe = (kind: 'drill' | 'retest', recommendation: string, feature: string) =>
      void fetch('/api/intelligence-os/observe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, intent, recommendation, sport: fsSport, feature }),
        keepalive: true,
      }).catch(() => {});
    observe('drill', `${drill.name} — ${drill.why}`, 'fix-stack');
    observe('retest', `${retest.whatToReassess} — ${retest.improvedWhen}`, 'fix-stack-retest');
  }, [fixStack]);

  if (!ready) return <Skeleton />;
  if (!fixStack) return <EmptyState />;

  return <FixStackCard fixStack={fixStack} onFeedback={() => setVersion((v) => v + 1)} />;
}
