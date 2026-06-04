'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Shows a "Manage or cancel subscription" button — but only for a signed-in
 * user who actually has a Stripe customer (i.e. an active/past subscriber).
 * Renders nothing for free or signed-out users, so it's safe to drop anywhere.
 */
export function BillingPortalButton() {
  const [state, setState] = useState<{ canManage: boolean; tier: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/billing/status')
      .then((r) => r.json())
      .then((d: { canManage?: boolean; tier?: string }) => {
        if (active) setState({ canManage: !!d.canManage, tier: d.tier ?? 'free' });
      })
      .catch(() => active && setState({ canManage: false, tier: 'free' }));
    return () => {
      active = false;
    };
  }, []);

  if (!state || !state.canManage) return null;

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = (await res.json()) as { ok?: boolean; url?: string };
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* fall through to re-enable the button */
    }
    setLoading(false);
  };

  return (
    <div className="text-center mt-10">
      <p className="text-sm text-muted-foreground mb-2">
        You&apos;re on the <span className="font-semibold capitalize">{state.tier}</span> plan.
      </p>
      <Button onClick={openPortal} loading={loading} variant="outline">
        Manage or cancel subscription
      </Button>
    </div>
  );
}
