// ============================================================
// SwingVantage — Coach model tiering (recommendation #4)
// ------------------------------------------------------------
// Routes each coach request to a model tier by difficulty. Routine, high-
// confidence questions stay on the cheap `fast` tier; genuinely harder ones
// (a low-confidence diagnosis the model must reason carefully about, or a long
// multi-part question) escalate to `balanced` for better reasoning. Cost-
// conscious by design: escalate the few hard cases, not the common ones.
// Pure + keyless — just picks a tier the gateway already supports.
// ============================================================

import type { CoachContext } from '../ai-coach-prompts';
import type { ModelTier } from '../ai/gateway';

/** Below this engine confidence (0–100), the diagnosis is shaky → reason harder. */
export const LOW_DIAGNOSIS_CONFIDENCE = 50;
/** Below this video-derived confidence (0–1), escalate. */
export const LOW_VIDEO_CONFIDENCE = 0.5;
/** Questions at/above this length read as complex/multi-part. */
export const COMPLEX_QUESTION_CHARS = 200;

/** Pick the model tier for a coach request based on how hard it is. */
export function selectCoachTier(ctx: CoachContext): ModelTier {
  const dc = ctx.primary_diagnosis_confidence;
  if (typeof dc === 'number' && dc < LOW_DIAGNOSIS_CONFIDENCE) return 'balanced';

  const vc = ctx.primary_video_issue_confidence;
  if (typeof vc === 'number' && vc < LOW_VIDEO_CONFIDENCE) return 'balanced';

  const q = (ctx.user_question ?? '').trim();
  const questionMarks = (q.match(/\?/g) ?? []).length;
  if (q.length >= COMPLEX_QUESTION_CHARS || questionMarks >= 2) return 'balanced';

  return 'fast';
}
