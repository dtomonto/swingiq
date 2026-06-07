'use client';

// ============================================================
// SwingVantage — GrowthSurfaceCard
// ------------------------------------------------------------
// The single unified card for whichever growth surface the
// coordinator chose (activation / reengage / referral). Tone +
// icon vary by kind; structure matches AgentInsightCard so the
// product still feels like one calm voice, not many bots.
// ============================================================

import Link from 'next/link';
import { Rocket, HeartHandshake, Gift, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { GrowthSurface } from '@/lib/agents/growth';

const KIND = {
  activation: { ring: 'border-l-blue-400', icon: Rocket, iconColor: 'text-accent-secondary' },
  reengage: { ring: 'border-l-amber-400', icon: HeartHandshake, iconColor: 'text-warning' },
  referral: { ring: 'border-l-primary', icon: Gift, iconColor: 'text-primary' },
} as const;

export function GrowthSurfaceCard({
  surface,
  className,
}: {
  surface: GrowthSurface;
  className?: string;
}) {
  if (surface.kind === 'none') return null;
  const tone = KIND[surface.kind];
  const Icon = tone.icon;

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border border-l-4 shadow-xs p-4',
        tone.ring,
        className,
      )}
      role="region"
      aria-label={surface.title}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className={cn('mt-0.5 shrink-0', tone.iconColor)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{surface.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{surface.body}</p>
          {surface.action && (
            <div className="mt-3">
              <Link href={surface.action.href}>
                <Button size="sm">
                  {surface.action.label}
                  <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
