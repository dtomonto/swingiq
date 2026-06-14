'use client';

// CopyButton — copy a snippet (env var name, command, file path) to the
// clipboard with a brief "Copied!" confirmation. Beginner-friendly: the
// owner never has to retype an exact variable name or command.

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op; the text is still visible to copy by hand */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label ?? text}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-2xs font-medium text-foreground transition-colors hover:border-border hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-success-text" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
        </>
      )}
    </button>
  );
}
