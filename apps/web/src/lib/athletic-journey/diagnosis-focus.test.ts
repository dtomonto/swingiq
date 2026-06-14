// ============================================================
// Diagnosis → skill-tree focus mapping tests
// ============================================================

import { diagnosisToSkillCategory } from './diagnosis-focus';
import { analyzeDeterministicSession } from '@/lib/intelligence/diagnose';

describe('diagnosisToSkillCategory', () => {
  it('maps a swing-mechanic fault to technique', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice' });
    expect(diagnosisToSkillCategory(d)).toBe('technique');
  });

  it('maps a footwork/movement fault to movement', () => {
    const d = analyzeDeterministicSession({ sport: 'tennis', issue: 'footwork' });
    expect(diagnosisToSkillCategory(d)).toBe('movement');
  });

  it('maps a serve fault to finesse', () => {
    const d = analyzeDeterministicSession({ sport: 'tennis', issue: 'weak_serve' });
    expect(diagnosisToSkillCategory(d)).toBe('finesse');
  });

  it('maps a pressure/mental fault to mental', () => {
    const d = analyzeDeterministicSession({ sport: 'tennis', issue: 'under_pressure' });
    expect(diagnosisToSkillCategory(d)).toBe('mental');
  });

  it('always returns a valid category', () => {
    const valid = new Set(['scoring', 'technique', 'consistency', 'finesse', 'movement', 'tactical', 'practice', 'mental', 'competitive']);
    for (const issue of ['fat', 'hook', 'pop_up', 'late', 'net_errors']) {
      const d = analyzeDeterministicSession({ sport: 'golf', issue });
      expect(valid.has(diagnosisToSkillCategory(d))).toBe(true);
    }
  });
});
