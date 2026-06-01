'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, ChevronDown, X, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { AgentInsight, InsightTone } from '@/lib/agents';

// One unified card for every agent insight so the product never feels
// like "15 separate bots". Tone drives color + icon only.

const TONE: Record<InsightTone, { ring: string; icon: typeof Sparkles; iconColor: string }> = {
  info: { ring: 'border-l-blue-400', icon: Sparkles, iconColor: 'text-accent-secondary' },
  success: { ring: 'border-l-primary', icon: TrendingUp, iconColor: 'text-primary' },
  celebrate: { ring: 'border-l-primary', icon: PartyPopper, iconColor: 'text-primary' },
  warning: { ring: 'border-l-amber-400', icon: AlertTriangle, iconColor: 'text-warning' },
  safety: { ring: 'border-l-error', icon: ShieldCheck, iconColor: 'text-error' },
};

export function AgentInsightCard({
  insight,
  onDismiss,
  className,
}: {
  insight: AgentInsight;
  onDismiss?: (id: string) => void;
  className?: string;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const tone = TONE[insight.tone] ?? TONE.info;
  const Icon = tone.icon;
  const hasWhy = !!insight.whyItMatters || (insight.evidence?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border border-l-4 shadow-xs p-4',
        tone.ring,
        className,
      )}
      role="region"
      aria-label={insight.title}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className={cn('mt-0.5 shrink-0', tone.iconColor)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground text-sm">{insight.title}</p>
            {insight.dismissible && onDismiss && (
              <button
                onClick={() => onDismiss(insight.id)}
                aria-label={`Dismiss: ${insight.title}`}
                className="text-muted-foreground hover:text-muted-foreground -mt-0.5 -mr-1 p-1 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{insight.body}</p>

          {insight.confidence && (
            <div className="mt-2">
              <ConfidenceBadge confidence={insight.confidence} />
            </div>
          )}

          {hasWhy && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showWhy ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Why this matters
            </button>
          )}

          {showWhy && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1.5 bg-muted rounded-lg p-3">
              {insight.whyItMatters && <p>{insight.whyItMatters}</p>}
              {insight.evidence && insight.evidence.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5">
                  {insight.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(insight.primaryAction || (insight.secondaryActions?.length ?? 0) > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {insight.primaryAction && (
                <Link href={insight.primaryAction.href}>
                  <Button size="sm">
                    {insight.primaryAction.label}
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              )}
              {insight.secondaryActions?.map((a) => (
                <Link key={a.id} href={a.href}>
                  <Button size="sm" variant="outline">
                    {a.label}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
