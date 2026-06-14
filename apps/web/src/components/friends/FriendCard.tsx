'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { FriendView } from '@/lib/friends/types';

interface FriendCardProps {
  view: FriendView;
  busy?: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onRemove?: (id: string) => void;
  onToggleUpload?: (id: string, next: boolean) => void;
}

export function FriendCard({ view, busy, onAccept, onDecline, onRemove, onToggleUpload }: FriendCardProps) {
  const { summary, status, direction, permissions, friendshipId } = view;
  return (
    <Card>
      <CardBody className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
          aria-hidden="true"
        >
          {summary.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-foreground">{summary.displayName}</p>
            {status === 'accepted' && <Badge variant="success">Friend</Badge>}
            {status === 'pending' && (
              <Badge variant="info">{direction === 'incoming' ? 'Wants to connect' : 'Pending'}</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {summary.handle ? `@${summary.handle}` : 'Athlete'}
            {summary.primarySport ? ` · ${summary.primarySport}` : ''}
          </p>
          {status === 'accepted' && (summary.skillLevel || summary.stage || summary.archetype) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {summary.archetype && <Badge>{summary.archetype}</Badge>}
              {summary.stage && <Badge variant="default">{summary.stage}</Badge>}
              {summary.skillLevel && <Badge variant="default">{summary.skillLevel}</Badge>}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {status === 'pending' && direction === 'incoming' && (
              <>
                <Button size="sm" loading={busy} onClick={() => onAccept?.(friendshipId)}>
                  Accept
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecline?.(friendshipId)}>
                  Decline
                </Button>
              </>
            )}
            {status === 'pending' && direction === 'outgoing' && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRemove?.(friendshipId)}>
                Cancel request
              </Button>
            )}
            {status === 'accepted' && (
              <>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--primary)]"
                    checked={permissions.allow_upload_for_me}
                    disabled={busy}
                    onChange={(e) => onToggleUpload?.(friendshipId, e.target.checked)}
                  />
                  Let them upload videos for me
                </label>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRemove?.(friendshipId)}>
                  Remove
                </Button>
              </>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
