#!/usr/bin/env node
/**
 * SwingIQ — Growth content validation.
 *   - content/growth/seo-backlog.json: required fields + valid enums.
 *   - content/emails/*.md: must have frontmatter id + subject.
 *
 * Exit 1 on any failure. Run: npm run validate:content
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { walk } from './lib/fsutil.mjs';

const ROOT = process.cwd();
const errors = [];

// ── seo-backlog.json ───────────────────────────────────────────
const backlogPath = join(ROOT, 'content/growth/seo-backlog.json');
if (!existsSync(backlogPath)) {
  errors.push('Missing content/growth/seo-backlog.json');
} else {
  let data;
  try { data = JSON.parse(readFileSync(backlogPath, 'utf8')); }
  catch (e) { errors.push('seo-backlog.json is not valid JSON: ' + e.message); }
  if (data) {
    const intents = new Set(['informational', 'commercial', 'transactional']);
    const stages = new Set(['awareness', 'consideration', 'conversion']);
    const statuses = new Set(['backlog', 'drafting', 'published']);
    const required = ['keyword', 'sport', 'intent', 'funnelStage', 'priority', 'slug', 'cta', 'status'];
    (data.items || []).forEach((it, i) => {
      required.forEach((f) => { if (it[f] === undefined || it[f] === '') errors.push(`backlog item ${i} missing "${f}"`); });
      if (it.intent && !intents.has(it.intent)) errors.push(`backlog item ${i} invalid intent "${it.intent}"`);
      if (it.funnelStage && !stages.has(it.funnelStage)) errors.push(`backlog item ${i} invalid funnelStage "${it.funnelStage}"`);
      if (it.status && !statuses.has(it.status)) errors.push(`backlog item ${i} invalid status "${it.status}"`);
    });
  }
}

// ── email templates ────────────────────────────────────────────
const emailDir = join(ROOT, 'content/emails');
const emails = walk(emailDir, ['.md']);
if (emails.length === 0) errors.push('No email templates found in content/emails');
for (const f of emails) {
  const txt = readFileSync(f, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(txt);
  if (!fm) { errors.push(`${f} has no frontmatter`); continue; }
  if (!/\bid:\s*\S/.test(fm[1])) errors.push(`${f} frontmatter missing id`);
  if (!/\bsubject:\s*\S/.test(fm[1])) errors.push(`${f} frontmatter missing subject`);
}

if (errors.length) {
  console.error(`❌ Content validation failed (${errors.length}):\n`);
  errors.forEach((e) => console.error('  • ' + e));
  process.exit(1);
}
console.log(`✅ Content validation passed — backlog + ${emails.length} email templates valid.`);
