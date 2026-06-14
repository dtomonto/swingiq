// ============================================================
// WS-03 — skill-tree generation unit tests
// Deterministic status transitions, honest handling of no-data (starter
// tree), evidence attachment, and coverage classification.
// ============================================================

import { deriveNodeStatus, buildSkillTree } from '../generate';
import type { SkillBranchState } from '@/lib/athletic-journey/types';

const branch = (over: Partial<SkillBranchState> = {}): SkillBranchState => ({
  id: 'b1',
  name: 'Swing path',
  category: 'technique',
  score: null,
  evidenceCount: 0,
  flagged: false,
  ...over,
});

describe('deriveNodeStatus', () => {
  it('is available with no score and no evidence (starter)', () => {
    expect(deriveNodeStatus({ score: null, evidenceCount: 0, flagged: false })).toBe('available');
  });
  it('is active with evidence but no score yet', () => {
    expect(deriveNodeStatus({ score: null, evidenceCount: 2, flagged: false })).toBe('active');
  });
  it('mastered at 80+, improving at 60+, active at 40+', () => {
    expect(deriveNodeStatus({ score: 85, evidenceCount: 3, flagged: false })).toBe('mastered');
    expect(deriveNodeStatus({ score: 65, evidenceCount: 3, flagged: false })).toBe('improving');
    expect(deriveNodeStatus({ score: 45, evidenceCount: 3, flagged: false })).toBe('active');
  });
  it('needs_attention when flagged or low', () => {
    expect(deriveNodeStatus({ score: 70, evidenceCount: 3, flagged: true })).toBe('needs_attention');
    expect(deriveNodeStatus({ score: 30, evidenceCount: 3, flagged: false })).toBe('needs_attention');
  });
  it('regressed wins over everything', () => {
    expect(deriveNodeStatus({ score: 90, evidenceCount: 5, flagged: false, regressed: true })).toBe('regressed');
  });
});

describe('buildSkillTree', () => {
  it('produces a starter tree (all available) with no data', () => {
    const tree = buildSkillTree({
      sport: 'golf',
      branches: [branch({ id: 'a' }), branch({ id: 'b', name: 'Contact' })],
    });
    expect(tree.coverage).toBe('starter');
    expect(tree.nodes.every((n) => n.status === 'available')).toBe(true);
    expect(tree.nodes[0].progressScore).toBeNull();
    expect(tree.nodes[0].confidenceScore).toBeNull();
  });

  it('maps scored branches to status + level + evidence, and flags coverage', () => {
    const tree = buildSkillTree({
      sport: 'golf',
      branches: [
        branch({ id: 'a', score: 82, evidenceCount: 4 }),
        branch({ id: 'b', name: 'Contact', score: 35, evidenceCount: 2, flagged: true }),
      ],
      categoryScores: [{ category: 'technique', score: 60, confidence: 0.8, basis: 'analyzed', signalCount: 4 }],
      now: '2026-06-13T00:00:00.000Z',
    });
    const a = tree.nodes.find((n) => n.id === 'a')!;
    const b = tree.nodes.find((n) => n.id === 'b')!;
    expect(a.status).toBe('mastered');
    expect(a.level).toBe(4);
    expect(a.confidenceScore).toBe(0.8);
    expect(a.evidence.lastUpdatedAt).toBe('2026-06-13T00:00:00.000Z');
    expect(b.status).toBe('needs_attention');
    expect(tree.coverage).toBe('rich');
  });

  it('marks a node regressed when its category is regressing', () => {
    const tree = buildSkillTree({
      sport: 'golf',
      branches: [branch({ id: 'a', score: 75, evidenceCount: 3 })],
      regressedCategories: ['technique'],
    });
    expect(tree.nodes[0].status).toBe('regressed');
  });
});
