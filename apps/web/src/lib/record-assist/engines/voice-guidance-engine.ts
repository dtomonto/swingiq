// ============================================================
// SwingVantage — RecordAssist: VoiceGuidanceEngine
// ------------------------------------------------------------
// Decides WHAT the hands-free coach should say and WHEN. Two layers:
//
//   1. selectGuidance() — pure: signals + readiness → the single
//      highest-impact message (or null when framing is good).
//   2. VoiceGuidancePlanner — a small stateful throttle on top so the
//      coach never repeats itself or talks over itself.
//
// Speech synthesis + captions live in the runtime/hooks; this module is
// pure and fully unit-tested (priority order + throttling matrix).
// ============================================================

import type {
  FrameQualitySignals,
  ReadinessScore,
  SportActionPreset,
  VoiceGuidanceMessage,
  VoiceMode,
} from '../types';

const HAPTIC_NUDGE = [60];
const HAPTIC_READY = [40, 60, 40];

/**
 * Build the candidate message for each possible issue. Lower priority
 * number = more urgent. Only ONE is spoken at a time (the top one).
 */
function candidates(
  q: FrameQualitySignals,
  readiness: ReadinessScore,
  preset?: SportActionPreset,
): VoiceGuidanceMessage[] {
  const out: VoiceGuidanceMessage[] = [];
  const push = (m: VoiceGuidanceMessage) => out.push(m);

  // 1 — No person at all (most urgent).
  if (!q.personDetected) {
    push({
      id: 'no_person', i18nKey: 'recordAssist.voice.noPerson', priority: 1,
      text: 'Step into the frame.', category: 'no_person', haptic: HAPTIC_NUDGE,
    });
    return out; // nothing else is meaningful without a person
  }

  // 2 — Multiple people confuse detection.
  if (q.personCount > 1) {
    push({
      id: 'multiple_people', i18nKey: 'recordAssist.voice.multiplePeople', priority: 2,
      text: 'Make sure only you are in the frame.', category: 'multiple_people',
    });
  }

  // 3 — Body cut off (head/feet) — high impact on full-body analysis.
  if (q.feetVisible === 'cut_off' || q.feetVisible === 'partial') {
    push({
      id: 'feet_cut', i18nKey: 'recordAssist.voice.feetCut', priority: 3,
      text: 'Your feet are cut off. Tilt the phone down or step back.',
      category: 'framing', haptic: HAPTIC_NUDGE,
    });
  }
  if (q.headVisible === 'cut_off' || q.headVisible === 'partial') {
    push({
      id: 'head_cut', i18nKey: 'recordAssist.voice.headCut', priority: 3,
      text: 'Your head is cut off. Tilt the phone up.',
      category: 'framing', haptic: HAPTIC_NUDGE,
    });
  }

  // 4 — Distance.
  if (q.distance === 'too_close') {
    push({
      id: 'too_close', i18nKey: 'recordAssist.voice.tooClose', priority: 4,
      text: 'Move back.', category: 'distance', haptic: HAPTIC_NUDGE,
    });
  } else if (q.distance === 'too_far') {
    push({
      id: 'too_far', i18nKey: 'recordAssist.voice.tooFar', priority: 4,
      text: 'Move a little closer.', category: 'distance', haptic: HAPTIC_NUDGE,
    });
  }

  // 5 — Centering.
  if (q.centering === 'left') {
    push({
      id: 'move_right', i18nKey: 'recordAssist.voice.moveRight', priority: 5,
      text: 'Move right.', category: 'centering', haptic: HAPTIC_NUDGE,
    });
  } else if (q.centering === 'right') {
    push({
      id: 'move_left', i18nKey: 'recordAssist.voice.moveLeft', priority: 5,
      text: 'Move left.', category: 'centering', haptic: HAPTIC_NUDGE,
    });
  }

  // 6 — Orientation mismatch.
  if (!q.orientationMatch && preset) {
    push({
      id: 'orientation', i18nKey: 'recordAssist.voice.orientation', priority: 6,
      text:
        preset.recommendedOrientation === 'landscape'
          ? 'Rotate to landscape for best results.'
          : 'Rotate to portrait for best results.',
      category: 'orientation',
    });
  }

  // 7 — Implement risk.
  if (q.implementRisk === 'high') {
    push({
      id: 'implement', i18nKey: 'recordAssist.voice.implement', priority: 7,
      text: implementPhrase(preset),
      category: 'implement',
    });
  }

  // 8 — Lighting.
  if (q.lighting === 'low') {
    push({
      id: 'lighting', i18nKey: 'recordAssist.voice.lighting', priority: 8,
      text: 'Lighting is low. Move toward brighter light.', category: 'lighting',
    });
  }

  // 9 — Stability.
  if (q.stability === 'shaky') {
    push({
      id: 'stability', i18nKey: 'recordAssist.voice.stability', priority: 9,
      text: 'The camera looks unstable. Prop it up or use a tripod.', category: 'stability',
    });
  }

  // 10 — All good → ready.
  if (out.length === 0 && readiness.state === 'excellent') {
    push({
      id: 'ready_excellent', i18nKey: 'recordAssist.voice.ready', priority: 10,
      text: 'Good framing. Start when ready.', category: 'ready', haptic: HAPTIC_READY,
    });
  } else if (out.length === 0 && readiness.state === 'usable') {
    push({
      id: 'ready_usable', i18nKey: 'recordAssist.voice.readyUsable', priority: 10,
      text: 'Your full body is visible. This will work.', category: 'ready', haptic: HAPTIC_READY,
    });
  }

  return out;
}

