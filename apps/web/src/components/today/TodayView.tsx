'use client';

// ============================================================
// WS-01 — Focused Today view. A small set of primary items by user type;
// secondary depth is collapsed by default and expands into real content.
// Mobile-first + accessible; analytics on view / expand / complete.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { useToday } from '@/lib/today/useToday';
import type { TodayItem, TodayKind, TodaySection } from '@/lib/today/engine';

const KIND_BADGE: Partial<Record<TodayKind, { label: string; variant: 'critical' | 'warning' | 'info' | 'success' | 'default' }>> = {
  critical_alert: { label: 'Alert', variant: 'critical' },
  retest_due: { label: 'Retest', variant: 'warning' },
  must_do: { label: 'Must do', variant: 'info' },
  recommended_next: { label: 'Next', variant: 'success' },
  active_plan: { label: 'Plan', variant: 'default' },
  skill_focus: { label: 'Skill', variant: 'default' },
};

export function TodayView({ sport }: { sport: SportId }) {
  const view = useToday(sport);

  useEffect(() => {
    for (const item of view.primary) {
      track(ANALYTICS_EVENTS.TODAY_ITEM_VIEWED, {
        kind: item.kind,
        category: item.source,
        user_role: view.userType,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.userType, view.primary.length]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {view.primary.map((item) => (
          <PrimaryItem key={item.id} item={item} userType={view.userType} />
        ))}
        {view.primary.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-sm text-foreground">You&apos;re all caught up for today. 🎉</p>
              <p className="text-xs text-muted-foreground">Log a session or upload a swing to get your next focus.</p>
            </CardBody>
          </Card>
        )}
      </div>

      {view.collapsed.map((section) => (
        <CollapsedSection key={section.id} section={section} userType={view.userType} />
      ))}
    </div>
  );
}

function PrimaryItem({ item, userType }: { item: TodayItem; userType: string }) {
  const badge = KIND_BADGE[item.kind];
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
            <p className="truncate font-semibold text-foreground">{item.title}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
        </div>
        {item.actionHref && (
          <Link href={item.actionHref} className="shrink-0">
            <Button
              size="sm"
              onClick={() =>
                track(ANALYTICS_EVENTS.TODAY_ITEM_COMPLETED, { kind: item.kind, category: item.source, user_role: userType })
              }
            >
              {item.actionLabel ?? 'Open'}
            </Button>
          </Link>
        )}
      </CardBody>
    </Card>
  );
}

function CollapsedSection({ section, userType }: { section: TodaySection; userType: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardBody>
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          aria-expanded={open}
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) track(ANALYTICS_EVENTS.TODAY_ITEM_EXPANDED, { category: section.id, user_role: userType });
          }}
        >
          <span className="text-sm font-semibold text-foreground">
            {section.title} <span className="text-muted-foreground">({section.items.length})</span>
          </span>
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {open && (
          <ul className="mt-3 space-y-2 border-t border-border pt-3">
            {section.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.collapsedDetail ?? item.reason}</p>
                </div>
                {item.actionHref && (
                  <Link href={item.actionHref} className="shrink-0 text-xs font-medium text-[var(--primary)]">
                    {item.actionLabel ?? 'Open'}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
