'use client';

import Link from 'next/link';
import { ChevronRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AgentAction } from '@/lib/agents';

// The single "what should I do next" recommendation, surfaced prominently.
// Plain language, one action — never a wall of options.

export function NextBestActionCard({ action }: { action: AgentAction }) {
  return (
    <div
      className="bg-golf-dark text-white rounded-xl p-5 flex items-start gap-4"
      role="region"
      aria-label="Your next best step"
    >
      <span className="shrink-0 mt-0.5">
        <Compass size={22} className="text-primary-foreground/80" aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-primary-foreground/80 text-sm mb-0.5">Your next best step</p>
        <p className="font-bold text-base mb-1">{action.label}</p>
        {action.helperText && (
          <p className="text-primary-foreground/90 text-sm leading-relaxed">{action.helperText}</p>
        )}
      </div>
      <Link href={action.href}>
        <Button size="sm" className="bg-primary hover:bg-primary text-white whitespace-nowrap">
          Continue
          <ChevronRight size={14} />
        </Button>
      </Link>
    </div>
  );
}
