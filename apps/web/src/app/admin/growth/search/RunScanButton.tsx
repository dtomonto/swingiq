'use client';

// ============================================================
// SearchIntelligenceOS — "Run scan now" button (client).
// Posts to the run API (admin-secret retry pattern), then refreshes so the
// live-computed dashboards re-render. Mirrors Link Intelligence's RunAgentButton.
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, Check } from 'lucide-react';

const SECRET_KEY = 'growthos.adminSecret';

export function RunScanButton() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');

  async function run(retrySecret?: string): Promise<void> {
    setState('running');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const secret = retrySecret ?? (typeof window !== 'undefined' ? window.sessionStorage.getItem(SECRET_KEY) : null);
    if (secret) headers['x-admin-secret'] = secret;
    try {
      const res = await fetch('/api/growth/search-intelligence/run', { method: 'POST', headers });
      if (res.status === 401) {
        const entered = window.prompt('Enter ADMIN_SECRET to run the scan (required in production):');
        if (entered) { window.sessionStorage.setItem(SECRET_KEY, entered); return run(entered); }
        setState('idle');
        return;
      }
      if (!res.ok) { setState('idle'); return; }
      setState('done');
      router.refresh();
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('idle');
    }
  }

  return (
    <button
      onClick={() => run()}
      disabled={state === 'running'}
      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold px-3.5 py-2"
    >
      {state === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : state === 'done' ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      {state === 'running' ? 'Scanning…' : state === 'done' ? 'Saved' : 'Run scan now'}
    </button>
  );
}
