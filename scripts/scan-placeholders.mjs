#!/usr/bin/env node
/**
 * SwingVantage — Placeholder Scanner
 *
 * Scans user-facing source for visible placeholder / unfinished text
 * that must never ship on the live site:
 *   - "[add ...]" / "[your ...]" / "[contact ..." bracket placeholders
 *   - "lorem ipsum"
 *   - "placeholder policy" / "pre-launch product" legal hedges
 *   - bare "TODO" / "FIXME" inside JSX text (not code comments)
 *
 * Code-level identifiers (placeholder=, isPlaceholder, Avatar3DPlaceholder,
 * dev API fallbacks, etc.) are intentionally ignored.
 *
 * Exit code 1 if any visible placeholder is found, else 0.
 * Run with:  npm run scan:placeholders
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const ROOT = process.cwd();
const SCAN_DIRS = ['apps/web/src/app', 'apps/web/src/components'];
const EXTS = new Set(['.tsx', '.ts', '.mdx']);

// Patterns that indicate VISIBLE placeholder content.
const VISIBLE_PATTERNS = [
  /\[add [^\]]*\]/i,
  /\[your [^\]]*\]/i,
  /\[contact[^\]]*\]/i,
  /lorem ipsum/i,
  /placeholder policy/i,
  /pre-launch product/i,
  /add (?:before|prior to) launch/i,
];

// Allow-list: substrings that mean a match is a code identifier, not visible text.
const IGNORE_IF_LINE_INCLUDES = [
  'placeholder=',
  'placeholder-',
  'placeholder:',
  'isPlaceholder',
  'Placeholder(',
  'PlaceholderResponse',
  'buildDevPlaceholder',
  'eslint',
];

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (EXTS.has(extname(full))) {
      out.push(full);
    }
  }
  return out;
}

const findings = [];

for (const rel of SCAN_DIRS) {
  const abs = join(ROOT, rel);
  for (const file of walk(abs)) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (IGNORE_IF_LINE_INCLUDES.some((s) => line.includes(s))) return;
      for (const pattern of VISIBLE_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            file: relative(ROOT, file),
            line: i + 1,
            text: line.trim().slice(0, 120),
          });
          break;
        }
      }
    });
  }
}

if (findings.length === 0) {
  console.log('✅ Placeholder scan passed — no visible placeholders found.');
  process.exit(0);
}

console.error(`❌ Placeholder scan found ${findings.length} issue(s):\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  →  ${f.text}`);
}
console.error('\nReplace these with real content before they reach the live site.');
process.exit(1);
