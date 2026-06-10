'use client';

import { useMemo } from 'react';
import { track } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@swingiq/core';
import type { AnalyticsEventName } from '@swingiq/core';
import { RecordAssistAnalytics } from '../engines/analytics-engine';
import type { RecordAssistAnalyticsEvent } from '../types';

/**
 * Map RecordAssist's local event names onto the platform's central
 * ANALYTICS_EVENTS registry (snake_case strings match 1:1). Anything not
 * yet registered in core degrades gracefully to a passthrough string so a
 * missing-event never breaks the capture flow.
 */
function toPlatformEvent(event: RecordAssistAnalyticsEvent): AnalyticsEventName {
  const registry = ANALYTICS_EVENTS as Record<string, AnalyticsEventName>;
  return registry[event.toUpperCase()] ?? (event as AnalyticsEventName);
}

/** Stable RecordAssist analytics instance wired to the app's `track()`. */
export function useRecordAssistAnalytics(): RecordAssistAnalytics {
  return useMemo(
    () =>
      new RecordAssistAnalytics((event, props) => {
        track(toPlatformEvent(event), props ?? {});
      }),
    [],
  );
}
