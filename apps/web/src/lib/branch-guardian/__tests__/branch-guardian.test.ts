// ============================================================
// BranchGuardianOS — unit tests (pure engine + RBAC gating)
// ------------------------------------------------------------
// Covers naming governance, protected-branch rules, branch/worktree scoring,
// recommendation generation (merged/stale/abandoned/diverged/no-upstream/risky-
// untracked), the safe-command generator's injection refusal, the pure scan
// over a fixture snapshot, empty/missing-snapshot handling, and the
// `devops.manage` access gate. All pure — no server-only imports.
// ============================================================

import { classifyBranchType, validateBranchName } from '../naming';
import { isProtectedBranch } from '../protected';
import { daysSince, healthBand, scoreBranch, scoreWorktree, type ScoreContext } from '../scoring';
import { deriveRecommendations, rankRecommendations, summarizeRecommendations } from '../recommendations';
import { mergedCleanupCommands, inspectionCommands, remotePruneCommands } from '../commands';
import { scanSnapshot, snapshotFreshness } from '../scan';
import { DEFAULT_SETTINGS } from '../types';
import type {
  BranchGuardianSnapshot, Recommendation, SnapshotBranch, SnapshotWorktree,
} from '../types';
import { PERMISSIONS, ROLES, roleHasPermission } from '@/lib/admin/rbac';

const NOW = '2026-06-08T12:00:00.000Z';
const NOW_DATE = new Date(NOW);
const daysAgo = (n: number) => new Date(NOW_DATE.getTime() - n * 86_400_000).toISOString();

function branch(partial: Partial<SnapshotBranch> = {}): SnapshotBranch {
  return {
    name: 'feature/x-y',
    lastCommitISO: NOW,
    author: 'Dev',
    subject: 'do a thing',
    sha: 'abc1234',
    upstream: 'origin/feature/x-y',
    upstreamGone: false,
    aheadOfMain: 1,
    behindMain: 0,
    merged: false,
    isCurrent: false,
    hasWorktree: false,
    worktreePath: null,
    ...partial,
  };
}

function worktree(partial: Partial<SnapshotWorktree> = {}): SnapshotWorktree {
  return {
    path: '../wt',
    branch: 'feature/x-y',
    head: 'abc1234',
    isPrimary: false,
    isCurrent: false,
    locked: false,
    prunable: false,
    missingPath: false,
    dirty: { modified: 0, untracked: 0, untrackedRisky: [] },
    ...partial,
  };
}

function snap(partial: Partial<BranchGuardianSnapshot> = {}): BranchGuardianSnapshot {
  return {
    schemaVersion: 1,
    generatedAt: NOW,
    git: true,
    mainBranch: 'main',
    currentBranch: 'main',
    inProgressOp: null,
    currentDirty: null,
    branches: [],
    remoteBranches: [],
    remoteBranchCount: 0,
    worktrees: [],
    stashes: [],
    stashCount: 0,
    ...partial,
  };
}

function ctxFor(snapshot: BranchGuardianSnapshot): ScoreContext {
  return {
    now: NOW,
    mainBranch: snapshot.mainBranch,
    settings: DEFAULT_SETTINGS,
    branchByName: new Map(snapshot.branches.map((b) => [b.name, b])),
    worktrees: snapshot.worktrees,
  };
}

describe('naming governance', () => {
  it('classifies the leading prefix into a BranchType', () => {
    expect(classifyBranchType('feature/foo', 'main')).toBe('feature');
    expect(classifyBranchType('fix/bar', 'main')).toBe('fix');
    expect(classifyBranchType('experiment/spike', 'main')).toBe('experiment');
    expect(classifyBranchType('master', 'main')).toBe('main');
    expect(classifyBranchType('trunk', 'trunk')).toBe('main');
    expect(classifyBranchType('random-thing', 'main')).toBe('other');
  });

  it('accepts conforming names and flags violations', () => {
    expect(validateBranchName('feature/branchguardianos-admin-dashboard', 'main').conforms).toBe(true);
    expect(validateBranchName('main', 'main').conforms).toBe(true); // trunk exempt
    expect(validateBranchName('noprefix', 'main').conforms).toBe(false);
    expect(validateBranchName('wip/stuff', 'main').conforms).toBe(false); // unknown prefix
    expect(validateBranchName('feature/Has-Capitals', 'main').conforms).toBe(false);
  });
});

describe('protected branches', () => {
  it('protects the always-on set, the main branch and custom patterns', () => {
    expect(isProtectedBranch('master', 'main')).toBe(true);
    expect(isProtectedBranch('main', 'main')).toBe(true);
    expect(isProtectedBranch('release/1.2', 'main')).toBe(true);
    expect(isProtectedBranch('hotfix/urgent', 'main')).toBe(true);
    expect(isProtectedBranch('feature/x', 'main')).toBe(false);
    expect(isProtectedBranch('integration/all', 'main', ['integration/*'])).toBe(true);
  });
});

