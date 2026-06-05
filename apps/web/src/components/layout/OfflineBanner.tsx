'use client';

import { CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/offline/useOnlineStatus';

/**
 * Slim banner shown only when the browser is offline. SwingVantage keeps
 * working — everything is saved on the device — so the message is
 * reassuring, not alarming.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-center text-xs font-medium text-warning"
    >
      <CloudOff size={14} className="shrink-0" aria-hidden="true" />
      You&apos;re offline — SwingVantage keeps working and saves everything on this device.
    </div>
  );
}
