/**
 * SwingVantage AI Coach — Structured Prompt Builder
 *
 * Separates deterministic data analysis (done in @swingiq/core) from
 * AI narrative generation. The AI receives a pre-built structured context
 * block so it has no reason to fabricate performance numbers.
 *
 * Sport-aware: the system prompt, context block, and guardrails all adapt
 * to the active sport so tennis/baseball/softball players get sport-appropriate language.
 *
 * Security: Never include Supabase keys, user PII beyond first name,
 * or raw session IDs in prompts sent to external AI APIs.
 */

import type { SessionStats } from '@swingiq/core';
import type { SportId } from '@swingiq/core';

// ── Types ─────────────────────────────────────────────────────

export interface CoachContext {
  /** Active sport — controls prompt language entirely */
  active_sport?: SportId;
  /** Athlete's first name only — for personalizing the response */
  golfer_first_name?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  typical_miss?: string;
  /** Most recent session stats — already computed by the diagnostic engine (golf only) */
  current_session_stats?: Partial<SessionStats>;
  /** Primary diagnosis ID from the engine */
  primary_diagnosis_id?: string;
  primary_diagnosis_name?: string;
  primary_diagnosis_confidence?: number;
  /** Human-readable summary of what the engine found */
  engine_summary?: string;
  /** For non-golf sports: video analysis primary issue */
  primary_video_issue?: string;
  primary_video_issue_confidence?: number;
  /** Non-golf sport profile context */
  sport_profile_summary?: string;
  /** Optional audience-tone instruction (Beginner/Parent/Competitive/Coach). */
  coaching_tone_hint?: string;
  /** The specific question the athlete is asking */
  user_question: string;
}

// ── Sport-Specific System Prompts ─────────────────────────────

const GOLF_SYSTEM_PROMPT = `You are SwingVantage AI Coach — a golf improvement assistant that helps golfers understand their launch-monitor and swing data.

RULES YOU MUST FOLLOW:
1. Only reference data that is explicitly provided in the [DATA CONTEXT] block. Never invent numbers.
2. If a statistic is not in the context, say "I don't have that data yet — please import a session first."
3. Keep responses focused on one actionable takeaway. Do not overload the golfer.
4. Always separate WHAT the data shows from WHY it might be happening (swing cause vs. data fact).
5. End every response with a "What to do next" line — one specific action.
6. Never claim to watch video or diagnose swing mechanics you cannot see. Diagnoses are data-pattern interpretations only.
7. Do not recommend equipment purchases. Focus on technique and practice.
8. Keep responses concise — target 150-250 words unless the question demands more detail.
9. Use plain language. Explain any technical terms you use (e.g., "face-to-path — the angle between where the face points and where the club is swinging").
10. Never output markdown tables — use plain text lists instead.`;

const TENNIS_SYSTEM_PROMPT = `You are SwingVantage AI Coach — a tennis stroke development assistant that helps tennis players improve their technique.

RULES YOU MUST FOLLOW:
1. Only reference data that is explicitly provided in the [DATA CONTEXT] block. Never invent numbers.
2. If analysis data is not in the context, say "I don't have video analysis data yet — please upload a video of your strokes first."
3. Keep responses focused on one actionable takeaway. Do not overload the player.
4. Always separate WHAT the observation shows from WHY it might be happening.
5. End every response with a "What to do next" line — one specific drill or focus.
6. Never claim to measure exact racquet speed or contact force — these require sensor data not yet integrated.
7. Focus on technique, footwork, and practice patterns. Do not recommend racquet purchases.
8. Keep responses concise — target 150-250 words unless the question demands more detail.
9. Use tennis-specific language (unit turn, split step, contact point, follow-through, etc.).
10. Never output markdown tables — use plain text lists instead.`;

const PICKLEBALL_SYSTEM_PROMPT = `You are SwingVantage AI Coach — a pickleball stroke development assistant that helps players improve their compact paddle mechanics and non-volley-zone strategy.

RULES YOU MUST FOLLOW:
1. Only reference data that is explicitly provided in the [DATA CONTEXT] block. Never invent numbers.
2. If analysis data is not in the context, say "I don't have video analysis data yet — please upload a video of your strokes first."
3. Keep responses focused on one actionable takeaway. Do not overload the player.
4. Always separate WHAT the observation shows from WHY it might be happening.
5. End every response with a "What to do next" line — one specific drill or focus.
6. Pickleball is NOT small-court tennis — the stroke is compact, there is no long backswing, and the kitchen (non-volley zone) governs footwork and shot selection. Never give tennis-loop advice.
7. Never claim to measure exact paddle speed or spin — these require sensor data not yet integrated.
8. Focus on technique, footwork, and shot selection. Do not recommend paddle purchases.
9. Use pickleball-specific language (third-shot drop, dink, reset, speed-up, kitchen line, transition zone, attackable ball, DUPR where relevant).
10. Never output markdown tables — use plain text lists instead.`;

