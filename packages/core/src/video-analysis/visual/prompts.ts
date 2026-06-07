// ============================================================
// SwingVantage — Sport-Specific AI Vision Prompts
//
// These prompts instruct an AI vision model to analyze the ACTUAL
// frames extracted from an uploaded swing video. The guardrails are
// strict on purpose: the model may only describe what is visibly
// supported by the frames, must declare confidence and visibility
// limits, and must never invent measurements, body angles, or ball
// flight that the frames do not show.
// ============================================================

import type { VisualSport } from './schema';

export interface VisionPromptMetadata {
  durationSeconds?: number;
  resolution?: string;
  /** Camera angle the user declared (e.g. "down_the_line"), if any. */
  declaredCameraAngle?: string;
  frameCount: number;
}

export interface VisionUserProfile {
  skillLevel?: string;
  handedness?: string;
  goals?: string;
}

export interface PreviousAnalysisSummary {
  sport?: string;
  summary?: string;
  priorities?: string[];
}

export interface VisionPromptInput {
  sport: VisualSport;
  metadata: VisionPromptMetadata;
  notes?: string | null;
  profile?: VisionUserProfile | null;
  previous?: PreviousAnalysisSummary | null;
  /** Objective signals from on-device pose detection, if available. */
  poseSummary?: string | null;
  /** Ask for the tightest valid output — fewer output tokens ⇒ a faster response. */
  concise?: boolean;
}

/**
 * Brevity directive for fast mode. Output-token generation dominates the
 * vision call's latency, so trimming verbosity (without dropping any required
 * field or fabricating) is the cheapest real speedup.
 */
export const CONCISE_DIRECTIVE =
  'BREVITY (required): keep every string tight and skimmable — "summary" ≤ 2 sentences, ' +
  'each "note"/"observation"/"evidenceFromVideo" ≤ 14 words, and return the MINIMUM number of ' +
  'array entries the rules allow (3 priorities, 3 drills). Do not pad. Never drop a required ' +
  'field or invent content to fill space — brevity never overrides the honesty rules above.';

// ──────────────────────────────────────────────────────────────
// Per-sport biomechanics focus
// ──────────────────────────────────────────────────────────────

interface SportFocus {
  label: string;
  phases: string;
  evaluate: string[];
}

