'use client';

// ============================================================
// AiUserCapEditor — edit the PER-USER daily AI spend cap inline on
// /admin/ai-usage. Posts to /api/admin/ai/user-cap (admin + settings.manage
// gated). 0 = unlimited. Once an account's estimated spend reaches this cap,
// AI auto-pauses for that account until 00:00 UTC. Persists fleet-wide when
// Upstash is configured; otherwise applies to this server instance until
// restart — stated plainly so nothing is implied.
// ============================================================

import { useState } from 'react';
import { Save, Loader2, Check, AlertCircle } from 'lucide-react';

interface Props {
  initialCents: number;
  initialSource: 'override' | 'env' | 'off';
}

const toDollars = (cents: number) => (cents > 0 ? (cents / 100).toFixed(2) : '');

export function AiUserCapEditor({ initialCents, initialSource }: Props) {
  // Suggest $1.00 when nothing is set yet, so arming the cap is one click.
  const [value, setValue] = useState(initialCents > 0 ? toDollars(initialCents) : '1.00');
  const [cents, setCents] = useState(initialCents);
  const [source, setSource] = useState(initialSource);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function save(payload: { dollars?: number; clear?: boolean }) {
    setSaving(true);
    setStatus('idle');
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/user-cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(
          data?.error === 'invalid-amount'
            ? 'Enter a dollar amount of 0 or more.'
            : 'Could not save (check your admin permissions).',
        );
        return;
      }
      const c = data.userCap as { limitCents: number; limitSource: 'override' | 'env' | 'off' };
      setCents(c.limitCents);
      setSource(c.limitSource);
      setValue(c.limitCents > 0 ? toDollars(c.limitCents) : '');
      setStatus('saved');
    } catch {
      setStatus('error');
      setMessage('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  const current = cents > 0 ? `$${(cents / 100).toFixed(2)} / user / day` : 'Unlimited (no per-user cap)';
  const sourceLabel =
    source === 'override' ? 'set here' : source === 'env' ? 'from AI_PER_USER_DAILY_BUDGET_CENTS' : 'no cap set';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Per-user daily cap (USD) · 0 = unlimited</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              min={0}
              step="0.50"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="1.00"
              className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground tabular-nums focus:border-success/50 focus:outline-none"
            />
          </div>
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => save({ dollars: Number(value || 0) })}
          className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-success-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save cap
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save({ clear: true })}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-card disabled:opacity-60"
        >
          Use env default
        </button>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {status === 'saved' && <Check className="h-3.5 w-3.5 text-success-text" />}
        {status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-error" />}
        <span>
          {status === 'saved' ? `Saved. ` : status === 'error' ? `${message} ` : ''}
          Current: <span className="font-medium text-foreground">{current}</span> ({sourceLabel}). Applies to each
          signed-in account&apos;s own AI spend (coaching, video, OCR). Anonymous traffic is governed by the global
          cap only. Persists fleet-wide with Upstash; otherwise applies to this server until restart.
        </span>
      </p>
    </div>
  );
}
