'use client';

// ============================================================
// SwingVantage — ReferralOS: ?ref= capture (referred-visitor side)
// ------------------------------------------------------------
// Renders nothing. On mount, if the URL carries a ?ref= code, it parks
// it in localStorage so the signup flow can attribute the referral.
// Mount this on the invite landing page (/start).
// ============================================================

import { useEffect } from 'react';
import { REFERRAL_PARAM, capturePendingReferral } from '@/lib/referral';

export function ReferralCapture() {
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get(REFERRAL_PARAM);
      if (code) capturePendingReferral(code.trim().toUpperCase());
    } catch { /* no-op */ }
  }, []);
  return null;
}
