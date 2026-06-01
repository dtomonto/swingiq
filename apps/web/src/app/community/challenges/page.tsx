'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingIQStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { CHALLENGES, getActiveChallengesWithProgress, getChallengeProgress } from '@/lib/community/challenges';
import { Target, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChallengesPage() {
  const { t } = useLanguage();
  const store = useSwingIQStore();
  const { sessions, video_analyses, community } = store;
  const [tab, setTab] = useState<'available' | 'active' | 'completed'>('active');

  const challengeCtx = {
    sessions,
    videoAnalyses: video_analyses,
    lastExportAt: community.lastExportAt,
    exportCount: community.exportCount,
  };

  const joinedIds = new Set(community.challengesActive.map(c => c.id));
  const completedIds = new Set(community.challengesCompleted.map(c => c.id));
  const activeChallenges = getActiveChallengesWithProgress(community.challengesActive, challengeCtx);

  function handleJoin(challengeId: string) {
    if (joinedIds.has(challengeId) || completedIds.has(challengeId)) return;
    store.updateCommunity({
      challengesActive: [
        ...community.challengesActive,
        { id: challengeId, joinedAt: new Date().toISOString(), progress: 0, expiresAt: null },
      ],
    });
  }

  function handleLeave(challengeId: string) {
    store.updateCommunity({
      challengesActive: community.challengesActive.filter(c => c.id !== challengeId),
    });
  }

  const availableChallenges = CHALLENGES.filter(c => !joinedIds.has(c.id) && !completedIds.has(c.id));
  const completedChallenges = community.challengesCompleted;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-24">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target size={24} className="text-green-600" aria-hidden="true" />
            {t('challenges.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('challenges.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit" role="tablist">
          {(['active', 'available', 'completed'] as const).map(tabId => (
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
              {tabId === 'active' ? `${t('challenges.active')} (${activeChallenges.length})`
                : tabId === 'available' ? `${t('challenges.available')} (${availableChallenges.length})`
                : `${t('challenges.completed')} (${completedChallenges.length})`}
            </button>
          ))}
        </div>

        {/* Active challenges */}
        {tab === 'active' && (
          <div className="space-y-4">
            {activeChallenges.length === 0 ? (
              <EmptyState message={t('challenges.noActiveChallenges')} icon="⚔️" />
            ) : (
              activeChallenges.map(({ challenge, active, progress }) => (
                <Card key={challenge.id}>
                  <CardBody className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0" aria-hidden="true">{challenge.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <DifficultyBadge difficulty={challenge.difficulty} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} aria-hidden="true" />
                            {challenge.durationDays}d challenge
                          </span>
                          <span>+{challenge.rewardXP} {t('common.xp')}</span>
                          {challenge.isDataChallenge && (
                            <span className="text-green-700 font-medium">💾 Data Challenge</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600">{t('challenges.progress')}</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div
                        className="h-2 bg-gray-200 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {challenge.isDataChallenge && (
                      <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        💡 {t('challenges.exportReminder')}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeave(challenge.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {t('challenges.leave')}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Available challenges */}
        {tab === 'available' && (
          <div className="space-y-4">
            {availableChallenges.length === 0 ? (
              <EmptyState message={t('challenges.noChallenges')} icon="🎯" />
            ) : (
              availableChallenges.map(challenge => (
                <Card key={challenge.id}>
                  <CardBody className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0" aria-hidden="true">{challenge.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <DifficultyBadge difficulty={challenge.difficulty} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                          <span>{challenge.durationDays}d</span>
                          <span className="text-green-700 font-medium">+{challenge.rewardXP} {t('common.xp')}</span>
                          {challenge.isDataChallenge && (
                            <span className="text-blue-700">💾 Includes data backup</span>
                          )}
                        </div>
                        <ul className="mt-2 space-y-0.5">
                          {challenge.rules.map((rule, i) => (
                            <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5" aria-hidden="true">•</span>
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => handleJoin(challenge.id)}>
                        {t('challenges.join')}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Completed challenges */}
        {tab === 'completed' && (
          <div className="space-y-4">
            {completedChallenges.length === 0 ? (
              <EmptyState message={t('challenges.joinFirst')} icon="🏆" />
            ) : (
              completedChallenges.map(completed => {
                const challenge = CHALLENGES.find(c => c.id === completed.id);
                if (!challenge) return null;
                return (
                  <Card key={completed.id}>
                    <CardBody className="flex items-center gap-3">
                      <span className="text-3xl shrink-0" aria-hidden="true">{challenge.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t('challenges.completedOn')} {new Date(completed.completedAt).toLocaleDateString()} · +{completed.xpEarned} {t('common.xp')}
                        </p>
                      </div>
                      <CheckCircle size={20} className="text-green-500 shrink-0" aria-label="Completed" />
                    </CardBody>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', colors[difficulty as keyof typeof colors] ?? 'bg-gray-100 text-gray-600')}>
      {difficulty}
    </span>
  );
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <Card>
      <CardBody className="text-center py-12 space-y-2">
        <span className="text-4xl" aria-hidden="true">{icon}</span>
        <p className="text-gray-500 text-sm">{message}</p>
      </CardBody>
    </Card>
  );
}