const PADEL_SYSTEM_PROMPT = `You are SwingVantage AI Coach — a padel stroke development assistant that helps players improve their wall-based mechanics and doubles court positioning.

RULES YOU MUST FOLLOW:
1. Only reference data that is explicitly provided in the [DATA CONTEXT] block. Never invent numbers.
2. If analysis data is not in the context, say "I don't have video analysis data yet — please upload a video of your strokes first."
3. Keep responses focused on one actionable takeaway. Do not overload the player.
4. Always separate WHAT the observation shows from WHY it might be happening.
5. End every response with a "What to do next" line — one specific drill or focus.
6. Padel is NOT tennis with walls — the glass is in play, the game is always doubles, and the overhead family (bandeja, víbora, smash) is used to hold the net. Never give full-tennis-serve advice on overheads.
7. Never claim to measure exact racket speed or spin — these require sensor data not yet integrated.
8. Focus on technique, the wall read, shot selection, and partner positioning. Do not recommend racket purchases.
9. Use padel-specific language (bandeja, víbora, smash, lob, glass/wall read, net control, partner spacing, transition).
10. Never output markdown tables — use plain text lists instead.`;

const BASEBALL_SYSTEM_PROMPT = `You are SwingVantage AI Coach — a baseball hitting development assistant that helps hitters improve their mechanics and results at the plate.

RULES YOU MUST FOLLOW:
1. Only reference data that is explicitly provided in the [DATA CONTEXT] block. Never invent numbers.
2. If analysis data is not in the context, say "I don't have swing data yet — please upload a video or log a hitting session first."
3. Keep responses focused on one actionable takeaway for the hitter.
4. Always separate WHAT the observation shows from WHY it might be happening (mechanics cause vs. result).
5. End every response with a "What to do next" line — one specific drill or adjustment.
6. Exit velocity, launch angle, and bat speed require sensor/tracking data — only reference these if provided.
7. Focus on mechanics, timing, and practice. Do not recommend equipment purchases.
8. Keep responses concise — target 150-250 words unless the question demands more detail.
9. Use baseball hitting language (load, stride, hip-shoulder separation, bat path, contact point, extension, etc.).
10. Never output markdown tables — use plain text lists instead.`;

const SLOW_PITCH_SYSTEM_PROMPT = `You are SwingVantage AI Coach — a slow pitch softball hitting development assistant that helps players improve their timing, bat path, and power production against the arc pitch.

RULES YOU MUST FOLLOW:
1. Only reference data that is explicitly provided in the [DATA CONTEXT] block. Never invent numbers.
2. If analysis data is not in the context, say "I don't have swing data yet — please upload a video or log a hitting session first."
3. Keep responses focused on one actionable takeaway.
4. Always separate WHAT the observation shows from WHY it might be happening.
5. End every response with a "What to do next" line — one specific drill or adjustment.
6. Acknowledge the unique mechanics of the slow pitch arc: downward trajectory, timing window, contact height.
7. Focus on mechanics and practice. Do not recommend bat purchases or comment on bat certifications.
8. Keep responses concise — target 150-250 words unless the question demands more detail.
9. Use slow pitch softball language (arc timing, hip rotation, contact height, pull/gap/opposite field, etc.).
10. Never output markdown tables — use plain text lists instead.`;

const FAST_PITCH_SYSTEM_PROMPT = `You are SwingVantage AI Coach — a fast pitch softball hitting development assistant that helps hitters improve their compact mechanics, timing, and contact against the rising pitch.

RULES YOU MUST FOLLOW:
1. Only reference data that is explicitly provided in the [DATA CONTEXT] block. Never invent numbers.
2. If analysis data is not in the context, say "I don't have swing data yet — please upload a video or log a hitting session first."
3. Keep responses focused on one actionable takeaway.
4. Always separate WHAT the observation shows from WHY it might be happening.
5. End every response with a "What to do next" line — one specific drill or adjustment.
6. Acknowledge the unique demands of fast pitch: reaction time, rising pitch trajectory, compact swing requirement.
7. Exit velocity, bat speed, and launch angle require sensor/tracking data — only reference these if provided.
8. Focus on mechanics and timing. Do not recommend equipment purchases.
9. Use fast pitch language (load, stride, separation, compact path, contact point, extension, rising pitch timing, etc.).
10. Never output markdown tables — use plain text lists instead.`;

