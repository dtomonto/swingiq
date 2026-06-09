// ============================================================
// BranchGuardianOS — branch naming governance (PURE)
// ------------------------------------------------------------
// Classifies a branch name into a BranchType and validates it against the
// recommended convention: <type>/<system-or-scope>-<description>. PURE +
// deterministic — feed a name, get a type + whether it conforms + why.
//
// The convention is advisory: non-conforming branches are FLAGGED (a low-sev
// naming recommendation), never blocked or auto-renamed.
// ============================================================

import type { BranchType } from './types';
import { NAMING_PREFIXES } from './types';

/** Map a raw branch name to its BranchType from the leading prefix. */
export function classifyBranchType(name: string, mainBranch: string | null): BranchType {
  if (mainBranch && name === mainBranch) return 'main';
  if (/^(main|master|production|staging|develop)$/i.test(name)) return 'main';
  const prefix = name.includes('/') ? name.slice(0, name.indexOf('/')).toLowerCase() : '';
  switch (prefix) {
    case 'feature':
    case 'feat':
      return 'feature';
    case 'fix':
    case 'bugfix':
      return 'fix';
    case 'chore':
      return 'chore';
    case 'hotfix':
      return 'hotfix';
    case 'experiment':
    case 'exp':
    case 'spike':
      return 'experiment';
    case 'release':
      return 'release';
    case 'docs':
    case 'doc':
      return 'docs';
    case 'refactor':
      return 'refactor';
    case 'backup':
      return 'backup';
    case 'integration':
    case 'integrate':
      return 'integration';
    default:
      return 'other';
  }
}

export interface NamingVerdict {
  conforms: boolean;
  type: BranchType;
  reason: string;
}

/**
 * Validate a branch name against the convention. Main/protected-style names are
 * exempt. A conforming name is "<known-prefix>/<kebab description>".
 */
export function validateBranchName(name: string, mainBranch: string | null): NamingVerdict {
  const type = classifyBranchType(name, mainBranch);
  if (type === 'main') {
    return { conforms: true, type, reason: 'Trunk/long-lived branch — exempt from the convention.' };
  }

  if (!name.includes('/')) {
    return {
      conforms: false,
      type,
      reason: `No "<type>/" prefix. Use one of: ${NAMING_PREFIXES.join(', ')} (e.g. feature/${slugifyHint(name)}).`,
    };
  }

  const [prefix, ...rest] = name.split('/');
  const description = rest.join('/');
  const knownPrefix = (NAMING_PREFIXES as string[]).includes(prefix.toLowerCase());

  if (!knownPrefix) {
    return {
      conforms: false,
      type,
      reason: `"${prefix}/" is not a recommended prefix. Use one of: ${NAMING_PREFIXES.join(', ')}.`,
    };
  }
  if (description.trim().length < 3) {
    return { conforms: false, type, reason: 'Description after the prefix is too short to be meaningful.' };
  }
  // Encourage kebab-case, but only WARN — underscores/slashes are tolerated.
  if (/[A-Z ]/.test(description)) {
    return { conforms: false, type, reason: 'Use lowercase kebab-case after the prefix (no spaces or capitals).' };
  }
  return { conforms: true, type, reason: 'Follows the <type>/<description> convention.' };
}

/** Best-effort kebab hint for an example rename suggestion. */
function slugifyHint(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'short-description'
  );
}
