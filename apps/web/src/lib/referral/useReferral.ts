'use client';

// ============================================================
// SwingVantage — ReferralOS: React hook
// ------------------------------------------------------------
// Thin useSyncExternalStore wrapper over the self-contained store,
// plus derived stats and a one-call share() that records the share
// and opens the right channel (Web Share API when available).
// ============================================================

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import * as store from './store';
import { buildInviteUrl, computeStats, shareMessage } from './engine';
import { SHARE_SUBJECT } from './program';
import type { ReferralState, ReferralStats, ShareChannel } from './types';

export interface UseReferral {
  state: ReferralState;
  stats: ReferralStats;
  inviteUrl: string;
  code: string;
  share: (channel: ShareChannel) => Promise<void>;
  copyLink: () => Promise<boolean>;
  acknowledgeTiers: (ids: string[]) => void;
  setEnabled: (enabled: boolean) => void;
}

function currentOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/** Build the channel-specific share/compose URL. */
function channelUrl(channel: ShareChannel, msg: string, url: string): string | null {
  const text = encodeURIComponent(msg);
  const u = encodeURIComponent(url);
  switch (channel) {
    case 'sms': return `sms:?&body=${text}`;
    case 'whatsapp': return `https://wa.me/?text=${text}`;
    case 'email': return `mailto:?subject=${encodeURIComponent(SHARE_SUBJECT)}&body=${text}`;
    case 'x': return `https://twitter.com/intent/tweet?text=${text}`;
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case 'reddit': return `https://www.reddit.com/submit?url=${u}&title=${encodeURIComponent(SHARE_SUBJECT)}`;
    default: return null;
  }
}

export function useReferral(): UseReferral {
  const state = useSyncExternalStore(store.subscribe, store.read, store.read);
  const stats = useMemo(() => computeStats(state), [state]);
  const inviteUrl = useMemo(() => buildInviteUrl(state.code, currentOrigin()), [state.code]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      store.recordShare('copy');
      return true;
    } catch { return false; }
  }, [inviteUrl]);

  const share = useCallback(async (channel: ShareChannel) => {
    const msg = shareMessage(channel, inviteUrl);
    // Prefer the native share sheet on mobile.
    if (channel === 'native' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: SHARE_SUBJECT, text: msg, url: inviteUrl });
        store.recordShare('native');
        return;
      } catch { /* user cancelled — don't record */ return; }
    }
    if (channel === 'copy') { await copyLink(); return; }
    const target = channelUrl(channel, msg, inviteUrl);
    if (target && typeof window !== 'undefined') {
      window.open(target, '_blank', 'noopener,noreferrer');
      store.recordShare(channel);
    }
  }, [inviteUrl, copyLink]);

  const acknowledgeTiers = useCallback((ids: string[]) => store.acknowledgeTiers(ids), []);
  const setEnabled = useCallback((enabled: boolean) => store.setSettings({ enabled }), []);

  return { state, stats, inviteUrl, code: state.code, share, copyLink, acknowledgeTiers, setEnabled };
}
