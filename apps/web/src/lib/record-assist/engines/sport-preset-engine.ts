// ============================================================
// SwingVantage — RecordAssist: SportPresetEngine
// ------------------------------------------------------------
// Sport + action capture presets for all six SwingVantage sports.
// Each preset is pure data: orientation, recommended view, required
// landmarks, setup steps, implement-risk baseline, score-weight nudges,
// and a "why this matters" explainer. Pure module — no React, no I/O.
// ============================================================

import type {
  RecordAssistSport,
  SportActionId,
  SportActionPreset,
} from '../types';
import { LM } from './landmarks';

const CORE_BODY = [
  LM.NOSE,
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
];

const WRISTS = [LM.LEFT_WRIST, LM.RIGHT_WRIST];

/** Helper to reduce repetition while keeping each preset explicit. */
function preset(p: SportActionPreset): SportActionPreset {
  return p;
}

// ── Golf ────────────────────────────────────────────────────
const GOLF: SportActionPreset[] = [
  preset({
    sport: 'golf', action: 'driver', label: 'Driver', hint: 'Full swing, tee shot',
    recommendedOrientation: 'landscape', recommendedView: 'down_the_line',
    setupSteps: [
      'Stand far enough back that the clubhead never leaves the frame at the top or finish.',
      'Place the phone behind your hands, along the target line, on the ground or a low prop.',
      'Keep your whole body and the ball in view through impact.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'high',
    weightOverrides: { implement: 20, full_body: 25 },
    why: 'Driver speed needs the most space — the clubhead travels well outside your body line.',
  }),
  preset({
    sport: 'golf', action: 'iron', label: 'Iron', hint: 'Full swing, ball on turf',
    recommendedOrientation: 'landscape', recommendedView: 'down_the_line',
    setupSteps: [
      'Frame from address to a full finish so the club stays in view.',
      'Down-the-line: phone behind the hands along the target line.',
      'Face-on: phone directly in front, chest height if propped.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'high',
    why: 'We read feet, hips, shoulders, wrists and the club path — all must stay in frame.',
  }),
  preset({
    sport: 'golf', action: 'wedge', label: 'Wedge', hint: 'Controlled partial swing',
    recommendedOrientation: 'landscape', recommendedView: 'face_on',
    setupSteps: [
      'A partial swing needs less width — you can stand a little closer.',
      'Keep hands, club and the ball in frame through the strike.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.06, implementRiskBaseline: 'medium',
    why: 'Tempo and low-point control read best face-on with the full body visible.',
  }),
  preset({
    sport: 'golf', action: 'chipping', label: 'Chipping', hint: 'Short-game shot',
    recommendedOrientation: 'landscape', recommendedView: 'face_on',
    setupSteps: [
      'Stand closer — short shots need less frame width.',
      'Keep the lower body, hands and ball in view.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.05, implementRiskBaseline: 'low',
    weightOverrides: { implement: 8, distance: 18 },
    why: 'Chip strike quality reads from a steady, close, face-on view.',
  }),
  preset({
    sport: 'golf', action: 'putting', label: 'Putting', hint: 'Green stroke',
    recommendedOrientation: 'landscape', recommendedView: 'face_on',
    setupSteps: [
      'Film face-on or from directly behind, low to the ground.',
      'Keep the stroke path and the ball in view.',
    ],
    requiredLandmarks: [LM.NOSE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, ...WRISTS],
    headroomFraction: 0.04, implementRiskBaseline: 'low',
    weightOverrides: { implement: 6, full_body: 18, stability: 16 },
    why: 'Putting is small and slow — stability matters more than full-body framing.',
  }),
];

// ── Tennis ──────────────────────────────────────────────────
const TENNIS: SportActionPreset[] = [
  preset({
    sport: 'tennis', action: 'forehand', label: 'Forehand', hint: 'Groundstroke',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: [
      'Film side-on or from behind so the full stroke and contact show.',
      'Leave room on both sides for your split-step and follow-through.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'high',
    why: 'The racket and body must stay in frame across lateral movement.',
  }),
  preset({
    sport: 'tennis', action: 'backhand', label: 'Backhand', hint: 'One or two-handed',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: [
      'Side-on captures the unit turn and contact point.',
      'Stand back enough for the full swing path and footwork.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'high',
    why: 'Both arms, the racket and your base need to stay visible.',
  }),
  preset({
    sport: 'tennis', action: 'serve', label: 'Serve', hint: 'Overhead serve',
    recommendedOrientation: 'portrait', recommendedView: 'side',
    setupSteps: [
      'Leave extra space ABOVE your head for the toss and racket drop.',
      'Portrait orientation captures the full overhead extension.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.2, implementRiskBaseline: 'high',
    weightOverrides: { angle: 10, full_body: 22 },
    why: 'The serve goes high — without headroom the toss and contact leave the frame.',
  }),
  preset({
    sport: 'tennis', action: 'volley', label: 'Volley', hint: 'Net shot',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: ['Closer framing is fine — volleys are compact.', 'Keep the racket and upper body in view.'],
    requiredLandmarks: [LM.NOSE, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP, ...WRISTS],
    headroomFraction: 0.06, implementRiskBaseline: 'medium',
    why: 'Compact punch volleys read from a close, steady side view.',
  }),
  preset({
    sport: 'tennis', action: 'return', label: 'Return', hint: 'Return of serve',
    recommendedOrientation: 'landscape', recommendedView: 'baseline',
    setupSteps: ['Film from behind the baseline.', 'Leave room for the split-step and lateral move.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'high',
    why: 'Returns need width for reaction movement in either direction.',
  }),
];

// ── Baseball / Softball (shared action set) ─────────────────
function diamondActions(sport: 'baseball' | 'softball'): SportActionPreset[] {
  const bat = sport === 'baseball' ? 'bat' : 'bat';
  return [
    preset({
      sport, action: 'hitting', label: 'Hitting', hint: 'Batting swing',
      recommendedOrientation: 'landscape', recommendedView: 'face_on',
      setupSteps: [
        'Stand back so the whole bat path stays in frame.',
        `Face-on or from the pitcher's view keeps the ${bat} and contact visible.`,
        'Keep both feet, hips and hands in view.',
      ],
      requiredLandmarks: [...CORE_BODY, ...WRISTS],
      headroomFraction: 0.08, implementRiskBaseline: 'high',
      weightOverrides: { implement: 20 },
      why: 'Bat path and contact need width; clipping the barrel loses the swing.',
    }),
    preset({
      sport, action: 'tee_work', label: 'Tee Work', hint: 'Off the tee',
      recommendedOrientation: 'landscape', recommendedView: 'face_on',
      setupSteps: ['Keep the tee, ball and full body in frame.', 'A steady, closer face-on view works well.'],
      requiredLandmarks: [...CORE_BODY, ...WRISTS],
      headroomFraction: 0.06, implementRiskBaseline: 'medium',
      why: 'Tee work isolates mechanics — keep the body and bat fully visible.',
    }),
    preset({
      sport, action: 'front_toss', label: 'Front Toss', hint: 'Soft front toss',
      recommendedOrientation: 'landscape', recommendedView: 'face_on',
      setupSteps: ['Frame the hitter, not the tosser.', 'Keep the full swing and contact in view.'],
      requiredLandmarks: [...CORE_BODY, ...WRISTS],
      headroomFraction: 0.08, implementRiskBaseline: 'high',
      why: 'Only the hitter should be in frame so detection locks to the right body.',
    }),
    preset({
      sport, action: 'cage', label: 'Batting Cage', hint: 'Cage reps',
      recommendedOrientation: 'landscape', recommendedView: 'side',
      setupSteps: [
        'Film through an open panel — cage netting can hide landmarks.',
        'Get as close to the net as safe to reduce bars across the body.',
      ],
      requiredLandmarks: [...CORE_BODY, ...WRISTS],
      headroomFraction: 0.08, implementRiskBaseline: 'high',
      weightOverrides: { background: 8 },
      why: 'Cage bars and netting reduce tracking — minimize what crosses the body.',
    }),
    preset({
      sport, action: 'throwing', label: 'Throwing', hint: 'Position throw',
      recommendedOrientation: 'landscape', recommendedView: 'side',
      setupSteps: ['Side-on shows the arm path and stride.', 'Leave room for the stride toward the target.'],
      requiredLandmarks: [...CORE_BODY, ...WRISTS],
      headroomFraction: 0.1, implementRiskBaseline: 'low',
      why: 'Arm slot and stride direction read best from a side view.',
    }),
    preset({
      sport, action: 'fielding', label: 'Fielding', hint: 'Ground ball / infield',
      recommendedOrientation: 'landscape', recommendedView: 'front',
      setupSteps: ['Frame the ready position and the ground-ball lane.', 'Leave width for lateral range.'],
      requiredLandmarks: CORE_BODY,
      headroomFraction: 0.06, implementRiskBaseline: 'low',
      weightOverrides: { implement: 6, distance: 18 },
      why: 'Footwork and glove approach need width and a clear ground lane.',
    }),
  ];
}

// ── Pickleball ──────────────────────────────────────────────
const PICKLEBALL: SportActionPreset[] = [
  preset({
    sport: 'pickleball', action: 'serve', label: 'Serve', hint: 'Underhand serve',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: ['Keep paddle, shoulders, hips, knees and feet in view.', 'Side-on shows the underhand contact below the waist.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS, LM.LEFT_KNEE, LM.RIGHT_KNEE],
    headroomFraction: 0.06, implementRiskBaseline: 'medium',
    why: 'Legal serves are below the waist — knees and contact must be visible.',
  }),
  preset({
    sport: 'pickleball', action: 'dink', label: 'Dink', hint: 'Soft kitchen shot',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: ['Frame the kitchen line and your full body.', 'Closer is fine — dinks are compact and soft.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.05, implementRiskBaseline: 'low',
    weightOverrides: { implement: 10, stability: 14 },
    why: 'Soft-hands control reads from a steady, close kitchen-line view.',
  }),
  preset({
    sport: 'pickleball', action: 'volley', label: 'Volley', hint: 'Net / kitchen-line shot',
    recommendedOrientation: 'landscape', recommendedView: 'front',
    setupSteps: ['Front view at the kitchen line works well.', 'Keep paddle and both feet in view (no foot faults).'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.06, implementRiskBaseline: 'medium',
    why: 'Kitchen-line volleys need feet visible to check the no-volley zone.',
  }),
  preset({
    sport: 'pickleball', action: 'drive', label: 'Drive', hint: 'Topspin groundstroke',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: ['Stand back for the full swing path.', 'Keep the paddle in frame through contact.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.07, implementRiskBaseline: 'high',
    why: 'Drives have a longer swing path — give the paddle room.',
  }),
  preset({
    sport: 'pickleball', action: 'third_shot_drop', label: 'Third-Shot Drop', hint: 'Soft drop to the kitchen',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: ['Side-on shows the gentle arc and contact point.', 'Keep the full body and paddle visible.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'medium',
    why: 'The drop arc reads best with the whole body and paddle in frame.',
  }),
];

// ── Padel ───────────────────────────────────────────────────
const PADEL: SportActionPreset[] = [
  preset({
    sport: 'padel', action: 'bandeja', label: 'Bandeja', hint: 'Controlled overhead',
    recommendedOrientation: 'portrait', recommendedView: 'side',
    setupSteps: ['Leave overhead room for the high contact.', 'Side-on captures the controlled overhead path.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.18, implementRiskBaseline: 'high',
    weightOverrides: { angle: 10 },
    why: 'Overheads need headroom or the contact point leaves the frame.',
  }),
  preset({
    sport: 'padel', action: 'vibora', label: 'Víbora', hint: 'Side-spin overhead',
    recommendedOrientation: 'portrait', recommendedView: 'side',
    setupSteps: ['Leave space above the head.', 'Side-on shows the side-spin brush at contact.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.18, implementRiskBaseline: 'high',
    why: 'High contact + spin needs full overhead extension in frame.',
  }),
  preset({
    sport: 'padel', action: 'smash', label: 'Smash', hint: 'Finishing overhead',
    recommendedOrientation: 'portrait', recommendedView: 'side',
    setupSteps: ['Maximum headroom — the smash reaches highest.', 'Step back so your full jump/lift stays in frame.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.22, implementRiskBaseline: 'high',
    weightOverrides: { angle: 10, full_body: 22 },
    why: 'Smashes need the most overhead space of any padel shot.',
  }),
  preset({
    sport: 'padel', action: 'forehand', label: 'Forehand', hint: 'Groundstroke',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: ['Side-on shows the swing and contact.', 'Leave room for the full path.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'medium',
    why: 'The racket and body must stay framed through contact.',
  }),
  preset({
    sport: 'padel', action: 'wall_rebound', label: 'Wall Rebound', hint: 'Off the glass',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: [
      'Avoid pointing the camera straight at the glass — reflections confuse detection.',
      'Angle slightly so the wall rebound and your body both show.',
    ],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.08, implementRiskBaseline: 'medium',
    weightOverrides: { background: 8 },
    why: 'Glass reflections can create false detections — angle away from direct glare.',
  }),
  preset({
    sport: 'padel', action: 'serve', label: 'Serve', hint: 'Underhand serve',
    recommendedOrientation: 'landscape', recommendedView: 'side',
    setupSteps: ['Side-on shows the below-waist contact.', 'Keep the full body and racket in frame.'],
    requiredLandmarks: [...CORE_BODY, ...WRISTS],
    headroomFraction: 0.06, implementRiskBaseline: 'medium',
    why: 'Serve legality (below waist, behind the line) reads from a side view.',
  }),
];

const ALL: Record<RecordAssistSport, SportActionPreset[]> = {
  golf: GOLF,
  tennis: TENNIS,
  baseball: diamondActions('baseball'),
  softball: diamondActions('softball'),
  pickleball: PICKLEBALL,
  padel: PADEL,
};

/** All actions available for a sport (ordered for display). */
export function actionsForSport(sport: RecordAssistSport): SportActionPreset[] {
  return ALL[sport] ?? [];
}

/** Resolve a specific preset; falls back to the sport's first action. */
export function getPreset(
  sport: RecordAssistSport,
  action: SportActionId,
): SportActionPreset | undefined {
  const list = ALL[sport];
  if (!list || list.length === 0) return undefined;
  return list.find((p) => p.action === action) ?? list[0];
}

/** Every preset across all sports (for admin QA + tests). */
export function allPresets(): SportActionPreset[] {
  return (Object.keys(ALL) as RecordAssistSport[]).flatMap((s) => ALL[s]);
}

export const RECORD_ASSIST_SPORTS: RecordAssistSport[] = [
  'golf',
  'tennis',
  'baseball',
  'softball',
  'pickleball',
  'padel',
];
