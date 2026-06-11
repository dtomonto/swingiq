'use client';

// ============================================================
// useFoundingProgress — the banner's brain (client)
// ------------------------------------------------------------
// Composes the user's LOCAL progress (profile completion + valid
// sessions, from the main store) with the GLOBAL campaign count
// (server) and the cached member number. When the user becomes
// eligible it claims a server-assigned number exactly once, caches
// it, and unlocks the Founding Member achievement. The client never
// invents the member number — the server is the authority.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSwingVantageStore } from '@/store';
import { useAuth } from '@/lib/auth/useAuth';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import {
  buildProfileSnapshot,
  buildSessionInputs,
  calculateProfileCompletion,
  getValidSessionCount,
  evaluateFoundingJourney,
  earnedSessionMilestones,
  type FoundingCampaignProgress,
  type FoundingUserProgress,
  type ProfileCompletion,
  type StoreStateLike,
} from '@/lib/central-intelligence';
import type { SportId } from '@swingiq/core';
import type { ChallengeContext } from '@/lib/community/types';
import { buildSportJourney } from '@/lib/founding-journey/sport-journey';
import {
  useCentralIntelligenceData,
  setCachedFoundingClaim,
  earnAchievement,
  hasAchievement,
} from '@/lib/central-intelligence/store';
import { FOUNDING_MEMBER_ACHIEVEMENT } from '@/lib/central-intelligence/achievements';
import type { FoundingBannerState } from './banner-content';

export type { FoundingBannerState };

export interface FoundingProgressView {
  mounted: boolean;
  authed: boolean;
  campaign: FoundingCampaignProgress | null;
  user: FoundingUserProgress;
  completion: ProfileCompletion;
  memberNumber: number | null;
  bannerState: FoundingBannerState;
  claiming: boolean;
}

export function useFoundingProgress(): FoundingProgressView {
  // Main store slices (each a stable reference until it changes).
  const profile = useSwingVantageStore((s) => s.profile);
  const sportProfiles = useSwingVantageStore((s) => s.sportProfiles);
  const clubs = useSwingVantageStore((s) => s.clubs);
  const sportEquipment = useSwingVantageStore((s) => s.sportEquipment);
  const sessions = useSwingVantageStore((s) => s.sessions);
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);

  const ci = useCentralIntelligenceData();
  const { user, status } = useAuth();
  const authed = status === 'authenticated';

  const [mounted, setMounted] = useState(false);
  const [campaign, setCampaign] = useState<FoundingCampaignProgress | null>(null);
  const [claiming, setClaiming] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Local computations ──────────────────────────────────────
  const { completion, validSessionCount, completedFoundingCount, user: userProgress } = useMemo(() => {
    const state: StoreStateLike = {
      profile,
      sportProfiles: sportProfiles as StoreStateLike['sportProfiles'],
      clubs: clubs as unknown[],
      sportEquipment: sportEquipment as unknown as Record<string, unknown[]>,
      sessions: sessions as StoreStateLike['sessions'],
      video_analyses: videoAnalyses as StoreStateLike['video_analyses'],
    };
    const snapshot = buildProfileSnapshot(state, ci.primarySportOverride);
    const comp = calculateProfileCompletion(snapshot);
    const validCount = getValidSessionCount(buildSessionInputs(state));
    // Per-sport founding journey: completion of the athlete's OWN sport's
    // founding challenges is the live qualification gate. Founding challenges
    // depend only on sport-filtered sessions/analyses, so an empty export ctx
    // suffices for the count.
    const ctx: ChallengeContext = { sessions, videoAnalyses, lastExportAt: null, exportCount: 0, joinedAt: '' };
    const sport = (comp.sport ?? null) as SportId | null;
    const completedFounding = sport ? buildSportJourney(sport, ctx).completed : 0;
    const up = evaluateFoundingJourney({
      completedFoundingCount: completedFounding,
      memberNumber: ci.foundingClaim?.memberNumber ?? null,
      qualifiedAt: ci.foundingClaim?.qualifiedAt ?? null,
      campaignFull: campaign?.full ?? false,
    });
    return { completion: comp, validSessionCount: validCount, completedFoundingCount: completedFounding, user: up };
  }, [profile, sportProfiles, clubs, sportEquipment, sessions, videoAnalyses, ci.primarySportOverride, ci.foundingClaim, campaign?.full]);

  const memberNumber = ci.foundingClaim?.memberNumber ?? null;

  // ── Fetch global campaign progress ──────────────────────────
  const refreshCampaign = useCallback(async () => {
    try {
      const res = await fetch('/api/central-intelligence/founding/progress');
      if (res.ok) setCampaign((await res.json()) as FoundingCampaignProgress);
    } catch {
      // banner degrades gracefully — keep last known / null
    }
  }, []);
  useEffect(() => { void refreshCampaign(); }, [refreshCampaign]);

  // ── Earn session milestones locally as they're crossed ──────
  useEffect(() => {
    if (!mounted) return;
    for (const m of earnedSessionMilestones(validSessionCount)) {
      if (!hasAchievement(m.id)) earnAchievement(m.id);
    }
  }, [mounted, validSessionCount]);

  // ── Auto-claim the server member number once eligible ───────
  const claimedRef = useRef(false);
  useEffect(() => {
    if (!mounted || !authed || !user?.id) return;
    if (memberNumber != null) return; // already a member
    if (!userProgress.eligible) return; // not yet qualified
    if (claimedRef.current || claiming) return;
    claimedRef.current = true;
    setClaiming(true);

    (async () => {
      try {
        const res = await fetch('/api/central-intelligence/founding/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            sport: completion.sport,
            profileCompleted: completion.completed,
            validSessionCount,
            completedFoundingCount,
          }),
        });
        const data = (await res.json()) as {
          ok: boolean; memberNumber: number | null; status: string | null;
          qualifiedAt: string | null; progress: FoundingCampaignProgress;
        };
        if (data.ok) {
          setCachedFoundingClaim({
            memberNumber: data.memberNumber,
            status: data.status ?? 'qualified',
            qualifiedAt: data.qualifiedAt,
            lastSyncedAt: new Date().toISOString(),
          });
          if (data.memberNumber != null) {
            earnAchievement(FOUNDING_MEMBER_ACHIEVEMENT.id);
            track(ANALYTICS_EVENTS.FOUNDING_MEMBER_NUMBER_ASSIGNED, { member_number: data.memberNumber });
          }
          track(ANALYTICS_EVENTS.FOUNDING_MEMBER_QUALIFIED, { sport: completion.sport ?? 'unknown' });
          if (data.progress) setCampaign(data.progress);
        } else {
          claimedRef.current = false; // allow a later retry (e.g. count changed)
        }
      } catch {
        claimedRef.current = false;
      } finally {
        setClaiming(false);
      }
    })();
  }, [mounted, authed, user?.id, userProgress.eligible, memberNumber, claiming, completion.sport, completion.completed, validSessionCount, completedFoundingCount]);

  // ── Derive the banner state ─────────────────────────────────
  const bannerState: FoundingBannerState = useMemo(() => {
    if (memberNumber != null) return 'qualified';
    if (!authed) return 'logged_out';
    if (campaign?.full) return 'full';
    if (userProgress.eligible) return 'qualified'; // claiming a number
    if (completedFoundingCount > 0) return 'sessions_needed'; // journey in progress
    return 'profile_incomplete'; // journey not started
  }, [memberNumber, authed, campaign?.full, userProgress.eligible, completedFoundingCount]);

  return {
    mounted,
    authed,
    campaign,
    user: userProgress,
    completion,
    memberNumber,
    bannerState,
    claiming,
  };
}
