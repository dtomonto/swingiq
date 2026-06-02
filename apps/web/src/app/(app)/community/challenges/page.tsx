'use client';

import { useState } from 'react';
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
    <>
      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-24">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target size={24} className="text-primary" aria-hidden="true" />
            {t('challenges.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('challenges.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit" role="tablist">
          {(['active', 'available', 'completed'] as const).map(tabId => (
            <button
              key={tabId}
              role="tab"
              aria-selected={tab === tabId}
              onClick={() => setTab(tabId)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === tabId ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
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
                          <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                          <DifficultyBadge difficulty={challenge.difficulty} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={12} aria-hidden="true" />
                            {challenge.durationDays}d challenge
                          </span>
                          <span>+{challenge.rewardXP} {t('common.xp')}</span>
                          {challenge.isDataChallenge && (
                            <span className="text-primary font-medium">💾 Data Challenge</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">{t('challenges.progress')}</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div
                        className="h-2 bg-muted rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            progress >= 100 ? 'bg-primary' : 'bg-accent-secondary'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {challenge.isDataChallenge && (
                      <p className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
                        💡 {t('challenges.exportReminder')}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeave(challenge.id)}
                        className="text-error border-error/30 hover:bg-error/10"
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
                          <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                          <DifficultyBadge difficulty={challenge.difficulty} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>{challenge.durationDays}d</span>
                          <span className="text-primary font-medium">+{challenge.rewardXP} {t('common.xp')}</span>
                          {challenge.isDataChallenge && (
                            <span className="text-accent-secondary">💾 Includes data backup</span>
                          )}
                        </div>
                        <ul className="mt-2 space-y-0.5">
                          {challenge.rules.map((rule, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5" aria-hidden="true">•</span>
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
                        <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('challenges.completedOn')} {new Date(completed.completedAt).toLocaleDateString()} · +{completed.xpEarned} {t('common.xp')}
                        </p>
                      </div>
                      <CheckCircle size={20} className="text-primary shrink-0" aria-label="Completed" />
                    </CardBody>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    beginner: 'bg-primary/15 text-primary',
    intermediate: 'bg-accent-secondary/15 text-accent-secondary',
    advanced: 'bg-accent-secondary/15 text-accent-secondary',
  };
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', colors[difficulty as keyof typeof colors] ?? 'bg-muted text-muted-foreground')}>
      {difficulty}
    </span>
  );
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <Card>
      <CardBody className="text-center py-12 space-y-2">
        <span className="text-4xl" aria-hidden="true">{icon}</span>
        <p className="text-muted-foreground text-sm">{message}</p>
      </CardBody>
    </Card>
  );
}