const SPORT_FOCUS: Record<VisualSport, SportFocus> = {
  golf: {
    label: 'golf swing',
    phases: 'address/setup, takeaway, backswing, transition, downswing, impact, release, follow-through, finish',
    evaluate: [
      'setup posture and spine angle',
      'grip and alignment indicators (only if visible)',
      'takeaway path and backswing structure',
      'transition and lower-body sequencing',
      'hip and shoulder rotation',
      'head stability through the swing',
      'swing-plane indicators',
      'impact position (only if visible)',
      'release pattern, balance, and finish',
      'likely miss tendencies — only if the frames visibly support them',
    ],
  },
  tennis: {
    label: 'tennis stroke',
    phases: 'ready position, split step, unit turn, loading, forward swing, contact, follow-through, recovery',
    evaluate: [
      'ready position and split step',
      'unit turn and racket preparation',
      'spacing from the ball (only if visible)',
      'footwork and weight transfer',
      'swing path and contact zone',
      'balance and recovery',
      'likely stroke issue — only if visibly supported',
    ],
  },
  pickleball: {
    label: 'pickleball stroke',
    phases: 'ready position, split step, compact preparation, forward swing, contact, follow-through, recovery',
    evaluate: [
      'compactness of the backswing (pickleball is NOT a tennis loop)',
      'paddle-face angle and stability at contact',
      'contact height and contact point relative to the body (out front)',
      'low-to-high lift for dinks/drops vs. level path for drives/volleys',
      'split-step timing and footwork to/at the kitchen (non-volley zone) line',
      'balance and quiet hands on resets in the transition zone',
      'likely stroke issue (popped dink, netted drop, late volley) — only if visibly supported',
    ],
  },
  padel: {
    label: 'padel stroke',
    phases: 'ready position, split step, wall read, preparation, contact, follow-through, recovery',
    evaluate: [
      'reading and giving space to balls off the back/side glass (only if visible)',
      'overhead family mechanics — bandeja/víbora control vs. an over-hit smash',
      'paddle-face angle and contact point (out front, controlled height)',
      'side-on preparation and footwork around the ball',
      'lob depth and net-transition positioning',
      'partner spacing and court position (net vs. back) when visible',
      'likely stroke issue (weak bandeja, late after glass) — only if visibly supported',
    ],
  },
  baseball: {
    label: 'baseball swing',
    phases: 'stance, load, stride, hip/shoulder separation, swing, contact, extension, finish',
    evaluate: [
      'stance and load',
      'stride direction and length',
      'hip/shoulder separation',
      'hand path and bat path',
      'barrel control and head/eye stability',
      'contact position (only if visible)',
      'extension, finish, and balance',
      'timing indicators — only if visibly supported',
    ],
  },
  softball_slow: {
    label: 'slow-pitch softball swing',
    phases: 'stance, controlled load, stride, swing, contact, extension, finish',
    evaluate: [
      'controlled load and pitch-height matching',
      'stride timing and front-side stability',
      'swing plane for line-drive carry (not home-run intent)',
      'over-swing risk and bat lag',
      'extension through contact and ability to drive gaps',
      'finish and balance',
      'timing indicators — only if visibly supported',
    ],
  },
  softball_fast: {
    label: 'fast-pitch softball swing',
    phases: 'stance, load, stride, hip-fire, swing, contact, finish',
    evaluate: [
      'load timing and stride direction',
      'hip-fire sequence and hand path',
      'barrel accuracy and swing compactness',
      'contact quality indicators (only if visible)',
      'extension, finish, and balance',
      'timing indicators — only if visibly supported',
    ],
  },
};

// ──────────────────────────────────────────────────────────────
// JSON contract shown to the model (mirrors AIVisualAnalysisResultSchema)
// ──────────────────────────────────────────────────────────────

export const JSON_CONTRACT = `Return ONLY a single JSON object (no markdown fences, no prose before or after) with EXACTLY this shape:

{
  "summary": "2-4 sentence overview of what the frames show",
  "whatWasClearlyVisible": ["3 to 6 short, evidence-based observations"],
  "strengths": [
    {
      "strength": "a genuine thing the athlete is doing well",
      "evidenceFromVideo": "the specific visible evidence in the frames that supports it"
    }
  ],
  "videoQuality": {
    "cameraAngle":    { "quality": "excellent|good|limited|poor", "note": "short note" },
    "lighting":       { "quality": "excellent|good|limited|poor", "note": "short note" },
    "bodyVisibility": { "quality": "excellent|good|limited|poor", "note": "short note" },
    "swingVisibility":{ "quality": "excellent|good|limited|poor", "note": "short note" },
    "contactVisible": true,
    "fullMotionCaptured": true,
    "nextCaptureRecommendation": "one concrete capture tip"
  },
  "detectedPhases": [
    { "phaseName": "e.g. setup", "observation": "what you saw in that phase", "confidence": "high|moderate|low" }
  ],
  "topPriorities": [
    {
      "issue": "the mechanical issue observed",
      "whyItMatters": "why it limits performance",
      "evidenceFromVideo": "the specific visible evidence in the frames",
      "confidence": "high|moderate|low",
      "correctiveFocus": "what to work on"
    }
  ],
  "practicePlan": [
    {
      "name": "drill name",
      "purpose": "exact purpose tied to a priority above",
      "repsOrDuration": "e.g. 3 sets of 10, or 10 minutes",
      "howToKnowCorrect": "how the athlete knows they are doing it right"
    }
  ],
  "nextUpload": {
    "cameraAngle": "best angle for the next capture",
    "framing": "how to frame the athlete",
    "lighting": "lighting guidance",
    "distance": "how far away to place the camera",
    "sportNotes": "sport-specific capture notes"
  },
  "overallConfidence": 0.0,
  "visibilityQuality": "excellent|good|limited|poor"
}

Rules for the arrays: provide up to 3 evidence-backed "strengths" (only ones you can actually see — return an empty array if none are clearly visible, never invent praise); provide 3 entries in "topPriorities" when the evidence supports it (never more than 5), and 3 to 5 entries in "practicePlan". "overallConfidence" is a number between 0 and 1.`;

