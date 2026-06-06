// ============================================================
// Player Recruiting Hub — engagement analytics (pure aggregation)
// ------------------------------------------------------------
// Turns raw EngagementEvents into the simple, honest insights an
// athlete actually acts on ("your hitting reel was watched 3 times",
// "your full-game footage hasn't been viewed"). No invasive tracking:
// viewers are coarse hashed markers, regions are country/state only,
// and the coach view discloses that engagement is collected.
// ============================================================

import type { EngagementEvent, FilmAsset, HighlightReel } from './types';

export interface EngagementSummary {
  profileViews: number;
  uniqueViewers: number;
  videoViews: number;
  avgWatchPct: number; // 0–100
  packetDownloads: number;
  contactSubmissions: number;
  linkClicks: number;
  repeatVisitors: number;
  revokedAttempts: number;
  /** Most-watched targets (film/reel ids) with counts. */
  topVideos: { targetId: string; views: number }[];
  /** Coarse regions seen. */
  regions: { region: string; count: number }[];
}

export function summarizeEngagement(events: EngagementEvent[]): EngagementSummary {
  const profileViews = events.filter((e) => e.type === 'profile_view');
  const videoViews = events.filter((e) => e.type === 'video_view');
  const watch = events.filter((e) => e.type === 'video_watch_progress' && typeof e.progress === 'number');

  const viewerCounts = new Map<string, number>();
  for (const e of profileViews) {
    if (!e.viewerKey) continue;
    viewerCounts.set(e.viewerKey, (viewerCounts.get(e.viewerKey) ?? 0) + 1);
  }
  const repeatVisitors = [...viewerCounts.values()].filter((n) => n > 1).length;

  const videoCounts = new Map<string, number>();
  for (const e of videoViews) {
    if (!e.targetId) continue;
    videoCounts.set(e.targetId, (videoCounts.get(e.targetId) ?? 0) + 1);
  }
  const topVideos = [...videoCounts.entries()]
    .map(([targetId, views]) => ({ targetId, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const regionCounts = new Map<string, number>();
  for (const e of events) {
    if (!e.region) continue;
    regionCounts.set(e.region, (regionCounts.get(e.region) ?? 0) + 1);
  }
  const regions = [...regionCounts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  const avgWatchPct = watch.length
    ? Math.round((watch.reduce((s, e) => s + (e.progress ?? 0), 0) / watch.length) * 100)
    : 0;

  return {
    profileViews: profileViews.length,
    uniqueViewers: viewerCounts.size,
    videoViews: videoViews.length,
    avgWatchPct,
    packetDownloads: events.filter((e) => e.type === 'packet_download').length,
    contactSubmissions: events.filter((e) => e.type === 'contact_submit').length,
    linkClicks: events.filter((e) => e.type === 'link_click').length,
    repeatVisitors,
    revokedAttempts: events.filter((e) => e.type === 'revoked_attempt').length,
    topVideos,
    regions,
  };
}

/** Plain-English, actionable insights derived from the summary + library. */
export function engagementInsights(
  summary: EngagementSummary,
  film: FilmAsset[],
  reels: HighlightReel[],
): string[] {
  const insights: string[] = [];
  const nameFor = (id: string): string =>
    film.find((f) => f.id === id)?.title ?? reels.find((r) => r.id === id)?.title ?? 'a clip';

  if (summary.profileViews === 0 && summary.videoViews === 0) {
    insights.push('No views yet — share a link with a coach or send your first outreach to get on a screen.');
    return insights;
  }

  if (summary.topVideos[0]) {
    const t = summary.topVideos[0];
    insights.push(`"${nameFor(t.targetId)}" is your most-watched film (${t.views} view${t.views === 1 ? '' : 's'}).`);
  }

  // Unwatched game footage is a common miss.
  const gameFilm = film.filter(
    (f) => !f.deletedAt && ['full_game', 'tournament_footage', 'match_play', 'full_at_bat'].includes(f.category),
  );
  const watchedIds = new Set(summary.topVideos.map((v) => v.targetId));
  const unwatchedGame = gameFilm.find((f) => !watchedIds.has(f.id));
  if (unwatchedGame) {
    insights.push(`Your "${unwatchedGame.title}" footage hasn't been viewed — mention it in your next message.`);
  }

  if (summary.repeatVisitors > 0) {
    insights.push(`${summary.repeatVisitors} viewer(s) came back for a second look — a strong interest signal.`);
  }

  if (summary.videoViews >= 5 && summary.avgWatchPct > 0 && summary.avgWatchPct < 35) {
    insights.push(`Average watch time is ${summary.avgWatchPct}% — your reel may be too long. Aim for a ~90s primary reel.`);
  }

  if (summary.contactSubmissions > 0) {
    insights.push(`${summary.contactSubmissions} coach contact${summary.contactSubmissions === 1 ? '' : 's'} came in through your profile — follow up promptly.`);
  }

  if (summary.revokedAttempts > 0) {
    insights.push(`${summary.revokedAttempts} attempt(s) hit a revoked/expired link — re-share an active link if that was a coach you want.`);
  }

  return insights;
}