describe('scoring primitives', () => {
  it('daysSince returns null for unreadable dates and whole days otherwise', () => {
    expect(daysSince(null, NOW)).toBeNull();
    expect(daysSince(daysAgo(10), NOW)).toBe(10);
  });

  it('maps health values to bands', () => {
    expect(healthBand(95)).toBe('excellent');
    expect(healthBand(75)).toBe('healthy');
    expect(healthBand(55)).toBe('attention');
    expect(healthBand(30)).toBe('stale');
    expect(healthBand(10)).toBe('high_risk');
  });
});

describe('branch scoring', () => {
  it('marks an old, unmerged branch stale and lowers its health', () => {
    const s = snap({ branches: [branch({ name: 'feature/old', lastCommitISO: daysAgo(20) })] });
    const sb = scoreBranch(s.branches[0], ctxFor(s));
    expect(sb.status).toBe('stale');
    expect(sb.health.value).toBeLessThan(90);
    expect(sb.risk).not.toBe('low');
  });

  it('marks a very old branch abandoned', () => {
    const s = snap({ branches: [branch({ name: 'feature/dead', lastCommitISO: daysAgo(120) })] });
    expect(scoreBranch(s.branches[0], ctxFor(s)).status).toBe('abandoned');
  });

  it('keeps protected branches low-risk and high-health', () => {
    const s = snap({ branches: [branch({ name: 'master', merged: true, lastCommitISO: daysAgo(60) })] });
    const sb = scoreBranch(s.branches[0], ctxFor(s));
    expect(sb.isProtected).toBe(true);
    expect(sb.risk).toBe('low');
  });

  it('flags a branch far behind main', () => {
    const s = snap({ branches: [branch({ name: 'feature/behind', behindMain: 90, aheadOfMain: 3 })] });
    const sb = scoreBranch(s.branches[0], ctxFor(s));
    expect(sb.status).toBe('diverged');
    expect(sb.health.factors.some((f) => /behind main/.test(f.label))).toBe(true);
  });
});

describe('worktree scoring', () => {
  it('penalizes a missing-path worktree heavily and marks it high-risk', () => {
    const s = snap({ worktrees: [worktree({ path: '../gone', missingPath: true, dirty: null })] });
    const sw = scoreWorktree(s.worktrees[0], ctxFor(s));
    expect(sw.risk).toBe('high');
    expect(sw.health.value).toBeLessThan(50);
  });

  it('flags risky untracked files as high risk', () => {
    const s = snap({
      worktrees: [worktree({ dirty: { modified: 0, untracked: 1, untrackedRisky: [{ path: '.env.local', kind: 'env-file' }] } })],
    });
    expect(scoreWorktree(s.worktrees[0], ctxFor(s)).risk).toBe('high');
  });
});

describe('recommendations', () => {
  function recsFor(snapshot: BranchGuardianSnapshot): Recommendation[] {
    const ctx = ctxFor(snapshot);
    const branches = snapshot.branches.map((b) => scoreBranch(b, ctx));
    const worktrees = snapshot.worktrees.map((w) => scoreWorktree(w, ctx));
    return deriveRecommendations(branches, worktrees, { snapshot, settings: DEFAULT_SETTINGS });
  }

  it('recommends deleting a merged branch with a gated destructive command', () => {
    const recs = recsFor(snap({ branches: [branch({ name: 'feature/done', merged: true })] }));
    const merged = recs.find((r) => r.kind === 'merged_cleanup');
    expect(merged).toBeDefined();
    expect(merged!.approvalRequired).toBe(true);
    expect(merged!.commands.some((c) => c.safety === 'destructive')).toBe(true);
    expect(merged!.recovery.length).toBeGreaterThan(0);
  });

  it('never recommends deleting a protected branch', () => {
    const recs = recsFor(snap({ branches: [branch({ name: 'master', merged: true })] }));
    expect(recs.some((r) => r.kind === 'merged_cleanup')).toBe(false);
  });

  it('flags risky untracked files at high severity and links to securityOS', () => {
    const recs = recsFor(snap({
      worktrees: [worktree({ dirty: { modified: 0, untracked: 1, untrackedRisky: [{ path: '.env', kind: 'env-file' }] } })],
    }));
    const risky = recs.find((r) => r.kind === 'risky_untracked');
    expect(risky).toBeDefined();
    expect(risky!.severity).toBe('high');
    expect(risky!.relatedLinks.some((l) => l.href === '/admin/security-os')).toBe(true);
  });

  it('recommends publishing a branch with no upstream', () => {
    const recs = recsFor(snap({ branches: [branch({ name: 'feature/local', upstream: null, aheadOfMain: 4 })] }));
    expect(recs.some((r) => r.kind === 'no_upstream')).toBe(true);
  });

  it('flags an in-progress operation as high severity', () => {
    const recs = recsFor(snap({ inProgressOp: 'rebase', currentBranch: 'feature/x-y' }));
    const op = recs.find((r) => r.kind === 'in_progress_op');
    expect(op?.severity).toBe('high');
  });

  it('ranks higher-priority recommendations first', () => {
    const recs = recsFor(snap({
      inProgressOp: 'merge',
      branches: [branch({ name: 'feature/done', merged: true })],
    }));
    const sorted = rankRecommendations(recs);
    expect(sorted[0].priority).toBeGreaterThanOrEqual(sorted[sorted.length - 1].priority);
  });

  it('summarizes counts including destructive items', () => {
    const recs = recsFor(snap({ branches: [branch({ name: 'feature/done', merged: true })] }));
    const sum = summarizeRecommendations(recs);
    expect(sum.total).toBe(recs.length);
    expect(sum.destructive).toBeGreaterThanOrEqual(1);
  });
});

