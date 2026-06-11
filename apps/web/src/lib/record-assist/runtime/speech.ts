// ============================================================
// SwingVantage — RecordAssist runtime: speech + haptics
// ------------------------------------------------------------
// A tiny, defensive wrapper over the Web Speech Synthesis API and the
// Vibration API. The VoiceGuidanceEngine decides WHAT to say; this just
// speaks it. Respects autoplay/permission constraints (speech only fires
// from a user-gesture-initiated session) and never throws.
// ============================================================

import type { VoiceGuidanceMessage } from '../types';

export class SpeechEngine {
  private enabled = true;
  private rate = 1.05;
  private pitch = 1;
  private lang = 'en-US';

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  setLanguage(lang: string): void {
    this.lang = lang;
  }

  /** Speak a message. Cancels any in-progress utterance so we never overlap. */
  speak(message: VoiceGuidanceMessage): void {
    if (!this.enabled || !this.supported) return;
    try {
      const synth = window.speechSynthesis;
      // Never talk over ourselves.
      synth.cancel();
      const u = new SpeechSynthesisUtterance(message.text);
      u.rate = this.rate;
      u.pitch = this.pitch;
      u.lang = this.lang;
      synth.speak(u);
    } catch {
      /* ignore — captions still render */
    }
  }

  cancel(): void {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

/** Fire a haptic pattern if supported (no-op otherwise). */
export function vibrate(pattern?: number[]): void {
  if (!pattern || pattern.length === 0) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
}
