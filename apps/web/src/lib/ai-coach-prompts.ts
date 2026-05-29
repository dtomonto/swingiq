/**
 * SwingIQ AI Coach — Structured Prompt Builder
 *
 * Separates deterministic data analysis (done in @swingiq/core) from
 * AI narrative generation. The AI receives a pre-built structured context
 * block so it has no reason to fabricate launch-monitor numbers.
 *
 * Security: Never include Supabase keys, user PII beyond first name,
 * or raw session IDs in prompts sent to external AI APIs.
 */

import type { SessionStats } from '@swingiq/core';

// ── Types ─────────────────────────────────────────────────────

export interface CoachContext {
  /** Golfer's first name only — for personalizing the response */
  golfer_first_name?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  typical_miss?: string;
  /** Most recent session stats — already computed by the diagnostic engine */
  current_session_stats?: Partial<SessionStats>;
  /** Primary diagnosis ID from the engine */
  primary_diagnosis_id?: string;
  primary_diagnosis_name?: string;
  primary_diagnosis_confidence?: number;
  /** Human-readable summary of what the engine found */
  engine_summary?: string;
  /** The specific question the golfer is asking */
  user_question: string;
}

// ── System Prompt ─────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are SwingIQ AI Coach — a golf improvement assistant that helps golfers understand their launch-monitor data.

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

// ── Context Block Builder ─────────────────────────────────────

export function buildContextBlock(ctx: CoachContext): string {
  const lines: string[] = ['[DATA CONTEXT]'];

  if (ctx.golfer_first_name) {
    lines.push(`Golfer: ${ctx.golfer_first_name}`);
  }
  if (ctx.skill_level) {
    lines.push(`Skill level: ${ctx.skill_level}`);
  }
  if (ctx.typical_miss) {
    lines.push(`Typical miss: ${ctx.typical_miss}`);
  }

  if (ctx.current_session_stats && Object.keys(ctx.current_session_stats).length > 0) {
    lines.push('');
    lines.push('Most recent session averages:');
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
  } else {
    lines.push('');
    lines.push('No session data loaded. Ask the golfer to import data first.');
  }

  if (ctx.primary_diagnosis_name) {
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

  lines.push('[END DATA CONTEXT]');
  return lines.join('\n');
}

// ── Full Prompt Assembly ──────────────────────────────────────

export function buildCoachPrompt(ctx: CoachContext): { system: string; user: string } {
  const contextBlock = buildContextBlock(ctx);
  return {
    system: SYSTEM_PROMPT,
    user: `${contextBlock}\n\nGolfer question: ${ctx.user_question}`,
  };
}

// ── Guardrails ────────────────────────────────────────────────

/**
 * Validates a user question before sending to AI.
 * Returns an error string if the question should be blocked, or null if safe.
 */
export function validateUserQuestion(question: string): string | null {
  const trimmed = question.trim();

  if (!trimmed) return 'Please type a question.';
  if (trimmed.length > 1000) return 'Please keep your question under 1000 characters.';

  // Rudimentary off-topic guardrails
  const offTopicPatterns = [
    /\b(invest|stock|crypto|money|financial|tax)\b/i,
    /\b(medical|doctor|diagnos(e|is)|symptom|pain|injur(y|ies))\b/i,
    /\b(password|login|hack|bypass|exploit)\b/i,
  ];
  for (const pattern of offTopicPatterns) {
    if (pattern.test(trimmed)) {
      return 'I can only help with golf swing and launch-monitor questions. Please ask something about your game.';
    }
  }

  return null;
}
