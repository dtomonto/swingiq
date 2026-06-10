// ============================================================
// SwingVantage — RecordAssist: MotionSafeZoneEngine
// ------------------------------------------------------------
// Predicts whether the body or the implement is likely to leave the frame
// once the athlete actually moves, by comparing the current bounding box
// to a sport/action MOVEMENT ENVELOPE (how much lateral + vertical room
// the motion needs). Pure + deterministic. This is a forward-looking
// guard ("you'll run out of room") vs FrameQuality's "you're cut off now".
// ============================================================

import type { FrameQualitySignals, SportActionPreset, RecordAssistSport } from '../types';

export type EdgeRisk = 'ok' | 'tight' | 'risk';

export interface SafeZonePrediction {
  left: EdgeRisk;
  right: EdgeRisk;
  top: EdgeRisk;
  bottom: EdgeRisk;
  /** True when any edge is at risk once the motion plays out. */
  willLeaveFrame: boolean;
  /** Single most useful nudge, or null when the zone is safe. */
  advice: string | null;
}

// Lateral room (fraction of frame) each sport's motion needs on the sides.
// Vertical room is asymmetric: the TOP need comes from the preset headroom
// (overhead actions need lots), while the BOTTOM only needs a small margin —
// feet at the frame bottom is good framing, you don't exit downward by moving.
const LATERAL_ENVELOPE: Record<RecordAssistSport, number> = {
  golf: 0.1,
  tennis: 0.2,
  baseball: 0.16,
  softball: 0.16,
  pickleball: 0.14,
  padel: 0.16,
};

const BOTTOM_MARGIN_NEEDED = 0.03;
const TOP_MARGIN_MIN = 0.06;

function rank(margin: number, needed: number): EdgeRisk {
  if (margin >= needed) return 'ok';
  if (margin >= needed * 0.5) return 'tight';
  return 'risk';
}

export function predictSafeZone(
  quality: FrameQualitySignals | null,
  preset?: SportActionPreset,
): SafeZonePrediction {
  const box = quality?.boundingBox;
  const safe: SafeZonePrediction = {
    left: 'ok', right: 'ok', top: 'ok', bottom: 'ok',
    willLeaveFrame: false, advice: null,
  };
  if (!box || !preset) return safe;

  const lateral = LATERAL_ENVELOPE[preset.sport];
  // Overhead actions (serve/smash/bandeja) need more room above the head.
  const verticalTop = Math.max(TOP_MARGIN_MIN, preset.headroomFraction);

  const marginLeft = box.x;
  const marginRight = 1 - (box.x + box.width);
  const marginTop = box.y;
  const marginBottom = 1 - (box.y + box.height);

  safe.left = rank(marginLeft, lateral);
  safe.right = rank(marginRight, lateral);
  safe.top = rank(marginTop, verticalTop);
  safe.bottom = rank(marginBottom, BOTTOM_MARGIN_NEEDED);

  safe.willLeaveFrame = [safe.left, safe.right, safe.top, safe.bottom].includes('risk');

  // Pick the tightest edge for advice.
  const edges: Array<[EdgeRisk, string]> = [
    [safe.top, 'Leave more space above your head for the motion.'],
    [safe.left, 'Step right — your swing may run out of room on the left.'],
    [safe.right, 'Step left — your swing may run out of room on the right.'],
    [safe.bottom, 'Tilt down or step back so your feet keep room below.'],
  ];
  const worst = edges.find(([r]) => r === 'risk') ?? edges.find(([r]) => r === 'tight');
  safe.advice = worst ? worst[1] : null;

  return safe;
}
