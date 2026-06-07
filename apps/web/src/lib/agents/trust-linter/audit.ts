// ============================================================
// SwingVantage — Trust / Honesty Linter — Copy Audit
// ------------------------------------------------------------
// Extracts user-facing copy from source files and runs it through
// the linter, so a CI gate (a jest test) or a script can fail the
// build on blocking overclaims. Pure (operates on file CONTENTS,
// not the filesystem) so it is easy to unit-test; the caller
// supplies the files it walked.
// ============================================================

import { lintCopy } from './engine';
import type { LintFinding } from './types';

export interface CopyHit {
  text: string;
  findings: LintFinding[];
}

export interface FileAudit {
  path: string;
  hits: CopyHit[];
  errorCount: number;
  warningCount: number;
}

export interface AuditReport {
  files: FileAudit[];
  errorCount: number;
  warningCount: number;
  hasBlocking: boolean;
}

const PATHISH = /^(@\/|\.\.?\/|\/|https?:|mailto:|[a-z]+:\/\/|#|data:)/i;
const TAILWIND = /(flex|grid|text-|bg-|rounded|px-|py-|gap-|border|font-|items-|justify-|w-|h-|mt-|mb-|ml-|mr-|space-|shadow|ring-|hover:|sm:|md:|lg:)/;

/**
 * Pull candidate user-facing phrases out of a TS/TSX/MD/JSON source: quoted
 * + template strings and JSX text of real-sentence length. Filters out paths,
 * URLs, and Tailwind class lists so the linter only sees actual copy.
 */
export function extractCopyStrings(source: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const consider = (rawIn: string) => {
    const s = rawIn.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (s.length < 12) return;
    if (!/[a-zA-Z]/.test(s)) return;
    if (!/\s/.test(s)) return; // must be a phrase, not an identifier
    if (PATHISH.test(s)) return;
    // class-list heuristic: looks like code tokens AND contains Tailwind atoms
    if (/^[\w\s:/\-[\].%#()]+$/.test(s) && TAILWIND.test(s)) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  // Quoted + template string literals (12+ chars).
  const str = /(['"`])((?:\\.|(?!\1)[\s\S]){12,}?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = str.exec(source)) !== null) consider(m[2]);

  // JSX text between tags.
  const jsx = />\s*([^<>{}][^<>{}]{11,})</g;
  while ((m = jsx.exec(source)) !== null) consider(m[1]);

  return out;
}

/** Audit one file's contents. */
export function auditSource(path: string, source: string): FileAudit {
  const hits: CopyHit[] = [];
  for (const text of extractCopyStrings(source)) {
    const findings = lintCopy(text);
    if (findings.length) hits.push({ text, findings });
  }
  const errorCount = hits.reduce((n, h) => n + h.findings.filter((f) => f.severity === 'error').length, 0);
  const warningCount = hits.reduce((n, h) => n + h.findings.filter((f) => f.severity === 'warning').length, 0);
  return { path, hits, errorCount, warningCount };
}

/** Audit many files (each already read into memory). Only files with hits are kept. */
export function auditSources(entries: Array<{ path: string; source: string }>): AuditReport {
  const files = entries.map((e) => auditSource(e.path, e.source)).filter((f) => f.hits.length > 0);
  const errorCount = files.reduce((n, f) => n + f.errorCount, 0);
  const warningCount = files.reduce((n, f) => n + f.warningCount, 0);
  return { files, errorCount, warningCount, hasBlocking: errorCount > 0 };
}

/** Render a short, human-readable report (for CI logs). */
export function formatAuditReport(report: AuditReport): string {
  if (report.files.length === 0) return '✓ Trust linter: no copy issues found.';
  const lines: string[] = [
    `Trust linter: ${report.errorCount} blocking, ${report.warningCount} warnings across ${report.files.length} file(s).`,
  ];
  for (const f of report.files) {
    lines.push(`\n${f.path}`);
    for (const h of f.hits) {
      for (const fd of h.findings) {
        lines.push(`  [${fd.severity}] ${fd.ruleId}: "${fd.match}" — ${fd.message}`);
      }
    }
  }
  return lines.join('\n');
}
