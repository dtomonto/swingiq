// ============================================================
// SwingVantage — RecordAssist: CompatibilityEngine
// ------------------------------------------------------------
// Decides what RecordAssist can do on this device from an injected
// capability probe. Pure (the probe is the only input) so every tier
// — full / degraded / unsupported — is unit-tested without a browser.
// The hook layer builds the probe from real `window`/`navigator`.
// ============================================================

import type { CompatibilityProbe, DeviceCompatibilityResult } from '../types';

/** Build a probe from the live browser environment (browser-only). */
export function probeEnvironment(): CompatibilityProbe {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const win = typeof window !== 'undefined' ? window : undefined;

  let hasWebGL = false;
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      hasWebGL = !!(
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      );
    }
  } catch {
    hasWebGL = false;
  }

  return {
    hasMediaDevices: !!nav?.mediaDevices,
    hasGetUserMedia: !!nav?.mediaDevices?.getUserMedia,
    hasMediaRecorder: typeof win !== 'undefined' && 'MediaRecorder' in win,
    hasSpeechSynthesis: typeof win !== 'undefined' && 'speechSynthesis' in win,
    hasVibration: !!nav && 'vibrate' in nav,
    hasWebGL,
    isSecureContext: typeof win !== 'undefined' ? win.isSecureContext !== false : true,
    userAgent: nav?.userAgent ?? '',
  };
}

export function evaluateCompatibility(probe: CompatibilityProbe): DeviceCompatibilityResult {
  const notes: string[] = [];

  // Camera is the hard requirement. No camera or insecure context → unsupported.
  const recordingSupported = probe.hasGetUserMedia && probe.hasMediaRecorder;
  const cameraSupported = probe.hasMediaDevices && probe.hasGetUserMedia;

  if (!probe.isSecureContext) {
    notes.push('Camera access needs a secure (https) connection.');
  }
  if (!cameraSupported) {
    notes.push('This browser does not expose camera access.');
  }
  if (!probe.hasMediaRecorder) {
    notes.push('In-browser recording is not supported here — you can still upload a clip.');
  }

  // Pose detection needs WebGL (MediaPipe GPU/CPU delegate still wants a GL
  // context for the vision tasks runtime in practice).
  const poseSupported = cameraSupported && probe.hasWebGL && probe.isSecureContext;
  if (cameraSupported && !probe.hasWebGL) {
    notes.push('Live body tracking is unavailable — falling back to manual framing guides.');
  }

  const voiceSupported = probe.hasSpeechSynthesis;
  if (!voiceSupported) {
    notes.push('Voice guidance is unavailable — captions will still show.');
  }

  const hapticsSupported = probe.hasVibration;

  let tier: DeviceCompatibilityResult['tier'];
  if (!cameraSupported || !probe.isSecureContext) {
    tier = 'unsupported';
  } else if (!poseSupported || !recordingSupported) {
    tier = 'degraded';
  } else {
    tier = 'full';
  }

  return {
    tier,
    poseSupported,
    recordingSupported,
    voiceSupported,
    hapticsSupported,
    notes,
  };
}