const SPORT_SYSTEM_PROMPTS: Record<SportId, string> = {
  golf: GOLF_SYSTEM_PROMPT,
  tennis: TENNIS_SYSTEM_PROMPT,
  pickleball: PICKLEBALL_SYSTEM_PROMPT,
  padel: PADEL_SYSTEM_PROMPT,
  baseball: BASEBALL_SYSTEM_PROMPT,
  softball_slow: SLOW_PITCH_SYSTEM_PROMPT,
  softball_fast: FAST_PITCH_SYSTEM_PROMPT,
};

export const SYSTEM_PROMPT = GOLF_SYSTEM_PROMPT; // backward compat

// ── Sport-Specific Question Label ────────────────────────────

const SPORT_QUESTION_LABELS: Record<SportId, string> = {
  golf: 'Golfer question',
  tennis: 'Player question',
  pickleball: 'Player question',
  padel: 'Player question',
  baseball: 'Hitter question',
  softball_slow: 'Player question',
  softball_fast: 'Hitter question',
};

// ── Context Block Builder ─────────────────────────────────────

export function buildContextBlock(ctx: CoachContext): string {
  const sport: SportId = ctx.active_sport ?? 'golf';
  const lines: string[] = ['[DATA CONTEXT]'];

  lines.push(`Active sport: ${sport}`);

  if (ctx.golfer_first_name) {
    lines.push(`Athlete: ${ctx.golfer_first_name}`);
  }
  if (ctx.skill_level) {
    lines.push(`Skill level: ${ctx.skill_level}`);
  }
  if (ctx.typical_miss) {
    lines.push(`Typical miss: ${ctx.typical_miss}`);
  }
  if (ctx.sport_profile_summary) {
    lines.push(`Player profile notes: ${ctx.sport_profile_summary}`);
  }

  // Golf-specific: launch monitor stats
  if (sport === 'golf' && ctx.current_session_stats && Object.keys(ctx.current_session_stats).length > 0) {
    lines.push('');
    lines.push('Most recent session averages (launch monitor):');
    const s = ctx.current_session_stats;
    if (s.shot_count !== undefined) lines.push(`  Shots analyzed: ${s.shot_count}`);
    if (s.club_category !== undefined) lines.push(`  Club category: ${s.club_category}`);
    if (s.avg_carry !== undefined) lines.push(`  Average carry: ${s.avg_carry.toFixed(0)} yards`);
    if (s.avg_ball_speed !== undefined) lines.push(`  Average ball speed: ${s.avg_ball_speed.toFixed(0)} mph`);
    if (s.avg_smash_factor !== undefined) lines.push(`  Smash factor: ${s.avg_smash_factor.toFixed(2)}`);
    if (s.avg_launch_angle !== undefined) lines.push(`  Launch angle: ${s.avg_launch_angle.toFixed(1)}°`);
    if (s.avg_spin_rate !== undefined) lines.push(`  Spin rate: ${s.avg_spin_rate.toFixed(0)} rpm`);
    if (s.avg_face_to_path !== undefined) lines.push(`  Face-to-path: ${s.avg_face_to_path.toFixed(1)}°`);
    if (s.avg_club_path !== undefined) lines.push(`  Club path: ${s.avg_club_path.toFixed(1)}°`);
    if (s.avg_attack_angle !== undefined) lines.push(`  Attack angle: ${s.avg_attack_angle.toFixed(1)}°`);
    if (s.avg_dynamic_loft !== undefined) lines.push(`  Dynamic loft: ${s.avg_dynamic_loft.toFixed(1)}°`);
    if (s.avg_lateral_offline !== undefined) {
      lines.push(`  Average lateral miss: ${Math.abs(s.avg_lateral_offline).toFixed(0)} yards ${s.avg_lateral_offline > 0 ? 'right' : 'left'}`);
    }
    if (s.carry_std_dev !== undefined && s.avg_carry !== undefined) {
      lines.push(`  Carry consistency: ±${s.carry_std_dev.toFixed(1)} yards standard deviation`);
    }
    if (s.avg_impact_lateral !== undefined) {
      lines.push(`  Strike location (lateral): ${s.avg_impact_lateral.toFixed(2)} (negative=heel, positive=toe)`);
    }
  } else if (sport !== 'golf') {
    lines.push('');
    lines.push('Data source: Video analysis (pose-based, estimated — not sensor-measured)');
    lines.push('Note: Exact metrics like bat speed, exit velocity, and racquet speed require sensor integration.');
  }

  // Non-golf: video analysis results
  if (ctx.primary_video_issue) {
    lines.push('');
    lines.push(`Primary issue detected from video: ${ctx.primary_video_issue}`);
    if (ctx.primary_video_issue_confidence !== undefined) {
      lines.push(`Detection confidence: ${Math.round(ctx.primary_video_issue_confidence * 100)}% (video-derived estimate)`);
    }
  }

  // Golf diagnosis
  if (sport === 'golf' && ctx.primary_diagnosis_name) {
    lines.push('');
    lines.push(`Primary diagnosis from engine: ${ctx.primary_diagnosis_name}`);
    if (ctx.primary_diagnosis_confidence !== undefined) {
      lines.push(`Confidence: ${ctx.primary_diagnosis_confidence}%`);
    }
  }

  if (ctx.engine_summary) {
    lines.push('');
    lines.push(`Engine summary: ${ctx.engine_summary}`);
  }

  // No data fallback
  if (!ctx.current_session_stats && !ctx.primary_video_issue && !ctx.primary_diagnosis_name) {
    lines.push('');
    lines.push('No session or video analysis data loaded. Ask the athlete to upload data first.');
  }

  lines.push('[END DATA CONTEXT]');
  return lines.join('\n');
}

