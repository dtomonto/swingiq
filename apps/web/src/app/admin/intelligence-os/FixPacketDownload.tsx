'use client';

// Copy the Claude Code repair prompt + download the fix packet as Markdown or
// JSON. Works for a task (taskId) or a recurring pattern (patternId).

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function FixPacketDownload({ promptText, taskId, patternId }: { promptText: string; taskId?: string; patternId?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  }
  const qs = taskId ? `taskId=${encodeURIComponent(taskId)}` : `patternId=${encodeURIComponent(patternId ?? '')}`;
  const base = `/api/admin/intelligence-os/fix-packet?${qs}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="primary" onClick={copy} aria-label="Copy Claude Code repair prompt">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy Claude Code prompt'}
      </Button>
      <a href={`${base}&format=md`} download><Button size="sm" variant="outline" type="button"><Download className="h-4 w-4" /> Markdown</Button></a>
      <a href={`${base}&format=json`} download><Button size="sm" variant="outline" type="button"><Download className="h-4 w-4" /> JSON</Button></a>
    </div>
  );
}
