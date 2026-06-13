'use client';

import { useEffect } from 'react';
import { track, type AnalyticsEventName } from '@/lib/analytics';

/**
 * Fires a single page-view analytics event on mount for an authority/education
 * page (e.g. AUTHORITY_PAGE_VIEWED, TRUST_PAGE_VIEWED). Render once near the
 * top of a server-component page; it renders nothing.
 */
export function AuthorityPageView({
  event,
  slug,
  category,
}: {
  event: AnalyticsEventName;
  slug: string;
  category?: string;
}) {
  useEffect(() => {
    track(event, { slug, ...(category ? { category } : {}) });
    // Fire once per mount for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
