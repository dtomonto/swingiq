'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { AchievementBadge } from '@/components/community/AchievementBadge';
import { useSwingVantageStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { ACHIEVEMENTS, computeAchievementProgress, syncEarnedAchievements } from '@/lib/community/achievements';
import { Award } from 'lucide-react';
import type { AchievementContext, AchievementCategory } from '@/lib/community/types';
import { cn } from '@/lib/utils';

const CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'data_protection', label: 'Data Protection' },
  { id: 'improvement', label: 'Improvement' },
  { id: 'sport_mastery', label: 'Sport Mastery' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'coachability', label: 'Coachability' },
];

export default function BadgesPage() {
  const { t } = useLanguage();
  const { sessions, video_analyses, training, community } = useSwingVantageStore();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [tab, setTab] = useState<'all' | 'earned' | 'locked'>('all');

  const achievementCtx: AchievementContext = {
    sessions,
    videoAnalyses: video_analyses,
    training,
    lastExportAt: community.lastExportAt,
    exportCount: community.exportCount,
    challengesCompleted: community.challengesCompleted,
  };

  const { newEarned } = syncEarnedAchievements(achievementCtx, community.achievementsEarned);
  const allEarned = [...community.achievementsEarned, ...newEarned];
  const earnedIds = new Set(allEarned.map(a => a.id));

  const filteredAchievements = ACHIEVEMENTS
    .filter(a => activeCategory === 'all' || a.category === activeCategory)
    .filter(a => {
      if (tab === 'earned') return earnedIds.has(a.id);
      if (tab === 'locked') return !earnedIds.has(a.id);
      return true;
    });

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award size={24} className="text-warning" aria-hidden="true" />
            {t('achievements.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('achievements.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary inline-block" aria-hidden="true" />
            <span className="font-semibold">{allEarned.length}</span>
            <span className="text-muted-foreground">{t('achievements.earnedBadges')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-muted inline-block" aria-hidden="true" />
            <span className="font-semibold">{ACHIEVEMENTS.length - allEarned.length}</span>
            <span className="text-muted-foreground">{t('achievements.lockedBadges')}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit" role="tablist" aria-label={t('achievements.title')}>
          {(['all', 'earned', 'locked'] as const).map(tabId => (
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
              {tabId === 'all' ? t('achievements.allBadges')
                : tabId === 'earned' ? t('achievements.earnedBadges')
                : t('achievements.lockedBadges')}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div
          className="flex gap-2 flex-wrap"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges grid */}
        {filteredAchievements.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12 space-y-2">
              <span className="text-4xl" aria-hidden="true">🏅</span>
              <p className="text-muted-foreground text-sm">{t('achievements.noAchievements')}</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
            {filteredAchievements.map(achievement => {
              const earned = allEarned.find(e => e.id === achievement.id);
              const { progress, percent: progressPercent } = computeAchievementProgress(achievement, achievementCtx);
              return (
                <div key={achievement.id} role="listitem">
                  <AchievementBadge
                    achievement={achievement}
                    earned={!!earned}
                    earnedAt={earned?.earnedAt}
                    progress={progress}
                    progressPercent={progressPercent}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state for no sessions */}
        {sessions.length === 0 && video_analyses.length === 0 && (
          <Card>
            <CardBody className="bg-warning/10 border-warning/30 rounded-xl p-4">
              <p className="text-sm text-warning font-medium">
                {t('empty.noSessions')}
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
