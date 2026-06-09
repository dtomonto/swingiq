// ============================================================
// BranchGuardianOS — protected-branch rules (PURE)
// ------------------------------------------------------------
// Decides whether a branch is protected and therefore must NEVER be a deletion
// candidate. Combines the always-on set (main/master/production/staging/develop
// + release/* + hotfix/*) with admin-configured patterns. PURE + deterministic.
//
// Patterns support a trailing "/*" wildcard (e.g. "release/*") and exact names.
// ============================================================

import { ALWAYS_PROTECTED } from './types';

/** Compile a simple glob-ish pattern (exact, or prefix with trailing /*). */
function patternMatches(pattern: string, name: string): boolean {
  const p = pattern.trim();
  if (!p) return false;
  if (p.endsWith('/*')) {
    const prefix = p.slice(0, -1); // keep the trailing slash → "release/"
    return name.startsWith(prefix);
  }
  if (p.endsWith('*')) {
    return name.startsWith(p.slice(0, -1));
  }
  return name.toLowerCase() === p.toLowerCase();
}

/**
 * True when `name` is protected by the always-on set or any extra pattern.
 * `mainBranch` is always protected even if it isn't in the standard list.
 */
export function isProtectedBranch(
  name: string,
  mainBranch: string | null,
  extraPatterns: string[] = [],
): boolean {
  if (mainBranch && name === mainBranch) return true;
  const all = [...ALWAYS_PROTECTED, ...extraPatterns];
  return all.some((p) => patternMatches(p, name));
}
