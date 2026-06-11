// ============================================================
// SwingVantage — RecordAssist runtime: camera-shake proxy
// ------------------------------------------------------------
// Closes the Phase 2 known-limitation (camera `motion` was always
// `undefined` → stability scored "unknown"). Subscribes to the
// DeviceMotion API and turns high-frequency acceleration jitter
// into a smoothed 0–1 shake proxy the guidance loop feeds into the
// frame's `motion` signal. iOS 13+ requires an explicit permission
// gesture; everything degrades to a silent no-op when unsupported.
//
// The math is split into pure helpers so it is unit-testable with
// no browser. Never throws.
// ============================================================

/** Acceleration (m/s²) above which we call the camera "very shaky" (→ 1.0). */
const SHAKE_REF = 2.5;
/** EMA factor tracking the slow component (gravity / steady orientation). */
const BASELINE_ALPHA = 0.1;
/** Smoothing of the shake proxy itself (higher = snappier). */
const SHAKE_ALPHA = 0.2;

export type Vec3 = { x: number; y: number; z: number };

/** Normalize an acceleration deviation (m/s²) into a 0–1 shake proxy. */
export function shakeFromDeviation(deviation: number, ref = SHAKE_REF): number {
  if (!Number.isFinite(deviation) || deviation <= 0) return 0;
  return Math.min(1, deviation / ref);
}

/** Exponential smoothing for the shake proxy. */
export function smoothShake(prev: number, sample: number, alpha = SHAKE_ALPHA): number {
  return prev * (1 - alpha) + sample * alpha;
}

/** Magnitude of the high-frequency component (sample minus slow baseline). */
export function accelDeviation(sample: Vec3, baseline: Vec3): number {
  return Math.hypot(sample.x - baseline.x, sample.y - baseline.y, sample.z - baseline.z);
}

type PermissionGatedDeviceMotion = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

/**
 * Live camera-shake monitor. Start it from a user gesture (iOS permission),
 * read `value()` each frame, and `stop()` when done. Safe to construct on the
 * server (every method is a guarded no-op until started in a browser).
 */
export class DeviceShakeMonitor {
  private running = false;
  private baseline: Vec3 | null = null;
  private shake = 0;
  private samples = 0;
  private readonly handler = (e: DeviceMotionEvent) => this.onMotion(e);

  /** Is the DeviceMotion API present at all? */
  get supported(): boolean {
    return typeof window !== 'undefined' && typeof DeviceMotionEvent !== 'undefined';
  }

  /** True on platforms (iOS 13+) that require an explicit permission gesture. */
  get needsPermission(): boolean {
    return (
      this.supported &&
      typeof (DeviceMotionEvent as PermissionGatedDeviceMotion).requestPermission === 'function'
    );
  }

  /**
   * Request permission (when required) and begin listening. Returns true when
   * the monitor is actively receiving motion, false on any denial/failure.
   */
  async start(): Promise<boolean> {
    if (!this.supported || this.running) return this.running;
    try {
      if (this.needsPermission) {
        const req = (DeviceMotionEvent as PermissionGatedDeviceMotion).requestPermission!;
        const res = await req();
        if (res !== 'granted') return false;
      }
      window.addEventListener('devicemotion', this.handler);
      this.running = true;
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    if (typeof window !== 'undefined') {
      try {
        window.removeEventListener('devicemotion', this.handler);
      } catch {
        /* ignore */
      }
    }
    this.running = false;
    this.baseline = null;
    this.shake = 0;
    this.samples = 0;
  }

  /** Current smoothed shake proxy 0–1, or undefined until measurable. */
  value(): number | undefined {
    if (!this.running || this.samples < 4) return undefined;
    return +this.shake.toFixed(3);
  }

  private onMotion(e: DeviceMotionEvent): void {
    // Prefer gravity-free acceleration; fall back to the gravity-inclusive
    // reading minus a slow baseline (which then absorbs the gravity vector).
    const a = e.acceleration && e.acceleration.x != null ? e.acceleration : e.accelerationIncludingGravity;
    if (!a) return;
    const sample: Vec3 = { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0 };
    if (!this.baseline) {
      this.baseline = sample;
      return;
    }
    this.baseline = {
      x: this.baseline.x * (1 - BASELINE_ALPHA) + sample.x * BASELINE_ALPHA,
      y: this.baseline.y * (1 - BASELINE_ALPHA) + sample.y * BASELINE_ALPHA,
      z: this.baseline.z * (1 - BASELINE_ALPHA) + sample.z * BASELINE_ALPHA,
    };
    const dev = accelDeviation(sample, this.baseline);
    this.shake = smoothShake(this.shake, shakeFromDeviation(dev), SHAKE_ALPHA);
    this.samples += 1;
  }
}
