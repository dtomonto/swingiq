// ============================================================
// Claude Handoff — prompt builder (isomorphic, pure)
// ------------------------------------------------------------
// Turns a normalized ClaudeFixInput into a ready-to-paste Claude Code fix
// prompt (markdown). The owner copies it from any alert/finding and pastes
// it straight into Claude Code, which then locates the code and fixes it.
//
// Pure string work — no DOM, no clipboard, no fetch. The clipboard/download
// wrapper is the client component ./../../components/admin/CopyForClaude.tsx.
// ============================================================

import type { ClaudeFixInput } from './types';

/** The closing instruction that makes the pasted text actionable in Claude Code. */
const TASK_FOOTER =
  'Please fix this in the SwingVantage codebase (the Next.js app lives in `apps/web`). ' +
  'Find the relevant code, make the change, then verify with `npx tsc --noEmit` and any related tests. ' +
  'Tell me which files you changed and why.';

function section(heading: string, body: string | undefined): string[] {
  const text = (body ?? '').trim();
  if (!text) return [];
  return [`## ${heading}`, text, ''];
}

function bulletSection(heading: string, items: string[] | undefined): string[] {
  const list = (items ?? []).map((i) => i.trim()).filter(Boolean);
  if (list.length === 0) return [];
  return [`## ${heading}`, ...list.map((i) => `- ${i}`), ''];
}

function numberedSection(heading: string, items: string[] | undefined): string[] {
  const list = (items ?? []).map((i) => i.trim()).filter(Boolean);
  if (list.length === 0) return [];
  return [`## ${heading}`, ...list.map((i, n) => `${n + 1}. ${i}`), ''];
}

/** Build one paste-ready Claude Code fix prompt for a single issue. */
export function buildClaudePrompt(input: ClaudeFixInput): string {
  const meta = [
    `**Source:** ${input.source}`,
    input.severity ? `**Severity:** ${input.severity}` : null,
    input.href ? `**Admin reference:** ${input.href}` : null,
  ].filter(Boolean) as string[];

  const fieldLines = (input.fields ?? [])
    .filter((f) => f.value != null && String(f.value).trim() !== '' && String(f.value).trim() !== '—')
    .map((f) => `- **${f.label}:** ${String(f.value).trim()}`);

  const lines: string[] = [
    `# Fix: ${input.title}`,
    '',
    ...meta,
    '',
    ...section('Problem', input.problem),
    ...bulletSection('Affected', input.affected),
    ...section('Recommended fix', input.recommendation),
    ...numberedSection('Steps', input.steps),
  ];

  if (fieldLines.length > 0) {
    lines.push('## Details', ...fieldLines, '');
  }

  lines.push('---', TASK_FOOTER);

  // Collapse any accidental triple-blank runs and trim trailing whitespace.
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Build one document bundling many issues (for a "Copy all / Download all"). */
export function buildClaudeBundle(title: string, items: ClaudeFixInput[]): string {
  const header = [
    `# ${title}`,
    '',
    `${items.length} item${items.length === 1 ? '' : 's'} to fix, in priority order. ` +
      'Each section below is a self-contained task — work them top-down.',
    '',
  ];
  const body = items.map((item, i) => {
    // Demote the per-item H1 to H2 so the bundle is one coherent document.
    const prompt = buildClaudePrompt(item).replace(/^# /, '## ');
    return `${i > 0 ? '\n---\n\n' : ''}${prompt}`;
  });
  return [...header, ...body].join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** A filesystem-safe, dated filename for a downloaded prompt/bundle. */
export function promptFilename(title: string, opts?: { dateIso?: string; bundle?: boolean }): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'report';
  const date = (opts?.dateIso ?? '').slice(0, 10);
  const stamp = date ? `-${date}` : '';
  const kind = opts?.bundle ? 'claude-fixes' : 'claude-fix';
  return `${kind}-${slug}${stamp}.md`;
}