describe('safe command generator', () => {
  it('quotes paths with spaces and refuses shell metacharacters', () => {
    expect(inspectionCommands('feat/a b')[0].command).toContain('"feat/a b"');
    expect(mergedCleanupCommands('evil"name')).toEqual([]); // refused → no commands
  });

  it('offers a dry-run before any pruning', () => {
    const cmds = remotePruneCommands();
    expect(cmds.some((c) => c.safety === 'dry-run')).toBe(true);
  });

  it('merged cleanup leads with read-only/backup before the destructive delete', () => {
    const cmds = mergedCleanupCommands('feature/done');
    const destructiveIdx = cmds.findIndex((c) => c.safety === 'destructive');
    expect(destructiveIdx).toBeGreaterThan(0); // not first
    expect(cmds[0].safety).toBe('read-only');
  });
});

describe('scan assembly', () => {
  it('scores a populated snapshot end-to-end', () => {
    const s = snap({
      branches: [
        branch({ name: 'master', merged: true, isCurrent: true, lastCommitISO: NOW }),
        branch({ name: 'feature/done', merged: true }),
        branch({ name: 'feature/stale', lastCommitISO: daysAgo(40) }),
      ],
      worktrees: [worktree({ path: '.', branch: 'master', isPrimary: true, isCurrent: true })],
    });
    const result = scanSnapshot(s, DEFAULT_SETTINGS, NOW_DATE);
    expect(result.isGitRepo).toBe(true);
    expect(result.branches).toHaveLength(3);
    expect(result.cleanliness.value).toBeGreaterThanOrEqual(0);
    expect(result.cleanliness.value).toBeLessThanOrEqual(100);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('honors a main-branch override from settings', () => {
    const s = snap({ mainBranch: 'master', branches: [branch({ name: 'develop' })] });
    const result = scanSnapshot(s, { ...DEFAULT_SETTINGS, mainBranchOverride: 'trunk' }, NOW_DATE);
    expect(result.mainBranch).toBe('trunk');
  });

  it('handles an empty / non-git snapshot without throwing', () => {
    const result = scanSnapshot(snap({ git: false, mainBranch: null }), DEFAULT_SETTINGS, NOW_DATE);
    expect(result.isGitRepo).toBe(false);
    expect(result.branches).toHaveLength(0);
    expect(result.recommendations).toHaveLength(0);
  });

  it('reports snapshot freshness + staleness', () => {
    expect(snapshotFreshness(snap({ generatedAt: NOW }), NOW_DATE).ageHours).toBe(0);
    expect(snapshotFreshness(snap({ generatedAt: daysAgo(40) }), NOW_DATE).stale).toBe(true);
    expect(snapshotFreshness(snap({ generatedAt: '' }), NOW_DATE).stale).toBe(true);
  });
});

describe('RBAC gating', () => {
  it('defines the devops.manage permission', () => {
    expect(PERMISSIONS).toContain('devops.manage');
  });

  it('grants devops.manage to super_admin and admin, not read_only', () => {
    expect(roleHasPermission('super_admin', 'devops.manage')).toBe(true);
    expect(roleHasPermission('admin', 'devops.manage')).toBe(true);
    expect(roleHasPermission('read_only', 'devops.manage')).toBe(false);
    expect(ROLES.read_only.permissions).not.toContain('devops.manage');
  });
});
