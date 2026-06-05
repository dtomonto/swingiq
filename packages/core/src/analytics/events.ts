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

  // Improvement loop (Fix Stack + DrillMatch)
  FIX_STACK_CREATED: 'fix_stack_created',
  DRILL_STARTED: 'drill_started',
  DRILL_COMPLETED: 'drill_completed',
  DRILL_FEEDBACK_RECORDED: 'drill_feedback_recorded',

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
  CTA_CLICKED: 'cta_clicked',
  SAMPLE_REPORT_VIEWED: 'sample_report_viewed',
  OUTBOUND_PARTNER_CLICKED: 'outbound_partner_clicked',

  // Growth tools / quizzes
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  TOOL_RESULT_GENERATED: 'tool_result_generated',

  // Email capture
  EMAIL_CAPTURE_VIEWED: 'email_capture_viewed',
  EMAIL_CAPTURE_SUBMITTED: 'email_capture_submitted',

  // Shareable reports
  REPORT_COPIED: 'report_copied',
  REPORT_SHARED: 'report_shared',
  COACH_SHARE_CLICKED: 'coach_share_clicked',
  PDF_DOWNLOADED: 'pdf_downloaded',

  // Athlete General Intelligence
  AGI_VIEWED: 'agi_viewed',
  AGI_KEYSTONE_SHOWN: 'agi_keystone_shown',
  AGI_INSIGHT_EXPANDED: 'agi_insight_expanded',
  AGI_NEXTSTEP_CLICKED: 'agi_nextstep_clicked',
  AGI_DEMO_VIEWED: 'agi_demo_viewed',
  AGI_INSIGHT_FEEDBACK: 'agi_insight_feedback',
  AGI_NARRATED: 'agi_narrated',

  // Trust & safety
  PRIVACY_PAGE_VIEWED: 'privacy_page_viewed',
  PARENT_SAFETY_VIEWED: 'parent_safety_viewed',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
}
