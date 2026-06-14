// ============================================================
// SwingVantage — Client-side Frame Enhancement (recovery layer)
// ------------------------------------------------------------
// When a clip is dark, flat (low-contrast), or compressed, MediaPipe's
// pose detector silently drops frames it can't read — which is the #1
// reason an "acceptable looking" video yields little usable data. This
// module builds a CONSERVATIVE enhancement plan from a frame's luma
// statistics and applies it (gamma + contrast-stretch) before a retry
// detection pass.
//
// HONESTY: enhancement only changes whether the detector can SEE the
// athlete — it never moves or invents landmarks. The original frames are
// always kept, and the pipeline only adopts an enhanced pass when it
// recovers MORE real poses. We deliberately do NOT sharpen aggressively
// (the brief's "avoid over-processing" rule): an unsharp pass can hallucinate
// edges that pull landmarks off the body. The plan records a `sharpen`
// intent for telemetry, but the applied transform is tone-only.
//
// The pure planning core (no DOM) is unit-tested; the canvas applier is a
// best-effort browser helper that returns the original frame on any failure.
// ============================================================

/** Normalized (0–1) luma statistics for one frame or an aggregate of frames. */
export interface GrayLumaStats {
  /** Mean luma, 0 (black) – 1 (white). */
  brightness: number;
  /** Contrast/spread proxy, 0 (flat) – 1 (high). */
  contrast: number;
  /** Sharpness proxy from neighbour gradients, 0 (very soft/blurred) – 1 (crisp). */
  sharpness: number;
}

/** A conservative, reversible tone transform to make a frame readable. */
export interface EnhancementPlan {
  /** Gamma exponent on normalized luma. <1 brightens midtones; 1 = no change. */
  gamma: number;
  /** Input black point (0–255) stretched down to 0. */
  blackPoint: number;
  /** Input white point (0–255) stretched up to 255. */
  whitePoint: number;
  /** Advisory only — the applier is tone-only and does NOT convolve (see header). */
  sharpen: boolean;
  /** Human-readable list of why this plan was produced (debug/telemetry). */
  reason: string;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

// Below these the detector starts dropping frames; tuned conservatively so we
// only intervene when a frame is genuinely hard to read, never on good footage.
const DARK_BRIGHTNESS = 0.35;
const FLAT_CONTRAST = 0.15;
const SOFT_SHARPNESS = 0.12;

/**
 * Decide whether (and how) to enhance a frame from its luma stats. Returns
 * `null` when the frame is already readable — we never touch good footage.
 * Pure + deterministic.
 */
export function planEnhancement(stats: GrayLumaStats): EnhancementPlan | null {
  const b = clamp(stats.brightness, 0, 1);
  const c = clamp(stats.contrast, 0, 1);
  const s = clamp(stats.sharpness, 0, 1);
  const reasons: string[] = [];

  // Brighten dark midtones (gamma < 1). Linear ramp: pitch-black → 0.5,
  // and fading to 1.0 (no change) at the DARK_BRIGHTNESS threshold.
  let gamma = 1;
  if (b < DARK_BRIGHTNESS) {
    gamma = clamp(0.5 + (b / DARK_BRIGHTNESS) * 0.5, 0.5, 1);
    reasons.push(`low light (brightness ${b.toFixed(2)})`);
  }

  // Stretch a flat histogram around its mean so edges separate from background.
  let blackPoint = 0;
  let whitePoint = 255;
  if (c < FLAT_CONTRAST) {
    blackPoint = clamp(Math.round(255 * (b - 0.18)), 0, 70);
    whitePoint = clamp(Math.round(255 * (b + 0.18)), 185, 255);
    reasons.push(`flat contrast (${c.toFixed(2)})`);
  }

  const sharpen = s < SOFT_SHARPNESS;
  if (sharpen) reasons.push(`soft/blurred (sharpness ${s.toFixed(2)})`);

  // Nothing worth doing — leave the frame untouched.
  if (gamma === 1 && blackPoint === 0 && whitePoint === 255 && !sharpen) return null;

  return { gamma, blackPoint, whitePoint, sharpen, reason: reasons.join(', ') };
}

/**
 * Build a 256-entry LUT that applies the plan's contrast-stretch then gamma.
 * Pure; used by the canvas applier and exercised directly in tests.
 */
export function buildToneLut(plan: Pick<EnhancementPlan, 'gamma' | 'blackPoint' | 'whitePoint'>): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  const span = Math.max(1, plan.whitePoint - plan.blackPoint);
  for (let i = 0; i < 256; i++) {
    const stretched = clamp((i - plan.blackPoint) / span, 0, 1);
    lut[i] = Math.round(stretched ** plan.gamma * 255);
  }
  return lut;
}

/**
 * Apply an enhancement plan to a JPEG/PNG data URL in the browser and return a
 * new data URL. Best-effort: returns the ORIGINAL url unchanged when the DOM /
 * canvas is unavailable or anything fails — analysis must never break here.
 */
export async function enhanceFrameDataUrl(dataUrl: string, plan: EnhancementPlan): Promise<string> {
  if (typeof document === 'undefined') return dataUrl;
  try {
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = dataUrl;
    });
    if (!img || !img.width || !img.height) return dataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0);

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const lut = buildToneLut(plan);
    const px = image.data;
    for (let i = 0; i < px.length; i += 4) {
      px[i] = lut[px[i]]; // R
      px[i + 1] = lut[px[i + 1]]; // G
      px[i + 2] = lut[px[i + 2]]; // B
      // alpha untouched
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return dataUrl;
  }
}
