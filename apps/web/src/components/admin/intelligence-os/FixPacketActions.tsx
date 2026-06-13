'use client';

// Copy the Claude Code repair prompt to the clipboard, or download the full
// Markdown / JSON fix packet from the API. Works for a stored task (taskId) or
// a pattern-derived packet (patternId).

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function FixPacketActions({
  promptText,
  taskId,
  patternId,
}: {
  promptText: string;
  taskId?: string;
  patternId?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const qs = taskId ? `taskId=${encodeURIComponent(taskId)}` : `patternId=${encodeURIComponent(patternId ?? '')}`;
  const base = `/api/admin/intelligence-os/fix-packet?${qs}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="sm" onClick={copy} aria-label="Copy Claude Code repair prompt">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy Claude Code prompt'}
      </Button>
      <a href={`${base}&format=md`} download>
        <Button variant="outline" size="sm" type="button">
          <Download className="h-4 w-4" /> Markdown
        </Button>
      </a>
      <a href={`${base}&format=json`} download>
        <Button variant="outline" size="sm" type="button">
          <Download className="h-4 w-4" /> JSON
        </Button>
      </a>
    </div>
  );
}
