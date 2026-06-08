'use client';

// ============================================================
// useCoachMixPreviewAccess — who may SEE the user-facing Coach Mix
// ------------------------------------------------------------
// Resolves the three ways the "Curated Swing Drills" module can be
// visible, in priority order:
//   1. envOn      — NEXT_PUBLIC_COACH_MIX_USER_MODULE (launched to ALL)
//   2. flagOn     — the `curated_drills_widget_enabled` operator flag
//                   (admin override on this device)
//   3. adminPreview — the logged-in user is an admin (server-checked)
//
// `show` is true if ANY holds. `adminPreview` is reported separately so
// the UI can show an honest "Admin preview" badge while it is NOT yet
// live for regular athletes.
// ============================================================

import { useEffect, useState } from 'react';
import { isCoachMixUserModuleEnabled } from '@/lib/central-intelligence/coach-mix/config';
import { isFlagEnabled } from '@/lib/admin/stores/feature-flags';

export interface CoachMixPreviewAccess {
  /** Render the module? */
  show: boolean;
  /** True when visible ONLY because the viewer is an admin (not yet public). */
  adminPreview: boolean;
  /** The global launch switch is on (visible to everyone). */
  envOn: boolean;
}

export function useCoachMixPreviewAccess(): CoachMixPreviewAccess {
  const envOn = isCoachMixUserModuleEnabled();
  const [adminPreview, setAdminPreview] = useState(false);
  const [flagOn, setFlagOn] = useState(false);

  useEffect(() => {
    // Operator flag is a localStorage-backed store; read it after mount to
    // avoid any SSR/first-paint mismatch.
    try {
      setFlagOn(isFlagEnabled('curated_drills_widget_enabled'));
    } catch {
      /* no-op */
    }

    if (envOn) return; // already public — no need to ask the server.
    let active = true;
    fetch('/api/coach-mix/preview-access', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { adminPreview: false }))
      .then((d: { adminPreview?: boolean }) => {
        if (active) setAdminPreview(Boolean(d.adminPreview));
      })
      .catch(() => {
        /* network/unauthed → stay hidden */
      });
    return () => {
      active = false;
    };
  }, [envOn]);

  return {
    show: envOn || flagOn || adminPreview,
    adminPreview: !envOn && (adminPreview || flagOn),
    envOn,
  };
}
