// ============================================================
// SwingVantage — Analytics Event Definitions
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
  // Which start method a visitor chooses on /start (video | import | quiz).
  // Fires at the moment of choice so the funnel shows the video-vs-import-vs-
  // quiz split — the key drop-off signal before a first result. + sport, context.
  INPUT_METHOD_SELECTED: 'input_method_selected',

  // Video
  VIDEO_UPLOAD_STARTED: 'video_upload_started',
  VIDEO_UPLOAD_COMPLETED: 'video_upload_completed',
  VIDEO_UPLOAD_FAILED: 'video_upload_failed',
  CAMERA_ANGLE_SELECTED: 'camera_angle_selected',

  // Analysis. AI observability props (P2) — non-PII, present only when an AI
  // provider actually ran:
  //   ANALYSIS_COMPLETED + sport, configured, ai_provider, ai_model,
  //     ai_latency_ms, ai_speed, ai_confidence (0–1)
  //   ANALYSIS_FAILED    + sport, reason, error_code (cancelled | network |
  //     timeout | rate_limited | payload_too_large | provider_error | error)
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  SAMPLE_ANALYSIS_VIEWED: 'sample_analysis_viewed',
  PRIORITY_FIX_VIEWED: 'priority_fix_viewed',

  // AI Coach (chat). The AI-Coach-Quality funnel: opened → question_asked →
  // answered → answer_rated. Props are non-PII — never the question or answer
  // text. See lib/ai-coach/analytics.ts.
  //   AI_COACH_OPENED        + sport, surface (page | floating)
  //   AI_COACH_QUESTION_ASKED + sport, surface, source (typed | suggested)
  //   AI_COACH_ANSWERED      + sport, surface, ok, cached, fallback,
  //     ai_provider, ai_model, ai_latency_ms (AI observability, when AI ran)
  //   AI_COACH_ANSWER_RATED  + sport, surface, value (helpful | not_helpful)
  AI_COACH_OPENED: 'ai_coach_opened',
  AI_COACH_QUESTION_ASKED: 'ai_coach_question_asked',
  AI_COACH_ANSWERED: 'ai_coach_answered',
  AI_COACH_ANSWER_RATED: 'ai_coach_answer_rated',

  // Drills
  DRILL_CLICKED: 'drill_clicked',
  PRACTICE_PLAN_SAVED: 'practice_plan_saved',

  // Improvement loop (Fix Stack + DrillMatch)
  FIX_STACK_CREATED: 'fix_stack_created',
  DRILL_STARTED: 'drill_started',
  DRILL_COMPLETED: 'drill_completed',
  DRILL_FEEDBACK_RECORDED: 'drill_feedback_recorded', // + sport, value (helped|no_change|hurt), fault_id
  // "Do our fixes work?" — did the athlete take, or wave off, the curated
  // recommendation. Powers acceptance-rate analysis per fault/sport.
  RECOMMENDATION_ACCEPTED: 'recommendation_accepted', // + sport, fault_id, action (saved|completed)
  RECOMMENDATION_DISMISSED: 'recommendation_dismissed', // + sport, fault_id
  // The loop CLOSES: a completed retest result is surfaced (the north-star
  // "Weekly Completed Improvement Loops" event). Distinct from the intent
  // signal RETEST_PLAN_CLICKED.
  RETEST_COMPLETED: 'retest_completed',

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
  AGI_PLAN_COMMITTED: 'agi_plan_committed',
  AGI_RETEST_DUE: 'agi_retest_due',

  // Trust & safety
  PRIVACY_PAGE_VIEWED: 'privacy_page_viewed',
  PARENT_SAFETY_VIEWED: 'parent_safety_viewed',

  // Tutorial videos (inline placements + Tutorial Center)
  // Each carries metadata: video_id, placement, page, sport,
  // user_journey_stage, device_type — see lib/tutorial/analytics.ts.
  TUTORIAL_VIDEO_IMPRESSION: 'tutorial_video_impression',
  TUTORIAL_VIDEO_PLAY: 'tutorial_video_play',
  TUTORIAL_VIDEO_PAUSE: 'tutorial_video_pause',
  TUTORIAL_VIDEO_COMPLETE: 'tutorial_video_complete',
  TUTORIAL_VIDEO_ERROR: 'tutorial_video_error',
  TUTORIAL_VIDEO_DISMISSED: 'tutorial_video_dismissed',
  TUTORIAL_VIDEO_CTA_CLICKED: 'tutorial_video_cta_clicked',

  // Video Studio (AI video generator placements). Each carries metadata:
  // asset_id, placement, page, sport, journey_stage, video_version,
  // completion, device_type — see lib/video-studio/analytics.ts.
  VIDEO_STUDIO_IMPRESSION: 'video_studio_impression',
  VIDEO_STUDIO_PLAY: 'video_studio_play',
  VIDEO_STUDIO_PAUSE: 'video_studio_pause',
  VIDEO_STUDIO_COMPLETE: 'video_studio_complete',
  VIDEO_STUDIO_CTA_CLICK: 'video_studio_cta_click',
  VIDEO_STUDIO_MUTE: 'video_studio_mute',
  VIDEO_STUDIO_UNMUTE: 'video_studio_unmute',
  VIDEO_STUDIO_CAPTION_TOGGLE: 'video_studio_caption_toggle',
  VIDEO_STUDIO_REPLAY: 'video_studio_replay',
  VIDEO_STUDIO_ERROR: 'video_studio_error',

  // Athletic Journey (player-development pathway). Each carries metadata:
  // sport, stage_code, confidence, momentum_band — see lib/athletic-journey.
  ATHLETIC_JOURNEY_VIEWED: 'athletic_journey_viewed',
  JOURNEY_SPORT_SELECTED: 'journey_sport_selected',
  JOURNEY_STAGE_VIEWED: 'journey_stage_viewed',
  JOURNEY_STAGE_CALCULATED: 'journey_stage_calculated',
  JOURNEY_CONFIDENCE_CHANGED: 'journey_confidence_changed',
  JOURNEY_MOMENTUM_CHANGED: 'journey_momentum_changed',
  JOURNEY_RATING_ADDED: 'journey_rating_added',
  JOURNEY_HANDICAP_ADDED: 'journey_handicap_added',
  JOURNEY_MISSING_DATA_CLICKED: 'journey_missing_data_clicked',
  JOURNEY_PRACTICE_VIEWED: 'journey_practice_viewed',
  JOURNEY_MILESTONE_COMPLETED: 'journey_milestone_completed',
  JOURNEY_IN_DEVELOPMENT_VIEWED: 'journey_in_development_viewed',
  JOURNEY_WAITLIST_JOINED: 'journey_waitlist_joined',
  JOURNEY_BASIC_PROFILE_CREATED: 'journey_basic_profile_created',
  JOURNEY_RECALCULATED: 'journey_recalculated',

  // Five-persona plan (intent-first acquisition + retention funnel).
  // Standardize two props everywhere: `sport` and `persona`. Per-event
  // extras noted below. See docs/FIVE_PERSONA_MASTER_PLAN.md §15.
  PERSONA_CARD_CLICKED: 'persona_card_clicked', // + intent, position, surface
  PERSONA_PATH_VIEWED: 'persona_path_viewed', // persona landing/path surfaced
  SPORT_PAGE_ENGAGED: 'sport_page_engaged', // 50% scroll / 20s on a sport hub
  UPGRADE_PROMPT_VIEWED: 'upgrade_prompt_viewed', // + feature, tier, surface
  UPGRADE_CLICKED: 'upgrade_clicked', // + feature, tier, surface
  RETEST_PLAN_CLICKED: 'retest_plan_clicked', // + days

  // CentralIntelligenceOS + Founding Fathers campaign. Props never carry
  // private data — only campaign state and anonymized counts. See
  // lib/central-intelligence and docs/CENTRAL_INTELLIGENCE_OS.md.
  FOUNDING_BANNER_VIEWED: 'founding_banner_viewed', // + banner_state
  FOUNDING_CTA_CLICKED: 'founding_cta_clicked', // + banner_state, cta
  PROFILE_COMPLETION_STARTED: 'profile_completion_started', // + sport
  PROFILE_COMPLETION_UPDATED: 'profile_completion_updated', // + sport, percent
  SESSION_RECORDED: 'session_recorded', // + sport, source
  VALID_SESSION_RECORDED: 'valid_session_recorded', // + sport, source, count
  FOUNDING_PROGRESS_UPDATED: 'founding_progress_updated', // + valid_sessions, profile_complete
  FOUNDING_MEMBER_QUALIFIED: 'founding_member_qualified', // + sport
  FOUNDING_MEMBER_NUMBER_ASSIGNED: 'founding_member_number_assigned', // + member_number
  MEMBERSHIP_TIERS_UNLOCKED: 'membership_tiers_unlocked',
  CENTRAL_INTELLIGENCE_VIEWED: 'central_intelligence_viewed', // admin command center

  // Milestone Authority System. Props carry only milestone metadata (slug,
  // category, authority_band) — never private data. See lib/milestones.
  MILESTONE_PAGE_VIEW: 'milestone_page_view', // + slug, category
  MILESTONE_CTA_CLICK: 'milestone_cta_click', // + slug, cta
  MILESTONE_INTERNAL_LINK_CLICK: 'milestone_internal_link_click', // + slug, target
  MILESTONE_CARD_CLICK: 'milestone_card_click', // + slug, surface

  // Motion Lab (slow-motion video overlay lab — racquet & swing sports).
  // Props carry ONLY non-private analysis metadata: sport, motion, view,
  // skill, confidence band, overlay layer, playback speed, viewer mode.
  // Never the video, landmarks, or any biometric values. See
  // components/motion-lab and docs/RACQUET_MOTION_LAB.md.
  MOTION_LAB_OPENED: 'motion_lab_opened',
  MOTION_LAB_SPORT_SELECTED: 'motion_lab_sport_selected', // + sport
  MOTION_LAB_MOTION_SELECTED: 'motion_lab_motion_selected', // + sport, motion
  MOTION_LAB_ANALYSIS_STARTED: 'motion_lab_analysis_started', // + sport, motion, view, capture_mode
  MOTION_LAB_ANALYSIS_COMPLETED: 'motion_lab_analysis_completed', // + sport, motion, confidence_band
  MOTION_LAB_ANALYSIS_FAILED: 'motion_lab_analysis_failed', // + sport, motion
  MOTION_LAB_VIEW_MODE_CHANGED: 'motion_lab_view_mode_changed', // + mode (video | 3d)
  MOTION_LAB_OVERLAY_TOGGLED: 'motion_lab_overlay_toggled', // + layer, on
  MOTION_LAB_OVERLAY_DENSITY_CHANGED: 'motion_lab_overlay_density_changed', // + density (simple | coach | lab)
  MOTION_LAB_SLOWMO_USED: 'motion_lab_slowmo_used', // + speed
  MOTION_LAB_FRAME_STEPPED: 'motion_lab_frame_stepped',
  MOTION_LAB_PHASE_CLICKED: 'motion_lab_phase_clicked', // + phase
  MOTION_LAB_REPORT_EXPORTED: 'motion_lab_report_exported', // + format (json | csv | pdf)
  MOTION_LAB_SESSION_DELETED: 'motion_lab_session_deleted',
  MOTION_LAB_SAMPLE_VIEWED: 'motion_lab_sample_viewed', // + sport, motion

  // RecordAssist Vision (guided on-device self-recording). Props carry ONLY
  // non-private capture metadata: sport, action, view, readiness band, reason
  // codes, device tier. Never the video, landmarks, or biometric values. See
  // lib/record-assist and docs/RECORD_ASSIST.md.
  RECORD_ASSIST_STARTED: 'record_assist_started', // + sport, action
  CAMERA_PERMISSION_GRANTED: 'camera_permission_granted',
  CAMERA_PERMISSION_DENIED: 'camera_permission_denied',
  ATHLETE_DETECTED: 'athlete_detected', // + sport
  ATHLETE_NOT_DETECTED: 'athlete_not_detected', // + sport
  VOICE_GUIDANCE_PLAYED: 'voice_guidance_played', // + message_id, category
  READINESS_SCORE_CHANGED: 'readiness_score_changed', // + band, sport
  READINESS_SCORE_PASSED: 'readiness_score_passed', // + band, sport
  RECORDING_STARTED: 'recording_started', // + sport, action, band
  RECORDING_COMPLETED: 'recording_completed', // + sport, action, duration_s
  AUTO_TRIM_APPLIED: 'auto_trim_applied', // + before_s, after_s
  RETAKE_RECOMMENDED: 'retake_recommended', // + reasons
  RETAKE_ACCEPTED: 'retake_accepted',
  RETAKE_SKIPPED: 'retake_skipped',
  ANALYSIS_STARTED_AFTER_GUIDED_RECORDING: 'analysis_started_after_guided_recording', // + sport
  ANALYSIS_FAILED_DUE_TO_VIDEO_QUALITY: 'analysis_failed_due_to_video_quality', // + sport
  SPORT_PRESET_SELECTED: 'sport_preset_selected', // + sport
  ANGLE_PRESET_SELECTED: 'angle_preset_selected', // + sport, action, view
  MUTE_VOICE_ENABLED: 'mute_voice_enabled',
  ACCESSIBILITY_CAPTION_ENABLED: 'accessibility_caption_enabled',
  UNSUPPORTED_BROWSER_DETECTED: 'unsupported_browser_detected', // + reason
  DEVICE_COMPATIBILITY_WARNING_SHOWN: 'device_compatibility_warning_shown', // + tier
  SAVED_ANGLE_PRESET_CREATED: 'saved_angle_preset_created', // + sport, action
  RETEST_SAME_ANGLE_STARTED: 'retest_same_angle_started', // + sport, action
  // Phase 3 — advanced biomechanics review surfaces.
  MOTION_INSIGHTS_COMPUTED: 'motion_insights_computed', // + sport, action, confidence, tracked_frames
  FRAME_STEP_USED: 'frame_step_used', // + sport, action
  CLIP_COMPARISON_VIEWED: 'clip_comparison_viewed', // + sport, action
  CAMERA_SHAKE_PROXY_ENABLED: 'camera_shake_proxy_enabled', // + sport
  // Deterministic Diagnosis Engine (token-free symptom→cause). Props carry only
  // non-PII engine metadata: sport, skill_level, diagnosis (fault id),
  // confidence_score (0–100), confidence_label, rule_count_triggered,
  // missing_data_count, escalation_recommended, engine_version. The escalation
  // events also carry the lead `reason`. Emitted at the UI call site, never from
  // the pure engine. See lib/intelligence/analytics.ts + diagnose.ts.
  DETERMINISTIC_ANALYSIS_COMPLETED: 'deterministic_analysis_completed',
  DETERMINISTIC_AI_ESCALATION_RECOMMENDED: 'deterministic_ai_escalation_recommended',
  DETERMINISTIC_AI_ESCALATION_SKIPPED: 'deterministic_ai_escalation_skipped',
  // A deterministic practice plan was generated/shown. + sport, diagnosis,
  // skill_level, drill_count, estimated_minutes.
  DETERMINISTIC_PLAN_GENERATED: 'deterministic_plan_generated',
  // The athlete rated a deterministic read. + sport, diagnosis, helpful.
  DETERMINISTIC_USER_FEEDBACK_SUBMITTED: 'deterministic_user_feedback_submitted',
  // A retest verdict on a prior deterministic diagnosis (improved → confirmed,
  // regressed → rejected). + sport, diagnosis, outcome.
  DETERMINISTIC_DIAGNOSIS_CONFIRMED: 'deterministic_diagnosis_confirmed',
  DETERMINISTIC_DIAGNOSIS_REJECTED: 'deterministic_diagnosis_rejected',

  // Authority / education / trust content (SEO·AEO·GEO surfaces). Non-PII —
  // a `slug` (page path) and optional `category`/`target` only. Power the
  // "does our authority content earn trust + convert?" funnel. See the
  // /deterministic-intelligence, /resources, /trust authority pages.
  AUTHORITY_PAGE_VIEWED: 'authority_page_viewed', // + slug, category
  RESOURCE_ARTICLE_VIEWED: 'resource_article_viewed', // + slug, category
  GLOSSARY_ENTRY_VIEWED: 'glossary_entry_viewed', // + term
  TRUST_PAGE_VIEWED: 'trust_page_viewed', // + slug
  METHODOLOGY_PAGE_VIEWED: 'methodology_page_viewed',
  AUTHORITY_CTA_CLICKED: 'authority_cta_clicked', // + slug, target (start | trust)
  RESOURCE_INTERNAL_LINK_CLICKED: 'resource_internal_link_clicked', // + from, to
  FAQ_EXPANDED: 'faq_expanded', // + slug, question
  CLAIM_EXPLAINER_OPENED: 'claim_explainer_opened', // + claim_id
  DETERMINISTIC_ENGINE_LEARN_MORE_CLICKED: 'deterministic_engine_learn_more_clicked', // + from
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
}
