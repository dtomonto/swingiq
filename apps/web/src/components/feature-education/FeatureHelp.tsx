'use client';

// ============================================================
// SwingVantage — In-app help reader (drop-in)
// ------------------------------------------------------------
// Shows contextual help published by the Feature Education Engine for the
// current route. Drop <FeatureHelp route="/motion-lab" /> onto any page; it
// renders nothing until help is PUBLISHED for that route (honest fallback),
// so it's safe to place proactively. Dismissible per session.
// ============================================================

import { useEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpItem {
  id: string;
  placement: string;
  headline: string;
  body: string;
  learnMoreHref?: string;
}

export function FeatureHelp({ route, className }: { route: string; className?: string }) {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    fetch(`/api/feature-education/help?route=${encodeURIComponent(route)}`)
      .then((r) => (r.ok ? r.json() : { help: [] }))
      .then((d) => {
        if (active) setItems(Array.isArray(d.help) ? d.help : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [route]);

  const visible = items.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  return (
    <div className={className}>
      {visible.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm"
        >
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-amber-200">{item.headline}</p>
            <p className="mt-0.5 text-amber-100/80">{item.body}</p>
            {item.learnMoreHref && (
              <a href={item.learnMoreHref} className="mt-1 inline-block text-xs font-medium text-amber-300 hover:underline">
                Learn more →
              </a>
            )}
          </div>
          <button
            onClick={() => setDismissed((d) => new Set(d).add(item.id))}
            aria-label="Dismiss"
            className="shrink-0 text-amber-400/70 hover:text-amber-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
