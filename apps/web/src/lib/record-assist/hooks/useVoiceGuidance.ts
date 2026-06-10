'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  VoiceGuidancePlanner,
  countdownMessage,
} from '../engines/voice-guidance-engine';
import { SpeechEngine, vibrate } from '../runtime/speech';
import type {
  FrameQualitySignals,
  ReadinessScore,
  SportActionPreset,
  VoiceGuidanceMessage,
  VoiceMode,
} from '../types';

export interface UseVoiceGuidanceOptions {
  quality: FrameQualitySignals | null;
  readiness: ReadinessScore | null;
  preset?: SportActionPreset;
  mode: VoiceMode;
  /** Run guidance only while framing (paused during recording/review). */
  active: boolean;
  hapticsEnabled: boolean;
  /** Notified whenever a message is actually surfaced (for analytics). */
  onMessage?: (message: VoiceGuidanceMessage) => void;
}

export interface UseVoiceGuidance {
  /** The current caption text (always shown, even in silent mode). */
  caption: string | null;
  lastMessage: VoiceGuidanceMessage | null;
  voiceSupported: boolean;
  /** Speak a countdown number (bypasses throttling). */
  speakCountdown: (n: number) => void;
}

/**
 * Drives the hands-free coach: plans the next message via the throttled
 * VoiceGuidanceEngine, speaks it (unless silent), buzzes the haptic, and
 * always exposes a caption for accessibility. Captions render regardless of
 * voice mode so deaf/HoH users and muted sessions get the same guidance.
 */
export function useVoiceGuidance(opts: UseVoiceGuidanceOptions): UseVoiceGuidance {
  const { quality, readiness, preset, mode, active, hapticsEnabled, onMessage } = opts;

  const plannerRef = useRef<VoiceGuidancePlanner | null>(null);
  const speechRef = useRef<SpeechEngine | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<VoiceGuidanceMessage | null>(null);

  if (!plannerRef.current) plannerRef.current = new VoiceGuidancePlanner({ mode });
  if (!speechRef.current) speechRef.current = new SpeechEngine();

  // Keep the planner/speech in sync with mode changes.
  useEffect(() => {
    plannerRef.current?.setMode(mode);
    speechRef.current?.setEnabled(mode !== 'silent');
  }, [mode]);

  const voiceSupported = speechRef.current?.supported ?? false;

  // Plan + surface guidance whenever the signals change.
  useEffect(() => {
    if (!active || !quality || !readiness) return;
    const planner = plannerRef.current!;
    const speech = speechRef.current!;
    const now =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    const msg = planner.plan(quality, readiness, now, preset);
    if (!msg) return;

    setCaption(msg.text);
    setLastMessage(msg);
    if (mode !== 'silent') speech.speak(msg);
    if (hapticsEnabled) vibrate(msg.haptic);
    onMessage?.(msg);
  }, [active, quality, readiness, preset, mode, hapticsEnabled, onMessage]);

  // Stop talking when guidance is paused.
  useEffect(() => {
    if (!active) speechRef.current?.cancel();
  }, [active]);

  const speakCountdown = useCallback(
    (n: number) => {
      const msg = countdownMessage(n);
      setCaption(msg.text);
      setLastMessage(msg);
      if (mode !== 'silent') speechRef.current?.speak(msg);
      onMessage?.(msg);
    },
    [mode, onMessage],
  );

  return useMemo(
    () => ({ caption, lastMessage, voiceSupported, speakCountdown }),
    [caption, lastMessage, voiceSupported, speakCountdown],
  );
}
