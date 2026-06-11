'use client';

// ============================================================
// Keys & Secrets manager (admin) — add / replace / remove API keys in one place.
// Pasting a value auto-detects the provider (detectKey). Raw values are sent to
// the admin-only API but never read back — the UI only ever shows masked
// previews returned by the server.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, Trash2, Wand2, AlertTriangle } from 'lucide-react';
import { MANAGED_KEYS, type SecretCategory } from '@/lib/secrets/registry';
import { detectKey } from '@/lib/secrets/detect';

interface SecretStatus {
  name: string;
  label: string;
  provider: string;
  providerLabel: string;
  category: SecretCategory;
  secret: boolean;
  activates: string;
  source: 'env' | 'vault' | 'none';
  masked: string;
  updatedAt?: string;
  placeholder?: string;
  docsUrl?: string;
}

const CATEGORY_LABEL: Record<SecretCategory, string> = {
  core: 'Core', ai: 'AI', email: 'Email', monetization: 'Monetization', growth: 'Growth', devops: 'DevOps',
};

export function KeysManager() {
  const [statuses, setStatuses] = useState<SecretStatus[]>([]);
  const [vaultWritable, setVaultWritable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pasted, setPasted] = useState('');
  const [targetName, setTargetName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/secrets', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load keys (admin access required).');
      const data = (await res.json()) as { status: SecretStatus[]; vaultWritable: boolean };
      setStatuses(data.status);
      setVaultWritable(data.vaultWritable);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-detect the provider/key from a pasted value (drives the badge; the
  // destination select is set in the input's onChange to avoid an effect).
  const detected = useMemo(() => (pasted.trim() ? detectKey(pasted.trim()) : null), [pasted]);

  const save = useCallback(async () => {
    const name = targetName;
    const value = pasted.trim();
    if (!name || !value) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed.');
      setPasted('');
      setTargetName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }, [targetName, pasted, load]);

  const remove = useCallback(
    async (name: string) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/secrets?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Remove failed.');
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Remove failed.');
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const grouped = useMemo(() => {
    const order: SecretCategory[] = ['core', 'ai', 'email', 'monetization', 'growth', 'devops'];
    return order
      .map((cat) => ({ cat, items: statuses.filter((s) => s.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [statuses]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-success-text" />
        <h2 className="text-base font-semibold text-foreground">Keys &amp; Secrets</h2>
      </div>

      {!vaultWritable && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-3 text-sm text-link">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            The vault is locked. Set <code className="rounded bg-muted px-1 font-mono text-[11px]">SECRETS_ENCRYPTION_KEY</code>{' '}
            (a 32-byte base64 string) in your host to store keys here. Until then keys must be set as host
            env vars; this page shows their status read-only.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-error/30 bg-error/[0.06] px-4 py-3 text-sm text-error-text">{error}</div>
      )}

      {/* Add / replace via paste + auto-detect */}
      <div className="rounded-xl border border-border bg-card/40 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Wand2 className="h-4 w-4 text-success-text" /> Add or replace a key
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Paste a key — the provider is detected automatically. Values are encrypted at rest and never shown again.</p>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={pasted}
          onChange={(e) => {
            const v = e.target.value;
            setPasted(v);
            const d = v.trim() ? detectKey(v.trim()) : null;
            if (d) setTargetName(d.name);
          }}
          placeholder="Paste an API key or value…"
          disabled={!vaultWritable || busy}
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-success focus:outline-none disabled:opacity-50"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            disabled={!vaultWritable || busy}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-success focus:outline-none disabled:opacity-50"
          >
            <option value="">Select destination key…</option>
            {MANAGED_KEYS.map((k) => (
              <option key={k.name} value={k.name}>
                {k.providerLabel} — {k.label} ({k.name})
              </option>
            ))}
          </select>
          {detected && (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/[0.08] px-2.5 py-1 text-xs text-success-text">
              <ShieldCheck className="h-3 w-3" /> Detected: {detected.providerLabel}
            </span>
          )}
          <button
            onClick={() => void save()}
            disabled={!vaultWritable || busy || !targetName || !pasted.trim()}
            className="ml-auto rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save key'}
          </button>
        </div>
      </div>

      {/* Status list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading keys…</p>
      ) : (
        grouped.map(({ cat, items }) => (
          <div key={cat} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">{CATEGORY_LABEL[cat]}</p>
            <div className="overflow-hidden rounded-xl border border-border">
              {items.map((s) => (
                <div key={s.name} className="flex items-center gap-3 border-b border-border bg-card/30 px-4 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{s.label}</span>
                      <SourceBadge source={s.source} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{s.providerLabel} · {s.activates}</p>
                    {s.source !== 'none' && (
                      <code className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{s.masked}</code>
                    )}
                  </div>
                  {s.source === 'vault' && (
                    <button
                      onClick={() => void remove(s.name)}
                      disabled={busy}
                      title="Remove from vault"
                      className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-error/40 hover:text-error-text disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: SecretStatus['source'] }) {
  const map = {
    env: { label: 'Host env', cls: 'border-primary/30 bg-primary/[0.08] text-link' },
    vault: { label: 'Vault', cls: 'border-success/30 bg-success/[0.08] text-success-text' },
    none: { label: 'Not set', cls: 'border-border bg-muted/40 text-muted-foreground' },
  } as const;
  const m = map[source];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>{m.label}</span>;
}
