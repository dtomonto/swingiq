// ============================================================
// SwingIQ — Analytics Event Definitions
// Central registry of all trackable analytics events.
// Connect to PostHog, GA4, Segment, or Mixpanel via analytics.ts
// in the web app.
// ============================================================

export const ANALYTICS_EVENTS = {
  // Navigation
  PAGE_VIEW: 'page_view',
  SPORT_SELECTED: 'sport_selected',

  // Onboarding
  PROFILE_STARTED: 'profile_started',
  PROFILE_COMPLETED: 'profile_completed',

  // Video
  VIDEO_UPLOAD_STARTED: 'video_upload_started',
  VIDEO_UPLOAD_COMPLETED: 'video_upload_completed',
  VIDEO_UPLOAD_FAILED: 'video_upload_failed',
  CAMERA_ANGLE_SELECTED: 'camera_angle_selected',

  // Analysis
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  SAMPLE_ANALYSIS_VIEWED: 'sample_analysis_viewed',
  PRIORITY_FIX_VIEWED: 'priority_fix_viewed',

  // Drills
  DRILL_CLICKED: 'drill_clicked',
  PRACTICE_PLAN_SAVED: 'practice_plan_saved',

  // Professional comparison
  PROFESSIONAL_REFERENCE_PREVIEWED: 'professional_reference_previewed',
  PROFESSIONAL_REFERENCE_SELECTED: 'professional_reference_selected',
  SWING_COMPARISON_STARTED: 'swing_comparison_started',

  // Import
  IMAGE_TABLE_UPLOAD_STARTED: 'image_table_upload_started',
  IMAGE_TABLE_EXTRACTION_COMPLETED: 'image_table_extraction_completed',
  IMPORTED_DATA_CONFIRMED: 'imported_data_confirmed',

  // Account
  ACCOUNT_CREATED: 'account_created',
  DATA_EXPORT_REQUESTED: 'data_export_requested',
  DATA_DELETE_REQUESTED: 'data_delete_requested',

  // Marketing
  PRICING_VIEWED: 'pricing_viewed',
  CONVERSION_CTA_CLICKED: 'conversion_cta_clicked',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
}
