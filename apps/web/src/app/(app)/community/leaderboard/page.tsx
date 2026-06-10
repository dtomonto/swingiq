'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useSwingVantageStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trophy, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaderboardMetric } from '@/lib/community/types';
import { calculateLevelFromXP } from '@/lib/community/xp';

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const { sessions, video_analyses, training, community } = useSwingVantageStore();
  const [metric, setMetric] = useState<LeaderboardMetric>('sessions_completed');

  const displayName = community.profile.displayName || 'You';
  const totalSessions = sessions.length + video_analyses.length;
  const { level } = calculateLevelFromXP(community.xpTotal);

  // Privacy guard — only show leaderboard if user hasn't opted out
  const isOptedOut = community.privacy.leaderboardOptOut;

  // Build a local leaderboard from user's own data
  // In a future cloud version, this would pull from Supabase
  const myEntry = {
    rank: 1,
    displayName: isOptedOut ? t('leaderboard.anonymous') : displayName,
    value: getMyValue(metric, totalSessions, training.streak_days, community.xpTotal, community.exportCount),
    isCurrentUser: true,
    anonymous: isOptedOut,
  };

  const metrics: { id: LeaderboardMetric; label: string }[] = [
    { id: 'sessions_completed', label: t('leaderboard.sessions') },
    { id: 'current_streak', label: t('leaderboard.streak') },
    { id: 'challenge_points', label: t('leaderboard.points') },
    { id: 'export_discipline', label: t('leaderboard.exportDiscipline') },
  ];

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-24">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy size={24} className="text-warning" aria-hidden="true" />
            {t('leaderboard.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('leaderboard.subtitle')}</p>
        </div>

        {/* Privacy notice */}
        <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4 text-sm text-foreground">
          <Shield size={18} className="shrink-0 mt-0.5 text-accent-secondary" aria-hidden="true" />
          <div>
            <p className="font-semibold">Privacy-Safe Rankings</p>
            <p>
              SwingVantage leaderboards rank by improvement and consistency, not just raw scores.
              Your exact metrics are never shared publicly without your consent.
              {isOptedOut ? ' You are currently displayed anonymously.' : ''}
            </p>
          </div>
        </div>

        {/* Metric tabs */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Leaderboard metric">
          {metrics.map(m => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              aria-pressed={metric === m.id}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                metric === m.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Leaderboard table */}
        <Card>
          <CardHeader>
            <CardTitle>{metrics.find(m => m.id === metric)?.label} — {t('leaderboard.open')}</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label={`${t('leaderboard.title')} — ${metrics.find(m => m.id === metric)?.label}`}>
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('leaderboard.rank')}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('leaderboard.athlete')}</th>
                    <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('leaderboard.metric')}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Current user's entry */}
                  <tr className="bg-primary/10 border-b border-primary/20">
                    <td className="px-4 py-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-warning text-white text-xs font-bold" aria-label="Rank 1">
                        1
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {myEntry.displayName}
                          <span className="ms-2 text-xs text-primary bg-primary/15 px-1.5 py-0.5 rounded-sm">You</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Level {level}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end font-bold text-foreground">{formatValue(metric, myEntry.value)}</td>
                  </tr>

                  {/* No-data notice */}
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Info size={20} aria-hidden="true" />
                        <p className="text-sm">Cloud leaderboards coming soon.</p>
                        <p className="text-xs">For now, your personal stats are shown. Invite friends to compare progress.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Opt out toggle */}
        <Card>
          <CardBody>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!isOptedOut}
                onChange={(e) => {
                  useSwingVantageStore.getState().updateCommunity({
                    privacy: { ...community.privacy, leaderboardOptOut: !e.target.checked },
                  });
                }}
                className="mt-0.5 w-4 h-4 rounded-sm text-primary"
                aria-label={t('leaderboard.optIn')}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{t('leaderboard.optIn')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Appear on leaderboards. You can use an anonymous display name in your profile settings.
                </p>
              </div>
            </label>
          </CardBody>
        </Card>

        {/* Empty / no sessions */}
        {totalSessions === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t('leaderboard.noData')}
          </div>
        )}
      </div>
    </>
  );
}

function getMyValue(metric: LeaderboardMetric, sessions: number, streak: number, xp: number, exportCount: number): number {
  switch (metric) {
    case 'sessions_completed': return sessions;
    case 'current_streak': return streak;
    case 'challenge_points': return xp;
    case 'export_discipline': return exportCount;
    default: return sessions;
  }
}

function formatValue(metric: LeaderboardMetric, value: number): string {
  switch (metric) {
    case 'sessions_completed': return `${value} sessions`;
    case 'current_streak': return `${value}d`;
    case 'challenge_points': return `${value} XP`;
    case 'export_discipline': return `${value} exports`;
    default: return String(value);
  }
}
