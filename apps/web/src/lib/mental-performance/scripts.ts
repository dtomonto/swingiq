// ============================================================
// SwingVantage — Mental Performance: guided-routine script generation (pure)
//
// Phase-4 groundwork, built keyless. Turns a routine's data into a timed,
// narrated meditation script and a Video Studio brief — the deterministic
// inputs the existing TTS / Video Studio pipeline renders into real audio/
// video. No AI required; no media is produced here.
// ============================================================

import type { MentalRoutine, MentalSport } from './types';

export interface ScriptLine {
  /** Seconds from the start of the audio. */
  at: number;
  text: string;
}

export interface MeditationScript {
  routineId: string;
  title: string;
  /** Total narrated length (≥ the routine's own duration). */
  durationSeconds: number;
  intro: string;
  lines: ScriptLine[];
  close: string;
  /** Full narration text (intro + lines + close), for TTS + word counting. */
  voiceover: string;
  wordCount: number;
}

const endStop = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/**
 * Build a timed, calmly-narrated script for a routine. The breath cue lands
 * early; each step is spread across the routine's duration; a warm close
 * carries the self-talk cue forward.
 */
export function generateMeditationScript(routine: MentalRoutine): MeditationScript {
  const intro = `Let's run the ${routine.title.toLowerCase()}. ${endStop(routine.goal)} Settle into a tall, easy posture, and we'll begin.`;
  const close = `That's your reset. ${endStop(routine.selfTalkCue)} Carry that into the next moment.`;

  // Total span: at least the routine duration, with headroom for intro + close.
  const span = Math.max(routine.durationSeconds, routine.steps.length * 4 + 8);
  const startAt = 5;
  const gap = (span - startAt - 4) / Math.max(routine.steps.length, 1);

  const lines: ScriptLine[] = [
    { at: 2, text: `Breathe with me. ${endStop(routine.breathPattern)}` },
    ...routine.steps.map((s, i) => ({ at: Math.round(startAt + i * gap), text: endStop(s) })),
  ];

  const voiceover = [intro, ...lines.map((l) => l.text), close].join(' ');
  return {
    routineId: routine.id,
    title: routine.title,
    durationSeconds: span,
    intro,
    lines,
    close,
    voiceover,
    wordCount: voiceover.split(/\s+/).filter(Boolean).length,
  };
}

export interface RoutineVideoBrief {
  routineId: string;
  title: string;
  sports: MentalSport[];
  durationSeconds: number;
  /** Full narration text for TTS. */
  voiceoverScript: string;
  /** Short on-screen captions, one per step. */
  onScreenText: string[];
  /** Suggested calm, non-distracting b-roll. */
  bRoll: string[];
  /** Always draft — admin approves before the Video Studio renders it. */
  status: 'draft';
}

/**
 * Map a routine to a Video Studio brief (the seam the existing video pipeline
 * consumes). Deterministic + keyless; rendering happens downstream.
 */
export function generateRoutineVideoBrief(routine: MentalRoutine): RoutineVideoBrief {
  const script = generateMeditationScript(routine);
  return {
    routineId: routine.id,
    title: `${routine.title} — guided reset`,
    sports: routine.sports,
    durationSeconds: script.durationSeconds,
    voiceoverScript: script.voiceover,
    onScreenText: routine.steps.map((s, i) => `${i + 1}. ${s}`),
    bRoll: [
      'Slow breathing animation (inhale/exhale ring)',
      'Calm, out-of-focus sport setting',
      `On-screen cue: "${routine.selfTalkCue}"`,
    ],
    status: 'draft',
  };
}
