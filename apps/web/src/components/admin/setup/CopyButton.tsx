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
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
        </>
      )}
    </button>
  );
}
