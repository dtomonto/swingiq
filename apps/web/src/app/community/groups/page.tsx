'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingIQStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSport } from '@/contexts/SportContext';
import { GROUPS, getGroupsBySport, getPublicGroups } from '@/lib/community/groups';
import { Users, Lock, Globe, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GroupsPage() {
  const { t } = useLanguage();
  const { activeSport } = useSport();
  const { community } = useSwingIQStore();
  const store = useSwingIQStore();
  const [sportFilter, setSportFilter] = useState<'all' | string>('all');
  const [tab, setTab] = useState<'my' | 'browse'>('browse');

  const joinedGroupIds = new Set(community.groupsJoined);
  const myGroups = GROUPS.filter(g => joinedGroupIds.has(g.id));
  const browseGroups = (sportFilter === 'all' ? getPublicGroups() : getGroupsBySport(sportFilter))
    .filter(g => !joinedGroupIds.has(g.id));

  function handleJoin(groupId: string) {
    store.updateCommunity({ groupsJoined: [...community.groupsJoined, groupId] });
  }

  function handleLeave(groupId: string) {
    store.updateCommunity({ groupsJoined: community.groupsJoined.filter(id => id !== groupId) });
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-24">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-green-600" aria-hidden="true" />
            {t('groups.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('groups.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit" role="tablist">
          {(['browse', 'my'] as const).map(tabId => (
            <button
              key={tabId}
              role="tab"
              aria-selected={tab === tabId}
              onClick={() => setTab(tabId)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === tabId ? 'bg-white shadow-xs text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tabId === 'browse'
                ? `${t('groups.availableGroups')} (${browseGroups.length + myGroups.length})`
                : `${t('groups.myGroups')} (${myGroups.length})`}
            </button>
          ))}
        </div>

        {/* Sport filter */}
        {tab === 'browse' && (
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by sport">
            {['all', 'golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast'].map(sport => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                aria-pressed={sportFilter === sport}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                  sportFilter === sport
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {sport === 'all' ? t('sports.allSports')
                  : sport === 'softball_slow' ? 'Slow Pitch'
                  : sport === 'softball_fast' ? 'Fast Pitch'
                  : sport.charAt(0).toUpperCase() + sport.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Groups list */}
        {tab === 'browse' && (
          <div className="space-y-4">
            {getPublicGroups().length === 0 ? (
              <EmptyState message={t('groups.noGroups')} />
            ) : (
              getPublicGroups().map(group => {
                const isJoined = joinedGroupIds.has(group.id);
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isJoined={isJoined}
                    onJoin={() => handleJoin(group.id)}
                    onLeave={() => handleLeave(group.id)}
                    t={t}
                  />
                );
              })
            )}
          </div>
        )}

        {/* My groups */}
        {tab === 'my' && (
          <div className="space-y-4">
            {myGroups.length === 0 ? (
              <EmptyState message={t('groups.noGroups')} />
            ) : (
              myGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isJoined
                  onJoin={() => handleJoin(group.id)}
                  onLeave={() => handleLeave(group.id)}
                  t={t}
                />
              ))
            )}
          </div>
        )}

        {/* Data export reminder */}
        <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <Shield size={16} className="shrink-0 mt-0.5 text-green-600" aria-hidden="true" />
          <p>{t('groups.exportReminderGroup')}</p>
        </div>
      </div>
    </AppShell>
  );
}

function GroupCard({
  group, isJoined, onJoin, onLeave, t,
}: {
  group: ReturnType<typeof getPublicGroups>[0];
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
  t: (key: string) => string;
}) {
  const PrivacyIcon = group.privacy === 'public' ? Globe : Lock;
  const privacyLabel = {
    public: t('groups.publicGroup'),
    private: t('groups.privateGroup'),
    invite_only: t('groups.inviteOnly'),
  }[group.privacy];

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0" aria-hidden="true">{group.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900">{group.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <PrivacyIcon size={12} aria-hidden="true" />
                {privacyLabel}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{group.description}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {group.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {isJoined ? (
            <>
              <Button variant="outline" size="sm" onClick={onLeave}>
                {t('groups.leave')}
              </Button>
              <span className="flex items-center text-xs text-green-700 font-medium bg-green-100 px-3 py-1 rounded-full">
                ✓ Joined
              </span>
            </>
          ) : (
            <Button size="sm" onClick={onJoin}>
              {t('groups.join')}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardBody className="text-center py-12 space-y-2">
        <span className="text-4xl" aria-hidden="true">👥</span>
        <p className="text-gray-500 text-sm">{message}</p>
      </CardBody>
    </Card>
  );
}
