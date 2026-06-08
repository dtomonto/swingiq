'use client';

// ============================================================
// Client-side Action Center items — the queues that live in the browser
// (localStorage), which the server can't read at render time. Today that's
// the Generated Fixes review queue. Renders nothing until hydrated, and
// nothing when empty (honest: no invented work).
// ============================================================

import { useEffect, useState } from 'react';
import { useContentReview } from '@/lib/admin/stores/content-review';
import type { ActionItem } from '@/lib/admin/action-center/types';
import { ActionRow } from './ActionRow';

export function ClientActionItems() {
  const candidates = useContentReview((s) => s.candidates);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;

  const needsReview = candidates.filter((c) => c.status === 'needs_review');
  if (needsReview.length === 0) return null;

  const item: ActionItem = {
    id: 'generated-fixes:needs-review',
    source: 'generated-fixes',
    sourceLabel: 'Generated Fixes',
    title: `${needsReview.length} generated fix${needsReview.length === 1 ? '' : 'es'} await review`,
    detail: 'AI-generated repair/fix pages in your local review queue, before they can go live.',
    severity: 'warning',
    count: needsReview.length,
    href: '/admin/content/generated-fixes',
    cta: 'Review fixes',
  };

  return (
    <ul className="space-y-2">
      <ActionRow item={item} />
    </ul>
  );
}
