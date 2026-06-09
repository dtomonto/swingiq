// ============================================================
// Profile-relative diagnosis (#13) + expanded club windows (#14)
// Intelligence upgrade Sprint 1.
// ============================================================

import {
  relativizeDiagnoses,
  profileRelativeConfidence,
  PROFILE_TOLERANCES,
  type GolfSkillLevel,
} from './profile-tolerance';
import { TARGET_WINDOWS } from './rules';
import type { DiagnosticResult } from './engine';

// Minimal result — relativizeDiagnoses only reads rule.{id,name}, confidence, stats.
function res(faceToPath: number, opts: { clubPath?: number; confidence?: number } = {}): DiagnosticResult {
  const d = {
    rule: { id: 'slice_weak_fade', name: 'Open Face / Slice Pattern' },
    confidence: opts.confidence ?? 80,
    stats: {
      avg_face_to_path: faceToPath,
      ...(opts.clubPath !== undefined ? { avg_club_path: opts.clubPath } : {}),
    },
  };
  return { stats: {}, diagnoses: [d], primary: d, secondary: [] } as unknown as DiagnosticResult;
}

describe('#13 relativizeDiagnoses — coach against the player level', () => {
  it('treats the same +5° face-to-path as expected for a beginner but a priority for a pro', () => {
    const beginner = relativizeDiagnoses(res(5), 'beginner').items[0];
    const pro = relativizeDiagnoses(res(5), 'professional').items[0];

    expect(beginner.relativeSeverity).toBe('within_expected');
    expect(pro.relativeSeverity).toBe('well_outside');
    expect(beginner.relevanceFactor).toBeLessThan(pro.relevanceFactor);
    expect(beginner.metric).toBe('face_to_path');
  });

  it('softens within-level confidence and boosts genuine outliers', () => {
    const beginner = relativizeDiagnoses(res(5, { confidence: 80 }), 'beginner').items[0];
    const pro = relativizeDiagnoses(res(5, { confidence: 80 }), 'professional').items[0];
    expect(profileRelativeConfidence(beginner)).toBeLessThan(80);
    expect(profileRelativeConfidence(pro)).toBeGreaterThan(80);
  });

  it('clamps profile-relative confidence to 100', () => {
    const pro = relativizeDiagnoses(res(12, { confidence: 95 }), 'professional').items[0];
    expect(profileRelativeConfidence(pro)).toBeLessThanOrEqual(100);
  });

  it('picks the most-exceeded driver when both face and path are present', () => {
    // face 2° (within most levels), path 8° (far out). Path should govern.
    const item = relativizeDiagnoses(res(2, { clubPath: 8 }), 'advanced').items[0];
    expect(item.metric).toBe('club_path');
  });

  it('stays neutral (factor 1.0) when no swing-delivery metric is available', () => {
    const noMetric = {
      stats: {},
      diagnoses: [{ rule: { id: 'low_smash', name: 'Strike' }, confidence: 70, stats: {} }],
      primary: null, secondary: [],
    } as unknown as DiagnosticResult;
    const item = relativizeDiagnoses(noMetric, 'beginner').items[0];
    expect(item.metric).toBeNull();
    expect(item.relevanceFactor).toBe(1.0);
  });

  it('tightens tolerances monotonically from beginner to professional', () => {
    const levels: GolfSkillLevel[] = ['beginner', 'developing', 'intermediate', 'advanced', 'competitive', 'elite', 'professional'];
    for (let i = 1; i < levels.length; i++) {
      expect(PROFILE_TOLERANCES[levels[i]].faceToPath).toBeLessThanOrEqual(PROFILE_TOLERANCES[levels[i - 1]].faceToPath);
    }
  });
});

describe('#14 expanded club target windows', () => {
  it('now covers all seven club categories (was 3)', () => {
    for (const club of ['driver', 'fairway_wood', 'hybrid', 'long_iron', 'mid_iron', 'short_iron', 'wedge']) {
      expect(TARGET_WINDOWS[club]).toBeDefined();
      expect(TARGET_WINDOWS[club].face_to_path).toBeDefined();
      expect(TARGET_WINDOWS[club].smash_factor.ideal).toBeGreaterThan(1);
    }
  });

  it('reflects the driver→wedge gradient (irons strike down, woods less so)', () => {
    expect(TARGET_WINDOWS.short_iron.attack_angle.ideal).toBeLessThan(TARGET_WINDOWS.fairway_wood.attack_angle.ideal);
    expect(TARGET_WINDOWS.short_iron.spin_rate.ideal).toBeGreaterThan(TARGET_WINDOWS.long_iron.spin_rate.ideal);
  });
});
