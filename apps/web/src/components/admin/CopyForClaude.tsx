'use client';

// ============================================================
// CopyForClaude — hand any admin alert/finding to Claude Code
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Every alert/finding can be turned into a ready-to-paste fix prompt. This
//   gives the owner two buttons: "Copy for Claude Code" (clipboard) and a
//   download to a .md file. Paste it into Claude Code and it fixes the issue.
//
//   The text is built by the pure ./../../lib/admin/claude-handoff builder;
//   this component only handles the clipboard + download side-effects.
// ============================================================

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import {
  buildClaudePrompt,
  buildClaudeBundle,
  promptFilename,
  type ClaudeFixInput,
} from '@/lib/admin/claude-handoff';

function downloadMarkdown(text: string, filename: string): void {
  try {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* download blocked — the copy button still works */
  }
}

const BTN =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-2xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-link';

/** Single-issue copy + download. Drop next to any alert/finding. */
export function CopyForClaude({
  input,
  label = 'Copy for Claude Code',
  withDownload = true,
}: {
  input: ClaudeFixInput;
  label?: string;
  withDownload?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const text = buildClaudePrompt(input);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          copy();
        }}
        aria-label={`${label}: ${input.title}`}
        className={BTN}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-success-text" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> {label}
          </>
        )}
      </button>
      {withDownload && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            downloadMarkdown(text, promptFilename(input.title));
          }}
          aria-label={`Download fix prompt for ${input.title}`}
          title="Download as .md"
          className={BTN}
        >
          <Download className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/** Bundle copy + download for a whole list (Copy all / Download all). */
export function CopyForClaudeBundle({
  items,
  title,
  label,
  dateIso,
}: {
  items: ClaudeFixInput[];
  title: string;
  label?: string;
  dateIso?: string;
}) {
  const [copied, setCopied] = useState(false);
  const count = items.length;
  const text = buildClaudeBundle(title, items);
  const copyLabel = label ?? `Copy all for Claude Code (${count})`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" onClick={copy} aria-label={copyLabel} className={BTN}>
        {copied ? (
          <>
            <Check className="h-3 w-3 text-success-text" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> {copyLabel}
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => downloadMarkdown(text, promptFilename(title, { bundle: true, dateIso }))}
        aria-label={`Download all ${count} fix prompts`}
        title="Download all as .md"
        className={BTN}
      >
        <Download className="h-3 w-3" /> Download
      </button>
    </span>
  );
}
