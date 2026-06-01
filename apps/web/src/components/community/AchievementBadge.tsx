'use client';

// ============================================================
// SwingIQ — Achievement Badge Component
// Displays earned/locked badges with progress indicators.
// ============================================================

import { Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AchievementDefinition } from '@/lib/community/types';
import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  earned: boolean;
  earnedAt?: string;
  progress: number;
  progressPercent: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function AchievementBadge({
  achievement,
  earned,
  earnedAt,
  progress,
  progressPercent,
  size = 'md',
  showProgress = true,
}: AchievementBadgeProps) {
  const { t } = useLanguage();

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all',
        sizeClasses[size],
        earned
          ? 'bg-white border-green-200 shadow-xs hover:shadow-md'
          : 'bg-gray-50 border-gray-200 opacity-70'
      )}
      role="article"
      aria-label={`${achievement.name}: ${earned ? t('achievements.unlocked') : t('achievements.locked')}`}
    >
      {/* Icon */}
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          'relative rounded-full flex items-center justify-center',
          size === 'sm' ? 'w-10 h-10' : 'w-12 h-12',
          earned ? 'bg-green-50' : 'bg-gray-100'
        )}>
          <span className={iconSizes[size]} aria-hidden="true">{achievement.icon}</span>
          {!earned && (
            <div className="absolute inset-0 rounded-full bg-gray-200/50 flex items-center justify-center">
              <Lock size={size === 'sm' ? 10 : 12} className="text-gray-500" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{achievement.name}</p>
          <p className={cn('text-xs', earned ? 'text-green-600' : 'text-gray-500')}>
            {earned ? t('achievements.unlocked') : t('achievements.locked')}
          </p>
        </div>

        {earned && (
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
            +{achievement.xpReward} {t('common.xp')}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{achievement.description}</p>

      {/* Progress bar (for locked achievements) */}
      {!earned && showProgress && achievement.maxProgress > 1 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{t('achievements.progress')}</span>
            <span>{progress} / {achievement.maxProgress}</span>
          </div>
          <div
            className="h-1.5 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${achievement.name} ${t('achievements.progress')}: ${progressPercent}%`}
          >
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Earned date */}
      {earned && earnedAt && (
        <p className="text-xs text-gray-400 mt-1">
          {t('achievements.earnedOn')} {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
