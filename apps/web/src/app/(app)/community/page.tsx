'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BackupHealthBanner } from '@/components/community/BackupHealthBanner';
import { AchievementBadge } from '@/components/community/AchievementBadge';
import { useSwingIQStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSport } from '@/contexts/SportContext';
import {
  Users, Trophy, Flame, Zap, Target, Download, Award,
  TrendingUp, Calendar, Shield, ChevronRight, Star,
} from 'lucide-react';
import { ACHIEVEMENTS, computeAchievementProgress, syncEarnedAchievements } from '@/lib/community/achievements';
import { CHALLENGES, getActiveChallengesWithProgress } from '@/lib/community/challenges';
import { calculateBackupHealth } from '@/lib/community/backup-health';
import { calculateLevelFromXP, getLevelTitle } from '@/lib/community/xp';
import { formatActivityTime } from '@/lib/community/activity-feed';
import type { AchievementContext } from '@/lib/community/types';

export default function CommunityPage() {
  const { t } = useLanguage();
  const { activeSport } = useSport();
  const store = useSwingIQStore();
  const { sessions, video_analyses, training, community } = store;

  // Build achievement context
  const achievementCtx: AchievementContext = {
    sessions,
    videoAnalyses: video_analyses,
    training,
    lastExportAt: community.lastExportAt,
    exportCount: community.exportCount,
    challengesCompleted: community.challengesCompleted,
  };

  // Sync earned achievements
  const { newEarned } = syncEarnedAchievements(achievementCtx, community.achievementsEarned);
  const allEarned = [...community.achievementsEarned, ...newEarned];
  const earnedIds = new Set(allEarned.map(a => a.id));

  // Get top earned badges to display
  const recentBadges = ACHIEVEMENTS
    .filter(a => earnedIds.has(a.id))
    .slice(0, 3);

  // Get next badge to earn
  const nextBadge = ACHIEVEMENTS
    .filter(a => !earnedIds.has(a.id))
    .find(a => {
      const { percent } = computeAchievementProgress(a, achievementCtx);
      return percent > 0;
    });

  // Active challenges with progress
  const challengeContext = {
    sessions,
    videoAnalyses: video_analyses,
    lastExportAt: community.lastExportAt,
    exportCount: community.exportCount,
  };
  const activeChallenges = getActiveChallengesWithProgress(community.challengesActive, challengeContext);

  // Suggested challenges (not yet joined)
  const joinedIds = new Set(community.challengesActive.map(c => c.id));
  const completedIds = new Set(community.challengesCompleted.map(c => c.id));
  const suggestedChallenges = CHALLENGES
    .filter(c => !joinedIds.has(c.id) && !completedIds.has(c.id))
    .slice(0, 3);

  // XP level
  const { level, progressToNext, xpForNext } = calculateLevelFromXP(community.xpTotal);
  const levelTitle = getLevelTitle(level);

  // Backup health
  const backupHealth = calculateBackupHealth(
    sessions, video_analyses, training, community.lastExportAt, community.exportCount
  );

  // Stats
  const totalSessions = sessions.length + video_analyses.length;
  const streakDays = training.streak_days;

  const profileName = community.profile.displayName
    || (store.profile?.name)
    || 'Athlete';

  function handleJoinChallenge(challengeId: string) {
    const newActive = [
      ...community.challengesActive,
      {
        id: challengeId,
        joinedAt: new Date().toISOString(),
        progress: 0,
        expiresAt: null,
      },
    ];
    store.updateCommunity({ challengesActive: newActive });
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('community.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('community.subtitle')}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Calendar size={20} className="text-accent-secondary" aria-hidden="true" />}
            label={t('community.sessionCount')}
            value={String(totalSessions)}
            bg="bg-accent-secondary/10"
          />
          <StatCard
            icon={<Flame size={20} className="text-warning" aria-hidden="true" />}
            label={t('community.streakDays')}
            value={`${streakDays}d`}
            bg="bg-warning/10"
          />
          <StatCard
            icon={<Zap size={20} className="text-accent-secondary" aria-hidden="true" />}
            label={t('community.xpPoints')}
            value={`${community.xpTotal} XP`}
            bg="bg-accent-secondary/10"
          />
          <StatCard
            icon={<Trophy size={20} className="text-warning" aria-hidden="true" />}
            label={t('common.badges')}
            value={String(allEarned.length)}
            bg="bg-warning/10"
          />
        </div>

        {/* XP Level */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Level {level} — {levelTitle}</p>
                <p className="text-xs text-muted-foreground">{xpForNext > 0 ? `${xpForNext} XP to next level` : 'Max level reached!'}</p>
              </div>
              <div className="flex items-center gap-1 text-accent-secondary bg-accent-secondary/10 px-3 py-1 rounded-full text-sm font-bold">
                <Star size={14} aria-hidden="true" />
                {community.xpTotal} XP
              </div>
            </div>
            <div
              className="h-2 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressToNext}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Level ${level} progress: ${progressToNext}%`}
            >
              <div
                className="h-full bg-linear-to-r from-accent-secondary to-primary rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Backup Health */}
        <BackupHealthBanner />

        {/* Empty state */}
        {totalSessions === 0 && (
          <Card>
            <CardBody className="text-center py-10 space-y-3">
              <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto" aria-hidden="true">
                <Users size={28} className="text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t('community.joinCommunity')}</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('community.communityDesc')}</p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/sessions/import" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary transition-colors">
                  Import Session
                </Link>
                <Link href="/sessions/log" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-card text-foreground border border-border hover:bg-muted transition-colors">
                  Log Session
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={18} className="text-primary" aria-hidden="true" />
                {t('community.activeChallenges')}
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {activeChallenges.map(({ challenge, progress }) => (
                <div key={challenge.id} className="flex items-center gap-3">
                  <span className="text-2xl shrink-0" aria-hidden="true">{challenge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground truncate">{challenge.title}</span>
                      <span className="text-muted-foreground text-xs shrink-0">{progress}%</span>
                    </div>
                    <div
                      className="h-1.5 bg-muted rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/community/challenges" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline mt-1">
                {t('activity.viewAll')} <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </CardBody>
          </Card>
        )}

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award size={18} className="text-warning" aria-hidden="true" />
                  {t('community.recentBadges')}
                </CardTitle>
                <Link href="/community/badges" className="text-sm text-primary font-medium hover:underline">
                  {t('activity.viewAll')}
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentBadges.map(achievement => {
                  const earned = allEarned.find(e => e.id === achievement.id);
                  const { progress, percent } = computeAchievementProgress(achievement, achievementCtx);
                  return (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      earned={!!earned}
                      earnedAt={earned?.earnedAt}
                      progress={progress}
                      progressPercent={percent}
                      size="sm"
                    />
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Next badge to earn */}
        {nextBadge && !recentBadges.length && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" aria-hidden="true" />
                {t('achievements.progressTo')} next badge
              </CardTitle>
            </CardHeader>
            <CardBody>
              <AchievementBadge
                achievement={nextBadge}
                earned={false}
                progress={computeAchievementProgress(nextBadge, achievementCtx).progress}
                progressPercent={computeAchievementProgress(nextBadge, achievementCtx).percent}
              />
            </CardBody>
          </Card>
        )}

        {/* Suggested Challenges */}
        {suggestedChallenges.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target size={18} className="text-accent-secondary" aria-hidden="true" />
                  {t('community.suggestedChallenges')}
                </CardTitle>
                <Link href="/community/challenges" className="text-sm text-primary font-medium hover:underline">
                  {t('activity.viewAll')}
                </Link>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {suggestedChallenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border"
                >
                  <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{challenge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{challenge.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{challenge.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                        +{challenge.rewardXP} XP
                      </span>
                      <span className="text-xs text-muted-foreground">{challenge.durationDays}d</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleJoinChallenge(challenge.id)}
                    aria-label={`${t('challenges.join')}: ${challenge.title}`}
                  >
                    {t('common.join')}
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Export reminder & shortcuts */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  <Shield size={14} className="inline mr-1 text-primary" aria-hidden="true" />
                  {t('data.promptValueOfData')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('community.exportReminder')}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/data" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary transition-colors">
                  <Download size={14} aria-hidden="true" />
                  {t('community.exportData')}
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Navigation grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <QuickLink href="/community/challenges" icon="⚔️" label={t('nav.challenges')} />
          <QuickLink href="/community/badges" icon="🏅" label={t('nav.badges')} />
          <QuickLink href="/community/leaderboard" icon="🏆" label={t('nav.leaderboard')} />
          <QuickLink href="/community/groups" icon="👥" label={t('nav.groups')} />
          <QuickLink href="/data" icon="💾" label={t('nav.data')} />
          <QuickLink href="/settings" icon="⚙️" label={t('nav.settings')} />
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon, label, value, bg,
}: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground font-medium leading-tight">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/10 transition-colors"
    >
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ChevronRight size={14} className="ms-auto text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
