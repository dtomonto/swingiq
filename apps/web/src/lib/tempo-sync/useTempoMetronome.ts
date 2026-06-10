'use client';

// ============================================================
// SwingVantage — Tempo Sync: Web Audio metronome hook
// ------------------------------------------------------------
// Drives the trainer's sound + smooth visual progress. Uses a classic
// lookahead scheduler (a coarse JS timer that schedules precise Web Audio
// events a little ahead of time) so the cues stay rock-steady even when
// the main thread is busy — a plain setInterval(beep) drifts audibly.
//
// Entirely client-side and keyless: the AudioContext is created lazily on
// the user's first Start (a gesture browsers require), nothing is recorded
// or sent anywhere. Falls back to a silent (visual-only) trainer if the
// browser has no Web Audio.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TempoBeat, TempoBeatKind, TempoTiming } from './types';

export interface TempoMetronomeState {
  isPlaying: boolean;
  /** Reps completed since Start. */
  rep: number;
  /** Smooth 0..1 progress through the current rep; -1 while resting / counting in. */
  progress: number;
  /** Most-recent cue that fired, for a quick UI flash (cleared shortly after). */
  lastBeat: TempoBeatKind | null;
  /** True once a count-in is running, before the first real rep. */
  countingIn: boolean;
  audioSupported: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

interface Config {
  timing: TempoTiming;
  beats: TempoBeat[];
  restMs: number;
  soundEnabled: boolean;
  countIn: boolean;
}

const LOOKAHEAD_S = 0.2; // schedule this far ahead of the audio clock
const TIMER_MS = 25; // how often the scheduler wakes
const COUNT_IN_TICKS = 3;
const COUNT_IN_GAP_S = 0.5;

// Distinct, pleasant tones so the three cues are easy to tell apart by ear.
const TONE: Record<TempoBeatKind, { freq: number; durMs: number; gain: number }> = {
  takeaway: { freq: 660, durMs: 70, gain: 0.18 },
  top: { freq: 880, durMs: 70, gain: 0.18 },
  impact: { freq: 1320, durMs: 110, gain: 0.26 },
};

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null;
}

