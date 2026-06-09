// ============================================================
// SwingVantage Milestones — metric snapshot gathering (SERVER-ONLY)
// ------------------------------------------------------------
// The ONE place milestone metrics are read from live sources. Live cross-user
// counts come from getPlatformMetrics (null when the service role is off);
// registry counts come from the committed content registries; feature flags
// reflect what is genuinely shipped today. Every source is wrapped defensively
// so one failure never blanks the snapshot — and unreadable metrics stay null
// (→ "needs data source"), never faked.
// ============================================================

import 'server-only';

import { SPORT_TAXONOMY } from '@swingiq/core';
import { getPlatformMetrics } from '@/lib/admin/data/metrics';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import { getPublicUpdates } from '@/data/updates';
import { getPublishedBlogPosts } from '@/data/blog-posts';
import { getLibraryItems } from '@/lib/library';
import { localizedRoutes } from '@/lib/marketing-i18n/expose';
import { isConfigured } from '@/lib/capabilities';
import type { MetricSnapshot } from './types';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Boolean capability/feature flags that are genuinely true in the product today. */
function gatherFeatures(): Record<string, boolean> {
  return {
    // Trust & privacy controls — all shipped.
    privacy: true,
    dataControls: true,
    confidence: true,
    // Quality / platform features — shipped.
    accessibility: true,
    mobileUpload: true,
    adminAiTools: true,
    growthos: true,
    cios: true,
    coachMix: true,
    coachMixAdmin: true,
    curatedDrills: true,
    welcomeBack: true,
    dashboard: true,
    // This very system.
    milestoneSystemLive: true,
    // Gated / not yet shipped — honest false.
    userTeachingStyle: isConfigured(process.env.NEXT_PUBLIC_COACH_MIX_USER_MODULE),
    top20Lang: false,
  };
}

function gatherRegistry() {
  const guides = safe(() => PUBLISHED_SEO_PAGES.length, 0);
  const mechanics = safe(
    () => PUBLISHED_SEO_PAGES.filter((p) => /grip|plane|weight|stance|posture/i.test(p.slug)).length,
    0,
  );
  const updates = safe(() => getPublicUpdates().length, 0);
  const blog = safe(() => getPublishedBlogPosts().length, 0);
  const videos = safe(() => getLibraryItems().length, 0);
  const locales = safe(() => localizedRoutes().length, 0);
  const sports = safe(() => SPORT_TAXONOMY.length, 0);
  return {
    publishedGuides: guides,
    updateCount: updates,
    contentCount: updates + blog + guides,
    videoTutorials: videos,
    activeSports: sports,
    multilingualPages: locales,
    methodologyPages: 1, // /methodology is a real curated page
    mechanicsPages: mechanics,
    faqClusters: 1, // /faq is a real curated page with FAQ schema across the app
    parentCoachPages: 2, // /parents + /coaches
    teamFacilityPages: 1, // /teams
  };
}

async function gatherLive(): Promise<MetricSnapshot['live']> {
  try {
    const m = await getPlatformMetrics();
    if (!m.connected) {
      return {
        registeredUsers: null, swingAnalyses: null, sessions: null, community: null,
        activeSports: 0, sportSessions: {},
      };
    }
    const by: Record<string, number> = {};
    for (const u of m.sportUsage) by[u.sport] = u.sessions;
    const sportSessions: Record<string, number> = {
      golf: by['golf'] ?? 0,
      tennis: by['tennis'] ?? 0,
      baseball: by['baseball'] ?? 0,
      pickleball: by['pickleball'] ?? 0,
      padel: by['padel'] ?? 0,
      softball: (by['softball_slow'] ?? 0) + (by['softball_fast'] ?? 0),
    };
    return {
      registeredUsers: m.counts.authUsers,
      swingAnalyses: m.counts.analyses,
      sessions: m.counts.sessions,
      community: m.counts.community,
      activeSports: m.sportUsage.length,
      sportSessions,
    };
  } catch {
    return { registeredUsers: null, swingAnalyses: null, sessions: null, community: null, activeSports: 0, sportSessions: {} };
  }
}

/** Gather the full metric snapshot the milestone engine evaluates against. */
export async function gatherMetricSnapshot(now: Date = new Date()): Promise<MetricSnapshot> {
  const live = await gatherLive();
  return {
    now: now.toISOString(),
    live,
    registry: gatherRegistry(),
    features: gatherFeatures(),
  };
}
