// Shared test factories (not a *.test.ts, so jest won't run it as a suite).
import { assessSurface } from '../opportunityEngine';
import { getSurface } from '../surfaces';
import { buildBrief } from '../briefGenerator';
import type {
  VideoAsset,
  VideoCreativeBrief,
  VideoOpportunity,
  VideoPerformanceMetric,
  VideoPerformanceScore,
} from '../types';

const FIXED = new Date('2026-06-05T00:00:00Z');

export function sampleOpp(id = 'upload-record'): VideoOpportunity {
  const surface = getSurface(id);
  if (!surface) throw new Error(`unknown surface ${id}`);
  return assessSurface(surface, new Set(), FIXED);
}

export function sampleBrief(id = 'upload-record'): VideoCreativeBrief {
  return buildBrief(sampleOpp(id), {}, 1, FIXED);
}

export function sampleAsset(over: Partial<VideoAsset> = {}): VideoAsset {
  return {
    id: 'asset_1',
    briefId: 'b1',
    opportunityId: 'opp_x',
    providerId: 'mock',
    jobId: 'j1',
    title: 'Test video',
    description: 'desc',
    poster: 'data:image/svg+xml;charset=utf-8,%3Csvg%3E',
    thumbnail: 'data:image/svg+xml;charset=utf-8,%3Csvg%3E',
    captions: [{ lang: 'en', src: 'data:text/vtt;charset=utf-8,WEBVTT', label: 'English' }],
    transcript: 'line one\nline two',
    durationSec: 60,
    aspectRatio: '16:9',
    isPlaceholder: false,
    published: true,
    lifecycle: 'evergreen',
    version: 1,
    seoUploadDate: FIXED.toISOString(),
    seoUpdatedDate: FIXED.toISOString(),
    createdAt: FIXED.toISOString(),
    updatedAt: FIXED.toISOString(),
    ...over,
  };
}

export function sampleMetric(over: Partial<VideoPerformanceMetric> = {}): VideoPerformanceMetric {
  return {
    id: 'm1',
    assetId: 'asset_1',
    placementId: 'p1',
    windowStart: FIXED.toISOString(),
    windowEnd: FIXED.toISOString(),
    impressions: 100,
    plays: 60,
    pauses: 10,
    completions: 40,
    avgCompletion: 0.7,
    ctaClicks: 8,
    replays: 3,
    muteToggles: 2,
    captionToggles: 1,
    dropOffPoint: 0.3,
    downstreamConversions: 5,
    ...over,
  };
}

export function sampleScore(over: Partial<VideoPerformanceScore> = {}): VideoPerformanceScore {
  return {
    assetId: 'asset_1',
    engagement: 75,
    conversionContribution: 60,
    education: 70,
    frictionReduction: 70,
    freshness: 90,
    recommendationPriority: 20,
    ...over,
  };
}
