'use client';

// ============================================================
// SwingVantage — "Save your progress" prompt
//
// The save-wall moment in the funnel: anyone can try SwingVantage with
// no account, but the instant they build real progress on a device, we
// invite them to create a free account so it is saved to the cloud and
// synced across devices. Creating the account auto-migrates everything
// already on the device (see RelationalSyncProvider). Gentle + dismissible
// — never blocks use.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { useSwingVantageStore } from '@/store';
import { CloudUpload, X } from 'lucide-react';
import { useNudgeSlot, NudgeRegion, NUDGE_PRIORITY } from '@/lib/floating/nudge-manager';

const DISMISS_KEY = 'swingiq.saveProgressPrompt.dismissed';

export function SaveProgressBanner() {
  const { status, mode } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const hasProgress = useSwingVantageStore(
    (s) =>
      s.sessions.length > 0 ||
      s.video_analyses.length > 0 ||
      s.clubs.length > 0 ||
      !!s.profile ||
      Object.keys(s.sportProfiles).length > 0,
  );

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      /* sessionStorage unavailable — treat as not dismissed */
    }
  }, []);

  // Only when real accounts are available, the visitor is signed out, they
  // have something worth saving, and they haven't dismissed it this session.
  const eligible =
    mounted && mode === 'cloud' && status === 'anonymous' && hasProgress && !dismissed;
  // Share the single bottom-edge nudge slot (Continue-Progress outranks this).
  const { active } = useNudgeSlot('saveProgress', NUDGE_PRIORITY.saveProgress, eligible);
  if (!active) {
    return null;
  }

  const next = encodeURIComponent(pathname || '/dashboard');

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <NudgeRegion role="region" aria-label="Save your progress">
      <div className="pointer-events-auto mx-auto max-w-xl rounded-2xl border border-primary/30 bg-card shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
            <CloudUpload size={18} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Save your progress</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Create a free account to keep your sessions, streaks, and history safe — and
              pick up right where you left off on any device. Everything on this device comes with you.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/signup?next=${next}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <CloudUpload size={14} aria-hidden="true" /> Create free account
              </Link>
              <Link
                href={`/login?next=${next}`}
                className="text-xs font-semibold text-primary hover:underline px-1"
              >
                I already have one
              </Link>
              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground px-1"
              >
                Keep trying without saving
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground p-1 -m-1"
            aria-label="Dismiss"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </NudgeRegion>
  );
}
