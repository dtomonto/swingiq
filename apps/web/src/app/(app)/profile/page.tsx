'use client';

import { ProfileForm } from './ProfileForm';
import { SportProfileFormRouter } from './SportProfileForms';
import { FoundingProfileCard } from '@/components/founding/FoundingProfileCard';
import { ProfileIntelligenceHub } from '@/components/profile/ProfileIntelligenceHub';
import { useSport } from '@/contexts/SportContext';
import { SPORT_NAV_LABELS } from '@swingiq/core';

export default function ProfilePage() {
  const { activeSport } = useSport();
  const labels = SPORT_NAV_LABELS[activeSport] ?? SPORT_NAV_LABELS.golf;
  const sportEmojis: Record<string, string> = {
    golf: '⛳',
    tennis: '🎾',
    pickleball: '🏓',
    padel: '🎾',
    baseball: '⚾',
    softball_slow: '🥎',
    softball_fast: '🥎',
  };

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{sportEmojis[activeSport] ?? '🏃'}</span>
            <h1 className="text-2xl font-bold text-foreground">{labels.profile}</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Your profile helps SwingVantage personalize every analysis, routine, and recommendation.
            Take 3 minutes to fill this out accurately.
          </p>
        </div>
        <ProfileIntelligenceHub sport={activeSport} />
        <FoundingProfileCard />
        {activeSport === 'golf' ? (
          <ProfileForm />
        ) : (
          <SportProfileFormRouter sport={activeSport} />
        )}
      </div>
    </>
  );
}
