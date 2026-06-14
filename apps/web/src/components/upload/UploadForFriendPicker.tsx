'use client';

// ============================================================
// WS-06 — Upload-for-friend picker. Lets you assign your latest local swing
// analysis to an eligible friend (accepted + who enabled friend uploads).
// Eligibility + the actual assignment are enforced server-side; this UI only
// surfaces what the rules already allow. Confirmation is required before
// assigning a swing to another athlete.
// ============================================================

import { useMemo, useState } from 'react';
import { UploadCloud, ShieldCheck } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFriends } from '@/hooks/useFriends';
import { useUploadForFriend } from '@/hooks/useUploadForFriend';
import { useSwingVantageStore } from '@/store';

export function UploadForFriendPicker() {
  const { enabled, friends } = useFriends();
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);
  const upload = useUploadForFriend();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const eligible = useMemo(
    () => (friends.data ?? []).filter((v) => v.status === 'accepted' && v.permissions.allow_upload_for_me),
    [friends.data],
  );
  const latest = videoAnalyses[0] ?? null;

  if (!enabled) return null;

  if (eligible.length === 0) {
    return (
      <Card className="mb-4">
        <CardBody>
          <EmptyState
            icon={UploadCloud}
            title="No friends to upload for yet"
            description="A friend must enable “Let them upload videos for me” before you can send them a swing."
            compact
          />
        </CardBody>
      </Card>
    );
  }

  const target = eligible.find((v) => v.summary.userId === selected) ?? null;

  async function submit() {
    if (!target) return;
    try {
      const r = await upload.mutateAsync({
        athleteUserId: target.summary.userId,
        sport: latest?.sport,
        fileName: latest ? `Shared by a friend` : 'Shared analysis',
        analysis: latest?.analysis ?? null,
      });
      setDone(target.summary.displayName);
      setSelected(null);
      setConfirming(false);
      void r;
    } catch {
      setConfirming(false);
    }
  }

  return (
    <Card className="mb-4">
      <CardBody>
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <UploadCloud size={15} aria-hidden="true" /> Upload a swing for a friend
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Assign your most recent analysis to a friend who enabled friend uploads. It lands in
          <span className="font-medium text-foreground"> their</span> history, with an audit trail of
          who uploaded it.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="uff-friend" className="sr-only">
            Friend
          </label>
          <select
            id="uff-friend"
            value={selected ?? ''}
            onChange={(e) => {
              setSelected(e.target.value || null);
              setDone(null);
            }}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Choose a friend…</option>
            {eligible.map((v) => (
              <option key={v.summary.userId} value={v.summary.userId}>
                {v.summary.displayName}
                {v.summary.handle ? ` (@${v.summary.handle})` : ''}
              </option>
            ))}
          </select>
          <Button
            disabled={!target || upload.isPending}
            loading={upload.isPending}
            onClick={() => setConfirming(true)}
          >
            Upload for them
          </Button>
        </div>

        {!latest && (
          <p className="mt-2 text-xs text-muted-foreground">
            You don&apos;t have a recent analysis yet — a metadata-only record will be sent.
          </p>
        )}
        {upload.isError && (
          <p className="mt-2 text-xs text-error">{upload.error?.message ?? 'Upload failed.'}</p>
        )}
        {done && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
            <ShieldCheck size={13} aria-hidden="true" /> Sent to {done}.
          </p>
        )}

        {confirming && target && (
          <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm text-foreground">
              Assign this swing to <span className="font-semibold">{target.summary.displayName}</span>?
            </p>
            <p className="mb-2 text-xs text-muted-foreground">
              It will appear in their account as uploaded by you.
            </p>
            <div className="flex gap-2">
              <Button size="sm" loading={upload.isPending} onClick={submit}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
