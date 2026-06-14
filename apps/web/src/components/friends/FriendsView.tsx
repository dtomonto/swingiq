'use client';

import { useState } from 'react';
import { Users, UserPlus, Inbox } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useFriends } from '@/hooks/useFriends';
import { isValidHandle, normalizeHandle } from '@/lib/friends/service';
import { FriendCard } from './FriendCard';

type Tab = 'friends' | 'incoming' | 'outgoing';

export function FriendsView() {
  const f = useFriends();
  const [tab, setTab] = useState<Tab>('friends');
  const [handle, setHandle] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  if (!f.enabled) {
    return (
      <EmptyState
        icon={Users}
        title="Sign in to add friends"
        description="Friends sync to your account, so you'll need to be signed in to send and accept requests."
        action={{ label: 'Sign in', href: '/auth/login' }}
      />
    );
  }

  const normalized = normalizeHandle(handle);
  const canSend = isValidHandle(normalized) && !f.sendRequest.isPending;

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setNotice(null);
    try {
      const r = await f.sendRequest.mutateAsync(normalized);
      setHandle('');
      setNotice(
        r.status === 'already_friends'
          ? "You're already friends."
          : r.status === 'already_pending'
            ? 'There is already a pending request with this person.'
            : `Request sent to @${normalized} (if that handle exists).`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not send the request.');
    }
  }

  const incoming = f.pending.data?.incoming ?? [];
  const outgoing = f.pending.data?.outgoing ?? [];
  const friends = f.friends.data ?? [];
  const busy =
    f.accept.isPending || f.decline.isPending || f.remove.isPending || f.setPermissions.isPending;

  const tabs: { id: Tab; label: string; icon: typeof Users; count: number }[] = [
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'incoming', label: 'Requests', icon: Inbox, count: incoming.length },
    { id: 'outgoing', label: 'Sent', icon: UserPlus, count: outgoing.length },
  ];

  return (
    <div className="space-y-5">
      {/* Add by handle */}
      <Card>
        <CardBody>
          <form onSubmit={onSend} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="friend-handle" className="sr-only">
              Friend handle
            </label>
            <div className="flex flex-1 items-center rounded-lg border border-border bg-background px-3">
              <span className="text-muted-foreground">@</span>
              <input
                id="friend-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="their_handle"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-transparent px-1.5 py-2 text-sm text-foreground outline-none"
              />
            </div>
            <Button type="submit" disabled={!canSend} loading={f.sendRequest.isPending}>
              Add friend
            </Button>
          </form>
          {notice && <p className="mt-2 text-xs text-muted-foreground">{notice}</p>}
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Friends sections">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {t.label}
              {t.count > 0 && <Badge variant={active ? 'info' : 'default'}>{t.count}</Badge>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <TabPanel
        loading={tab === 'friends' ? f.friends.isLoading : f.pending.isLoading}
        error={tab === 'friends' ? f.friends.error : f.pending.error}
        onRetry={() => (tab === 'friends' ? f.friends.refetch() : f.pending.refetch())}
      >
        {tab === 'friends' && (
          friends.length === 0 ? (
            <EmptyState icon={Users} title="No friends yet" description="Add someone by their handle to get started." />
          ) : (
            <List>
              {friends.map((v) => (
                <FriendCard
                  key={v.friendshipId}
                  view={v}
                  busy={busy}
                  onRemove={(id) => f.remove.mutate(id)}
                  onToggleUpload={(id, next) => f.setPermissions.mutate({ id, patch: { allow_upload_for_me: next } })}
                />
              ))}
            </List>
          )
        )}
        {tab === 'incoming' && (
          incoming.length === 0 ? (
            <EmptyState icon={Inbox} title="No incoming requests" />
          ) : (
            <List>
              {incoming.map((v) => (
                <FriendCard
                  key={v.friendshipId}
                  view={v}
                  busy={busy}
                  onAccept={(id) => f.accept.mutate(id)}
                  onDecline={(id) => f.decline.mutate(id)}
                />
              ))}
            </List>
          )
        )}
        {tab === 'outgoing' && (
          outgoing.length === 0 ? (
            <EmptyState icon={UserPlus} title="No pending sent requests" />
          ) : (
            <List>
              {outgoing.map((v) => (
                <FriendCard key={v.friendshipId} view={v} busy={busy} onRemove={(id) => f.remove.mutate(id)} />
              ))}
            </List>
          )
        )}
      </TabPanel>
    </div>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function TabPanel({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (loading) return <LoadingSkeleton lines={4} />;
  if (error) {
    return (
      <Card>
        <CardBody className="text-center">
          <p className="text-sm text-foreground">Couldn&apos;t load this list.</p>
          <p className="mb-3 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Please try again.'}
          </p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }
  return <div role="tabpanel">{children}</div>;
}