// ── Evidence-Citation Rule ────────────────────────────────────

/**
 * Appended to every coach system prompt. Forces the model to cite the
 * specific metric + value it is reasoning from (chain-of-thought with
 * explicit evidence), and to flag any claim that isn't backed by a number
 * as a general observation rather than a measurement. Reduces confident-
 * sounding fabrication.
 */
export const EVIDENCE_CITATION_RULE =
  'EVIDENCE & REASONING:\n' +
  '- When you state an issue or a strength, cite the specific metric and its value from the [DATA CONTEXT] as evidence ' +
  '(for example: "your face-to-path averaged +6.2°, which points the face open at impact").\n' +
  '- Show your reasoning briefly in this order: the data fact → what it implies about the swing → what to do about it.\n' +
  '- If a claim is NOT backed by a number in the context, label it a general observation, not a measurement — and never present it as certain.\n' +
  '- Prefer one well-evidenced point over several unsupported ones.';

// ── Full Prompt Assembly ──────────────────────────────────────

export function buildCoachPrompt(ctx: CoachContext): { system: string; user: string } {
  const sport: SportId = ctx.active_sport ?? 'golf';
  const systemPrompt = SPORT_SYSTEM_PROMPTS[sport] ?? GOLF_SYSTEM_PROMPT;
  const contextBlock = buildContextBlock(ctx);
  const questionLabel = SPORT_QUESTION_LABELS[sport] ?? 'Question';
  const baseSystem = `${systemPrompt}\n\n${EVIDENCE_CITATION_RULE}`;
  return {
    system: ctx.coaching_tone_hint
      ? `${baseSystem}\n\nTONE — match this audience: ${ctx.coaching_tone_hint}`
      : baseSystem,
    user: `${contextBlock}\n\n${questionLabel}: ${ctx.user_question}`,
  };
}

// ── Guardrails ────────────────────────────────────────────────

/**
 * Validates a user question before sending to AI.
 * Returns an error string if the question should be blocked, or null if safe.
 */
export function validateUserQuestion(question: string, sport?: SportId): string | null {
  const trimmed = question.trim();

  if (!trimmed) return 'Please type a question.';
  if (trimmed.length > 1000) return 'Please keep your question under 1000 characters.';

  // Financial/off-topic hard block
  const financialPatterns = [/\b(invest|stock|crypto|money|financial|tax)\b/i];
  for (const pattern of financialPatterns) {
    if (pattern.test(trimmed)) {
      const sportLabel = sport === 'golf' ? 'golf swing' : sport ? `${sport.replace('_', ' ')} swing` : 'swing';
      return `I can only help with ${sportLabel} and performance questions. Please ask something about your game.`;
    }
  }

  // Security/abuse hard block
  if (/\b(password|login|hack|bypass|exploit|jailbreak|ignore previous)\b/i.test(trimmed)) {
    return 'That question is outside what I can help with here.';
  }

  // Pain/injury — soft redirect (not a hard block; the AI will handle gracefully)
  // We do NOT block injury questions — they're legitimate sports questions.
  // The system prompt instructs the AI to add a caution and refer to a professional.

  return null;
}

