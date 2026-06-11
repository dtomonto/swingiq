import { evaluateCompatibility } from '../engines/compatibility-engine';
import type { CompatibilityProbe } from '../types';

const fullProbe: CompatibilityProbe = {
  hasMediaDevices: true,
  hasGetUserMedia: true,
  hasMediaRecorder: true,
  hasSpeechSynthesis: true,
  hasVibration: true,
  hasWebGL: true,
  isSecureContext: true,
  userAgent: 'jest',
};

describe('CompatibilityEngine', () => {
  it('reports full support for a modern device', () => {
    const r = evaluateCompatibility(fullProbe);
    expect(r.tier).toBe('full');
    expect(r.poseSupported).toBe(true);
    expect(r.recordingSupported).toBe(true);
    expect(r.voiceSupported).toBe(true);
    expect(r.hapticsSupported).toBe(true);
    expect(r.notes).toHaveLength(0);
  });

  it('degrades when WebGL (pose) is unavailable', () => {
    const r = evaluateCompatibility({ ...fullProbe, hasWebGL: false });
    expect(r.tier).toBe('degraded');
    expect(r.poseSupported).toBe(false);
    expect(r.recordingSupported).toBe(true);
    expect(r.notes.join(' ')).toMatch(/manual framing/i);
  });

  it('degrades when MediaRecorder is missing but camera works', () => {
    const r = evaluateCompatibility({ ...fullProbe, hasMediaRecorder: false });
    expect(r.tier).toBe('degraded');
    expect(r.recordingSupported).toBe(false);
  });

  it('is unsupported without camera access', () => {
    const r = evaluateCompatibility({ ...fullProbe, hasGetUserMedia: false, hasMediaDevices: false });
    expect(r.tier).toBe('unsupported');
    expect(r.poseSupported).toBe(false);
  });

  it('is unsupported in an insecure context', () => {
    const r = evaluateCompatibility({ ...fullProbe, isSecureContext: false });
    expect(r.tier).toBe('unsupported');
    expect(r.notes.join(' ')).toMatch(/secure/i);
  });

  it('keeps captions available when speech synthesis is missing', () => {
    const r = evaluateCompatibility({ ...fullProbe, hasSpeechSynthesis: false });
    expect(r.voiceSupported).toBe(false);
    expect(r.notes.join(' ')).toMatch(/captions/i);
  });
});
