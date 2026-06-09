// ============================================================
// SwingVantage Milestones — metric resolution (PURE)
// ------------------------------------------------------------
// Maps a milestone's trigger to a REAL value from the live metric snapshot,
// and declares the honest data-source tier. The cardinal rule: anything we
// cannot read in-app resolves to { value: null, source: 'needs_data_source' }
// so it can NEVER auto-earn. PURE + deterministic.
// ============================================================

import type {
  DataSourceTier,
  MetricSnapshot,
  MilestoneDefinition,
  TriggerType,
} from './types';

/** Trigger types that are genuinely unreadable in-app today (honest gaps). */
const NEEDS_SOURCE: TriggerType[] = [
  'total_visitors',
  'swing_uploads', // videos are never uploaded/stored — see lib/admin/data/metrics.ts
  'retests_completed',
  'drill_plans_generated',
  'multi_sport_users',
  'sample_report_views',
  'guide_views',
  'faq_count',
  'organic_clicks',
  'search_impressions',
  'indexed_pages',
  'backlinks',
  'keyword_rankings',
  'curated_drill_recommendations',
  'trend_based_drills',
  'coach_style_configs',
  'countries_with_visitors',
  'user_feedback_count',
  'improvement_patterns',
  'uptime_percentage',
  'page_speed_good',
  'accessibility_improvements',
  'system_quality',
];

export interface ResolvedMetric {
  value: number | null;
  source: DataSourceTier;
}

/** Resolve a definition's trigger metric against the snapshot. PURE. */
export function resolveMetric(def: MilestoneDefinition, snap: MetricSnapshot): ResolvedMetric {
  const t = def.trigger.type;

  if (NEEDS_SOURCE.includes(t)) return { value: null, source: 'needs_data_source' };

  switch (t) {
    case 'admin_manual':
      // Only an admin can attest these — null until overridden in the UI.
      return { value: null, source: 'admin_manual' };

    case 'registered_users':
      return live(snap.live.registeredUsers);
    case 'swing_analyses':
      return live(snap.live.swingAnalyses);
    case 'sport_analyses': {
      const key = def.trigger.key ?? '';
      const v = snap.live.sportSessions[key];
      // null live counts → needs data; otherwise the (possibly 0) real count.
      if (snap.live.swingAnalyses === null && snap.live.sessions === null) {
        return { value: null, source: 'needs_data_source' };
      }
      return { value: v ?? 0, source: 'live' };
    }

    case 'active_sports_count':
      return { value: snap.registry.activeSports, source: 'registry' };
    case 'published_guides':
      return { value: snap.registry.publishedGuides, source: 'registry' };
    case 'mechanics_pages':
      return { value: snap.registry.mechanicsPages, source: 'registry' };
    case 'methodology_pages':
      return { value: snap.registry.methodologyPages, source: 'registry' };
    case 'faq_clusters':
      return { value: snap.registry.faqClusters, source: 'registry' };
    case 'update_count':
      return { value: snap.registry.updateCount, source: 'registry' };
    case 'content_count':
      return { value: snap.registry.contentCount, source: 'registry' };
    case 'video_tutorials':
      return { value: snap.registry.videoTutorials, source: 'registry' };
    case 'multilingual_pages':
      return { value: snap.registry.multilingualPages, source: 'registry' };
    case 'parent_coach_pages':
      return { value: snap.registry.parentCoachPages, source: 'registry' };
    case 'team_facility_pages':
      return { value: snap.registry.teamFacilityPages, source: 'registry' };

    case 'feature_flag': {
      const key = def.trigger.key ?? '';
      return { value: snap.features[key] ? 1 : 0, source: 'feature' };
    }

    default:
      return { value: null, source: 'needs_data_source' };
  }

  function live(v: number | null): ResolvedMetric {
    return v === null ? { value: null, source: 'needs_data_source' } : { value: v, source: 'live' };
  }
}
