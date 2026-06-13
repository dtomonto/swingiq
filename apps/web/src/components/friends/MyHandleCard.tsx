'use client';

import { useEffect, useState } from 'react';
import { AtSign } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authMode } from '@/lib/auth/useAuth';
import { normalizeHandle, isValidHandle } from '@/lib/friends/service';

export function MyHandleCard() {
  const cloud = authMode() === 'cloud';
  const [handle, setHandle] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  // Only start in a loading state when we'll actually fetch (cloud mode).
  const [loading, setLoading] = useState(cloud);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cloud) return;
    let active = true;
    fetch('/api/player-profile/handle')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.handle) {
          setSaved(d.handle);
          setHandle(d.handle);
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [cloud]);

  if (!cloud || loading) return null;

  const normalized = normalizeHandle(handle);
  const dirty = normalized !== (saved ?? '');
  const canSave = isValidHandle(normalized) && dirty && !saving;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/player-profile/handle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: normalized }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save your handle.');
      setSaved(json.handle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your handle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-4">
      <CardBody>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <AtSign size={15} aria-hidden="true" /> Your handle
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          {saved
            ? 'Friends can find you at this handle. You can change it anytime.'
            : 'Claim a handle so friends can find and add you.'}
        </p>
        <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="my-handle" className="sr-only">
            Your handle
          </label>
          <div className="flex flex-1 items-center rounded-lg border border-border bg-background px-3">
            <span className="text-muted-foreground">@</span>
            <input
              id="my-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your_handle"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-transparent px-1.5 py-2 text-sm text-foreground outline-none"
            />
          </div>
          <Button type="submit" disabled={!canSave} loading={saving}>
            {saved ? 'Update' : 'Claim'}
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-error">{error}</p>}
        {!error && saved && !dirty && (
          <p className="mt-2 text-xs text-muted-foreground">Saved as @{saved}.</p>
        )}
      </CardBody>
    </Card>
  );
}