// ──────────────────────────────────────────────────────────────
// Builder
// ──────────────────────────────────────────────────────────────

export interface BuiltVisionPrompt {
  system: string;
  userText: string;
}

/**
 * Build the system + user prompt for a real AI vision analysis pass.
 * The frames themselves are attached as image content by the provider;
 * this function produces the text that accompanies them.
 */
export function buildVisionPrompt(input: VisionPromptInput): BuiltVisionPrompt {
  const focus = SPORT_FOCUS[input.sport];

  const system = [
    `You are an elite ${focus.label} biomechanics analyst reviewing still frames sampled from a single uploaded swing video.`,
    `The frames are ordered roughly across the motion: ${focus.phases}.`,
    '',
    'Evaluate ONLY what the frames actually show. Specifically assess:',
    ...focus.evaluate.map((e) => `- ${e}`),
    '',
    'Strict rules:',
    '- Base every statement on visible evidence in the frames. If something is not visible, say so in the video-quality limits and lower your confidence.',
    '- Do NOT invent measurements, exact body angles, club/bat/racket speeds, or ball flight unless they are clearly visible.',
    '- Do NOT give generic advice that is not tied to something you can see.',
    '- Always report video-quality limitations and an overall confidence level honestly.',
    '- Be specific, encouraging, and actionable. This is guidance, not a substitute for an in-person coach.',
    '',
    JSON_CONTRACT,
    ...(input.concise ? ['', CONCISE_DIRECTIVE] : []),
  ].join('\n');

  const userLines: string[] = [
    `Sport: ${focus.label}`,
    `Frames provided: ${input.metadata.frameCount} (sampled in motion order)`,
  ];
  if (input.metadata.durationSeconds) {
    userLines.push(`Video duration: ${input.metadata.durationSeconds.toFixed(1)}s`);
  }
  if (input.metadata.resolution) {
    userLines.push(`Resolution: ${input.metadata.resolution}`);
  }
  if (input.metadata.declaredCameraAngle && input.metadata.declaredCameraAngle !== 'unknown') {
    userLines.push(`User says the camera angle is: ${input.metadata.declaredCameraAngle} (verify against the frames).`);
  }
  if (input.profile) {
    const p = input.profile;
    const bits = [
      p.skillLevel ? `skill level ${p.skillLevel}` : null,
      p.handedness ? `${p.handedness}-handed` : null,
      p.goals ? `goals: ${p.goals}` : null,
    ].filter(Boolean);
    if (bits.length) userLines.push(`Athlete profile: ${bits.join(', ')}.`);
  }
  if (input.notes) {
    userLines.push(`Athlete notes: ${input.notes}`);
  }
  if (input.previous?.priorities?.length) {
    userLines.push(
      `For context only, the athlete's previous priorities were: ${input.previous.priorities.join('; ')}. ` +
        `Do NOT assume improvement — judge only from these new frames, and you may note whether the new frames still show those patterns.`,
    );
  }
  userLines.push('');
  if (input.poseSummary) {
    userLines.push(
      `Objective body signals measured on-device by pose detection (use as grounding alongside ` +
        `what you can see; these are proxies, not lab measurements, so don't over-rely on them): ` +
        input.poseSummary,
    );
  }
  userLines.push('');
  userLines.push('Analyze the attached frames now and return the JSON object.');

  return { system, userText: userLines.join('\n') };
}

/** Exposed for tests / docs — which sports have a dedicated prompt. */
export const SUPPORTED_VISION_SPORTS = Object.keys(SPORT_FOCUS) as VisualSport[];
