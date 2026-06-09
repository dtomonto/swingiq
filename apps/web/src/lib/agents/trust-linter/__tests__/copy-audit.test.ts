// ============================================================
// SwingVantage — Trust / Honesty Linter — CI Copy Gate
// ------------------------------------------------------------
// Runs in the normal jest suite (so it's already in CI via
// `npm test`) and FAILS the build if user-facing copy in the
// scanned scope contains a blocking overclaim (guarantee, medical
// claim, misleading "local-only", etc.).
//
// Scope is deliberately curated to stable, high-signal copy. Expand
// SCAN_DIRS as more surfaces are confirmed clean.
// ============================================================

import fs from 'fs';
import path from 'path';
import { auditSources, formatAuditReport } from '../audit';

// src/ root (…/src/lib/agents/trust-linter/__tests__ → up 4).
const SRC = path.resolve(__dirname, '../../../../');

// User-facing COPY surfaces only. Agent/engine source (lib/agents/**) is
// intentionally excluded: it legitimately contains words like "guarantee" or
// "treat" as detection keywords / logic, which are not claims shown to users.
const SCAN_DIRS = [
  'components/growth', // the growth UI copy (this work)
  'data', // product content: drills, blog posts, etc.
];

const EXTS = ['.ts', '.tsx', '.md', '.json'];

// Internal release notes / changelogs are dev-facing, not marketing claims.
const EXCLUDE_FILE = /(devUpdates|auto-updates|^updates)\.(ts|json)$/i;

function walk(dir: string, acc: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // dir may not exist in this scope — skip honestly
  }
  for (const e of entries) {
    if (e.name === '__tests__' || e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (EXTS.some((x) => e.name.endsWith(x)) && !EXCLUDE_FILE.test(e.name)) acc.push(p);
  }
}

function collect(): Array<{ path: string; source: string }> {
  const files: string[] = [];
  for (const d of SCAN_DIRS) walk(path.join(SRC, d), files);
  return files.map((p) => ({ path: path.relative(SRC, p), source: fs.readFileSync(p, 'utf8') }));
}

describe('trust linter — CI copy gate', () => {
  it('finds no blocking overclaims in scanned user-facing copy', () => {
    const entries = collect();
    // Guard against a vacuous pass if the scan scope ever breaks.
    expect(entries.length).toBeGreaterThan(0);

    const report = auditSources(entries);
    if (report.hasBlocking) {
      // Surface exactly where, so the failure is actionable.
      console.error(formatAuditReport(report));
    }
    expect(report.hasBlocking).toBe(false);
  });
});