function implementPhrase(preset?: SportActionPreset): string {
  switch (preset?.sport) {
    case 'golf':
      return 'The club may leave the frame. Step back.';
    case 'tennis':
    case 'padel':
      return 'The racket may leave the frame. Step back.';
    case 'baseball':
    case 'softball':
      return 'The bat may leave the frame. Step back.';
    case 'pickleball':
      return 'The paddle may leave the frame. Step back.';
    default:
      return 'Your equipment may leave the frame. Step back.';
  }
}

/**
 * Pure selection: the single highest-impact message, or null when the
 * frame is good and nothing needs saying.
 */
export function selectGuidance(
  q: FrameQualitySignals,
  readiness: ReadinessScore,
  preset?: SportActionPreset,
): VoiceGuidanceMessage | null {
  const list = candidates(q, readiness, preset);
  if (list.length === 0) return null;
  return list.sort((a, b) => a.priority - b.priority)[0];
}

// ── Countdown lines ─────────────────────────────────────────

export function countdownMessage(n: number): VoiceGuidanceMessage {
  return {
    id: `countdown_${n}`,
    i18nKey: 'recordAssist.voice.countdown',
    text: n > 0 ? `Recording starts in ${n}` : 'Recording.',
    priority: 0,
    category: 'countdown',
  };
}

// ── Throttle / planner ──────────────────────────────────────

export interface VoicePlannerOptions {
  mode: VoiceMode;
  /** Minimum ms between ANY two spoken messages. */
  minGapMs?: number;
  /** Minimum ms before the SAME message id may repeat. */
  repeatCooldownMs?: number;
}

const DEFAULTS = { minGapMs: 2500, repeatCooldownMs: 6000 };

/**
 * Wraps selectGuidance with anti-spam throttling. Stateful but
 * deterministic given (now) — tests drive `now` explicitly.
 */
export class VoiceGuidancePlanner {
  // Start in the distant past so the very first message always plays.
  private lastSpokenAt = -Infinity;
  private lastId: string | null = null;
  private lastIdAt = -Infinity;
  private opts: Required<VoicePlannerOptions>;

  constructor(opts: VoicePlannerOptions) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  setMode(mode: VoiceMode): void {
    this.opts.mode = mode;
  }

  reset(): void {
    this.lastSpokenAt = -Infinity;
    this.lastId = null;
    this.lastIdAt = -Infinity;
  }

  /**
   * Returns the message to speak NOW, or null if guidance should stay
   * quiet (muted, too soon, or same message still cooling down).
   * `countdown` messages bypass throttling — they must always play.
   */
  plan(
    q: FrameQualitySignals,
    readiness: ReadinessScore,
    now: number,
    preset?: SportActionPreset,
    override?: VoiceGuidanceMessage | null,
  ): VoiceGuidanceMessage | null {
    if (this.opts.mode === 'silent') return null;

    const msg = override ?? selectGuidance(q, readiness, preset);
    if (!msg) return null;

    // Countdown always speaks.
    if (msg.category === 'countdown') {
      this.lastSpokenAt = now;
      this.lastId = msg.id;
      this.lastIdAt = now;
      return msg;
    }

    // Global anti-chatter gap.
    if (now - this.lastSpokenAt < this.opts.minGapMs) return null;

    // Same message cooling down.
    if (msg.id === this.lastId && now - this.lastIdAt < this.opts.repeatCooldownMs) {
      return null;
    }

    this.lastSpokenAt = now;
    this.lastId = msg.id;
    this.lastIdAt = now;
    return msg;
  }
}