function scheduleClick(ctx: AudioContext, at: number, freq: number, durMs: number, gain: number) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const dur = durMs / 1000;
  // Quick attack + exponential release = a clean "tick", not a buzz.
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(env).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function useTempoMetronome(config: Config): TempoMetronomeState {
  const [isPlaying, setPlaying] = useState(false);
  const [rep, setRep] = useState(0);
  const [progress, setProgress] = useState(-1);
  const [lastBeat, setLastBeat] = useState<TempoBeatKind | null>(null);
  const [countingIn, setCountingIn] = useState(false);

  // Latest config, mirrored into a ref so the scheduler/visual loops always
  // read live values without being torn down and rebuilt on every prop change.
  const cfgRef = useRef(config);
  useEffect(() => {
    cfgRef.current = config;
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Audio-clock bookkeeping.
  const scheduledUntilRef = useRef(0); // next cycle's takeaway time
  const cyclesRef = useRef<{ start: number; total: number }[]>([]);
  const pendingBeatsRef = useRef<{ at: number; kind: TempoBeatKind }[]>([]);
  const repsDoneRef = useRef(0);
  const flashUntilRef = useRef(0);
  // Tracks whether the very first takeaway has passed (count-in vs rep 1).
  const countInDoneRef = useRef(false);

  const audioSupported = getAudioContextCtor() != null;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cyclesRef.current = [];
    pendingBeatsRef.current = [];
    setPlaying(false);
    setCountingIn(false);
    setProgress(-1);
    setLastBeat(null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getAudioContextCtor();
    // Lazily build (and resume) the context on this user gesture.
    if (Ctor) {
      if (!ctxRef.current) ctxRef.current = new Ctor();
      void ctxRef.current.resume();
    }
    const ctx = ctxRef.current;
    const now = ctx ? ctx.currentTime : performance.now() / 1000;

    repsDoneRef.current = 0;
    cyclesRef.current = [];
    pendingBeatsRef.current = [];
    setRep(0);

    // Optional count-in: a few evenly spaced ticks before the first takeaway.
    let firstStart = now + 0.12;
    if (cfgRef.current.countIn) {
      setCountingIn(true);
      for (let i = 0; i < COUNT_IN_TICKS; i++) {
        const at = now + 0.12 + i * COUNT_IN_GAP_S;
        if (ctx && cfgRef.current.soundEnabled) {
          scheduleClick(ctx, at, TONE.takeaway.freq, 55, 0.12);
        }
      }
      firstStart = now + 0.12 + COUNT_IN_TICKS * COUNT_IN_GAP_S;
    }
    scheduledUntilRef.current = firstStart;
    setPlaying(true);

    // ── Lookahead scheduler ──────────────────────────────────
    const tick = () => {
      const audio = ctxRef.current;
      const clock = audio ? audio.currentTime : performance.now() / 1000;
      const horizon = clock + LOOKAHEAD_S;
      const { timing, beats, restMs, soundEnabled } = cfgRef.current;
      const totalS = timing.totalMs / 1000;
      const cycleS = totalS + Math.max(0, restMs) / 1000;

      while (scheduledUntilRef.current < horizon) {
        const cstart = scheduledUntilRef.current;
        for (const b of beats) {
          const at = cstart + b.at / 1000;
          if (audio && soundEnabled && at >= clock - 0.01) {
            const tone = TONE[b.kind];
            scheduleClick(audio, at, tone.freq, tone.durMs, tone.gain);
          }
          pendingBeatsRef.current.push({ at, kind: b.kind });
        }
        cyclesRef.current.push({ start: cstart, total: totalS });
        scheduledUntilRef.current = cstart + cycleS;
      }
    };
    tick();
    timerRef.current = setInterval(tick, TIMER_MS);

    // ── Visual loop (smooth progress + cue flashes) ──────────
    const draw = () => {
      const audio = ctxRef.current;
      const clock = audio ? audio.currentTime : performance.now() / 1000;

      // Fire flashes for any beats whose time has arrived.
      const pend = pendingBeatsRef.current;
      while (pend.length && pend[0].at <= clock) {
        const b = pend.shift()!;
        setLastBeat(b.kind);
        flashUntilRef.current = clock + 0.16;
        if (b.kind === 'takeaway') {
          if (countInDoneRef.current) {
            repsDoneRef.current += 1;
            setRep(repsDoneRef.current);
          } else {
            countInDoneRef.current = true;
          }
        }
      }
      if (flashUntilRef.current && clock > flashUntilRef.current) {
        setLastBeat(null);
        flashUntilRef.current = 0;
      }

      // Progress = position inside the active cycle, else resting (-1).
      let prog = -1;
      let resting = clock < firstStart;
      for (let i = cyclesRef.current.length - 1; i >= 0; i--) {
        const c = cyclesRef.current[i];
        if (clock >= c.start && clock <= c.start + c.total) {
          prog = c.total > 0 ? (clock - c.start) / c.total : 0;
          resting = false;
          break;
        }
        if (clock > c.start + c.total) {
          resting = true;
          break;
        }
      }
      setProgress(prog);
      setCountingIn(resting && clock < firstStart);

      // Prune fully-finished cycles to keep the arrays tiny.
      cyclesRef.current = cyclesRef.current.filter((c) => clock <= c.start + c.total + 0.5);

      rafRef.current = requestAnimationFrame(draw);
    };
    countInDoneRef.current = false;
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  const toggle = useCallback(() => {
    if (timerRef.current) stop();
    else start();
  }, [start, stop]);

  // Clean up on unmount.
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    void ctxRef.current?.close();
  }, []);

  return { isPlaying, rep, progress, lastBeat, countingIn, audioSupported, start, stop, toggle };
}