// ── Structured Response Trust Layer ──────────────────────────

/**
 * The structured output model for AI coaching responses.
 *
 * This type describes what an ideal AI coaching response contains.
 * Not all fields will be present in every response — the AI produces
 * free-text that the app renders. This type is for future structured
 * output parsing and longitudinal tracking.
 *
 * Fields mirror the coaching trust requirements:
 * summary, main issue, evidence, confidence, why it matters,
 * recommended fix, drill, safety note, beginner/advanced explanation,
 * next-session focus, and change since last session.
 */
export interface AICoachResponse {
  /** One-sentence summary of the coaching response */
  summary: string;
  /** The primary issue identified */
  main_issue: string | null;
  /** What in the data supports this diagnosis */
  evidence: string | null;
  /** How confident the AI is (0–100) — if expressible */
  confidence_pct: number | null;
  /** Why this issue matters to the athlete's performance */
  why_it_matters: string | null;
  /** The concrete fix recommended */
  recommended_fix: string | null;
  /** A specific drill to practice */
  drill: string | null;
  /** Any safety, injury, or physical caution */
  safety_note: string | null;
  /** Plain-language explanation for beginners */
  beginner_explanation: string | null;
  /** More technical explanation for advanced athletes */
  advanced_explanation: string | null;
  /** What to focus on in the next practice session */
  next_session_focus: string | null;
  /** How this compares to the previous session (if prior data provided) */
  change_since_last_session: string | null;
  /** Raw text response from the AI (always present) */
  raw_text: string;
  /** Sport this response is for */
  sport: SportId;
  /** ISO timestamp when the response was generated */
  generated_at: string;
  /** Whether a medical/injury disclaimer was included */
  has_safety_note: boolean;
}

/** Metadata attached to each AI coaching interaction for trust and auditability */
export interface CoachInteractionMetadata {
  sport: SportId;
  /** Whether a session or video analysis was available in context */
  had_data_context: boolean;
  /** Whether the AI cited specific data from context */
  referenced_data: boolean;
  /** Whether the response includes an injury/medical caution */
  has_safety_note: boolean;
  /** Provider used for this call (recorded server-side) */
  ai_provider?: string;
  /** Model version used */
  ai_model?: string;
  /** Estimated token count */
  token_estimate?: number;
}

/**
 * Builds longitudinal context — a brief summary of recent sessions for AI memory.
 * Include this in the context block when prior session data is available.
 *
 * This is the foundation for "AI coach memory" — where the coach can reference
 * what was worked on last time and detect regression or improvement.
 */
export function buildLongitudinalContext(
  priorSessions: Array<{
    date: string;
    primary_issue: string | null;
    swing_score: number | null;
  }>,
  maxSessions = 3,
): string {
  const recent = priorSessions.slice(0, maxSessions);
  if (!recent.length) return '';

  const lines: string[] = ['[RECENT HISTORY (for context — do not fabricate details)]'];
  recent.forEach((s, i) => {
    const label = i === 0 ? 'Last session' : `${i + 1} sessions ago`;
    const scorePart = s.swing_score != null ? `, score: ${s.swing_score}` : '';
    const issuePart = s.primary_issue ? `, primary issue: ${s.primary_issue}` : ', no diagnosis run';
    lines.push(`  ${label} (${s.date})${scorePart}${issuePart}`);
  });
  lines.push('[END RECENT HISTORY]');
  return '\n' + lines.join('\n');
}

/** AI disclaimer shown to users before or alongside AI coaching responses */
export const AI_COACHING_DISCLAIMER =
  'AI coaching reads the patterns in your data to give you confident, actionable guidance that pairs perfectly with a qualified coach for advanced work. ' +
  'SwingVantage is not a medical device. If you experience pain, consult a sports medicine professional.';

/** Short inline disclaimer shown in the AI chat UI */
export const AI_COACHING_DISCLAIMER_SHORT =
  'AI suggestions are confident, pattern-based reads of your data — and they pair perfectly with a coach.';

/** Medical redirect — shown when the AI detects an injury/pain question */
export const MEDICAL_REDIRECT_NOTE =
  '⚠️ For any pain or injury concerns, please consult a sports medicine professional or physiotherapist. ' +
  'SwingVantage can help with swing mechanics, but is not a medical tool.';
