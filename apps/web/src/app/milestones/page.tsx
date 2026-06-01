'use client';

import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSwingIQStore, type LocalSession, type LocalClub, type TrainingProgress, type LocalVideoAnalysis } from '@/store';
import type { GolferProfileInput } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { useSport } from '@/contexts/SportContext';

interface Milestone {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'sessions' | 'practice' | 'score' | 'diagnosis' | 'equipment' | 'profile';
  earned: boolean;
  earnedAt?: string;
  hint?: string;
}

function computeMilestones(
  sessions: LocalSession[],
  training: TrainingProgress,
  clubs: LocalClub[],
  profile: GolferProfileInput | null,
  videoAnalyses: LocalVideoAnalysis[],
  isGolf: boolean,
  sportName: string,
  sportProfiles: Record<string, unknown>,
): Milestone[] {
  const sessionCount = sessions.length;
  const shotCount = sessions.reduce((s, sess) => s + sess.shots.length, 0);
  const diagnosedSessions = sessions.filter((s) => s.diagnoses.length > 0);
  const scoredSessions = sessions.filter((s) => s.swing_score !== null);
  const maxScore = scoredSessions.length > 0
    ? Math.max(...scoredSessions.map((s) => s.swing_score ?? 0))
    : 0;
  const drillCount = Object.keys(training.drills_completed).length;
  const streak = training.streak_days;
  const hasProfile = !!profile || Object.keys(sportProfiles).length > 0;
  const clubCount = clubs.length;
  const videoCount = videoAnalyses.length;
  const analyzedVideos = videoAnalyses.filter((v) => !!v.primary_issue);

  type ListEntry = Omit<Milestone, 'earned' | 'earnedAt'> & { check: boolean; date?: string };
  const list: ListEntry[] = [];

  // Profile
  list.push({
    id: 'profile_created', icon: '👤',
    title: 'Profile Built',
    description: `Created your ${sportName} player profile`,
    category: 'profile', check: hasProfile,
    hint: 'Complete your profile to unlock personalized coaching',
  });

  // Equipment (golf only)
  if (isGolf) {
    list.push({
      id: 'first_club', icon: '⛳', title: 'First Club Added',
      description: 'Added your first club to the bag',
      category: 'equipment', check: clubCount >= 1,
      hint: 'Add at least one club to your bag',
    });
    list.push({
      id: 'full_bag', icon: '🏌️', title: 'Full Bag',
      description: 'Added 8 or more clubs to your bag',
      category: 'equipment', check: clubCount >= 8,
      hint: `${Math.max(0, 8 - clubCount)} more clubs needed`,
    });
  }

  // Video milestones (non-golf only)
  if (!isGolf) {
    list.push({
      id: 'first_video', icon: '🎬', title: 'First Video Analyzed',
      description: `Uploaded and analyzed your first ${sportName} video`,
      category: 'sessions', check: videoCount >= 1,
      hint: 'Upload a video on the Video Analysis page',
    });
    list.push({
      id: 'five_videos', icon: '🎥', title: 'Film Student',
      description: `Analyzed 5 ${sportName} videos`,
      category: 'sessions', check: videoCount >= 5,
      hint: `${Math.max(0, 5 - videoCount)} more videos needed`,
    });
    list.push({
      id: 'first_issue_detected', icon: '🔍', title: 'Issue Identified',
      description: 'Had a primary issue detected in a video analysis',
      category: 'diagnosis', check: analyzedVideos.length >= 1,
      hint: 'Upload a video to detect your primary issue',
    });
  }

  // Sessions (shared)
  list.push({
    id: 'first_session', icon: '📊',
    title: isGolf ? 'First Session' : `First ${sportName} Log`,
    description: isGolf ? 'Imported your first launch-monitor session' : `Logged your first ${sportName} session`,
    category: 'sessions', check: sessionCount >= 1 || videoCount >= 1,
    date: sessions[sessions.length - 1]?.created_at,
    hint: isGolf ? 'Import your first CSV file' : 'Log or upload your first session',
  });

  // Sessions (shared)
  list.push({ id: 'five_sessions', icon: '📈', title: 'Getting Consistent', description: 'Logged 5 sessions', category: 'sessions', check: sessionCount >= 5, hint: `${Math.max(0, 5 - sessionCount)} more sessions needed` });
  list.push({ id: 'ten_sessions', icon: '🌟', title: 'Data Veteran', description: 'Logged 10 sessions', category: 'sessions', check: sessionCount >= 10, hint: `${Math.max(0, 10 - sessionCount)} more sessions needed` });

  // Golf-specific: shot counts
  if (isGolf) {
    list.push({ id: 'hundred_shots', icon: '🎯', title: 'Hundred Shots', description: 'Analyzed 100+ shots', category: 'sessions', check: shotCount >= 100, hint: `${Math.max(0, 100 - shotCount)} more shots needed` });
    list.push({ id: 'five_hundred_shots', icon: '💯', title: 'Range Warrior', description: 'Analyzed 500+ shots', category: 'sessions', check: shotCount >= 500, hint: `${Math.max(0, 500 - shotCount)} more shots needed` });
    list.push({ id: 'first_diagnosis', icon: '🔍', title: 'Diagnosed', description: 'Ran your first swing diagnosis', category: 'diagnosis', check: diagnosedSessions.length >= 1, hint: 'Run the diagnostic engine on a session' });
    list.push({ id: 'three_diagnoses', icon: '🧠', title: 'Pattern Seeker', description: 'Diagnosed 3 different sessions', category: 'diagnosis', check: diagnosedSessions.length >= 3, hint: `${Math.max(0, 3 - diagnosedSessions.length)} more diagnosed sessions needed` });
    list.push({ id: 'score_50', icon: '📉', title: 'On the Board', description: 'Achieved a swing score of 50+', category: 'score', check: maxScore >= 50, hint: 'Import a session and reach a swing score of 50' });
    list.push({ id: 'score_65', icon: '🏅', title: 'Mid-Range Scorer', description: 'Achieved a swing score of 65+', category: 'score', check: maxScore >= 65, hint: `Best score: ${maxScore} — need 65` });
    list.push({ id: 'score_80', icon: '🥇', title: 'High Performer', description: 'Achieved a swing score of 80+', category: 'score', check: maxScore >= 80, hint: `Best score: ${maxScore} — need 80` });
    list.push({ id: 'score_90', icon: '🏆', title: 'Tour Territory', description: 'Achieved a swing score of 90+', category: 'score', check: maxScore >= 90, hint: `Best score: ${maxScore} — need 90` });
  }

  // Practice (shared)
  list.push({ id: 'first_drill', icon: '🏋️', title: 'First Drill', description: 'Completed your first drill', category: 'practice', check: drillCount >= 1, hint: 'Go to Training and check off your first drill step' });
  list.push({ id: 'five_drills', icon: '🔥', title: 'Drill Machine', description: 'Completed 5 different drills', category: 'practice', check: drillCount >= 5, hint: `${Math.max(0, 5 - drillCount)} more drills needed` });
  list.push({ id: 'streak_3', icon: '🔥', title: '3-Day Streak', description: 'Practiced 3 days in a row', category: 'practice', check: streak >= 3, hint: `Current streak: ${streak} days` });
  list.push({ id: 'streak_7', icon: '⚡', title: 'Week Warrior', description: 'Practiced 7 days in a row', category: 'practice', check: streak >= 7, hint: `Current streak: ${streak} days` });
  list.push({ id: 'streak_30', icon: '🌟', title: 'Dedicated Athlete', description: 'Practiced 30 days in a row', category: 'practice', check: streak >= 30, hint: `Current streak: ${streak} days` });

  return list.map((m) => ({
    id: m.id,
    icon: m.icon,
    title: m.title,
    description: m.description,
    category: m.category,
    earned: m.check,
    earnedAt: m.date,
    hint: m.hint,
  }));
}

const CATEGORY_COLORS: Record<string, string> = {
  sessions: 'bg-blue-100 text-blue-700',
  practice: 'bg-orange-100 text-orange-700',
  score: 'bg-green-100 text-green-700',
  diagnosis: 'bg-purple-100 text-purple-700',
  equipment: 'bg-yellow-100 text-yellow-700',
  profile: 'bg-pink-100 text-pink-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  sessions: 'Sessions',
  practice: 'Practice',
  score: 'Score',
  diagnosis: 'Diagnosis',
  equipment: 'Equipment',
  profile: 'Profile',
};

export default function MilestonesPage() {
  const { sessions, training, clubs, profile, sportProfiles, video_analyses } = useSwingIQStore();
  const { isGolf, sportName, sportEmoji, activeSport } = useSport();

  // Filter sessions and videos by active sport
  const sportSessions = useMemo(
    () => sessions.filter((s) => isGolf ? (s.sport === 'golf' || !s.sport) : s.sport === activeSport),
    [sessions, activeSport, isGolf],
  );
  const sportVideos = useMemo(
    () => video_analyses.filter((v) => v.sport === activeSport),
    [video_analyses, activeSport],
  );

  const milestones = useMemo(
    () => computeMilestones(
      sportSessions, training, clubs, profile, sportVideos, isGolf, sportName,
      sportProfiles as Record<string, unknown>,
    ),
    [sportSessions, training, clubs, profile, sportVideos, isGolf, sportName, sportProfiles],
  );

  const earned = milestones.filter((m) => m.earned);
  const unearned = milestones.filter((m) => !m.earned);
  const pct = milestones.length > 0 ? Math.round((earned.length / milestones.length) * 100) : 0;

  const byCategory = milestones.reduce<Record<string, Milestone[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category]!.push(m);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {sportEmoji} {sportName} Milestones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {earned.length} of {milestones.length} earned · {pct}% complete
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardBody className="py-4">
              <p className="text-3xl font-black text-green-600">{earned.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Earned</p>
            </CardBody>
          </Card>
          <Card className="text-center">
            <CardBody className="py-4">
              <p className="text-3xl font-black text-gray-400">{unearned.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Remaining</p>
            </CardBody>
          </Card>
          <Card className="text-center">
            <CardBody className="py-4">
              <p className="text-3xl font-black text-blue-600">{pct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Complete</p>
            </CardBody>
          </Card>
        </div>

        {/* By category */}
        {Object.entries(byCategory).map(([cat, items]) => {
          const catEarned = items.filter((m) => m.earned).length;
          return (
            <Card key={cat}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600')}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <CardTitle>{CATEGORY_LABELS[cat] ?? cat}</CardTitle>
                  </div>
                  <span className="text-xs text-gray-500">{catEarned}/{items.length}</span>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {items.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'rounded-xl p-4 border text-center transition-all',
                        m.earned
                          ? 'bg-green-50 border-green-200 shadow-xs'
                          : 'bg-gray-50 border-gray-200 opacity-60',
                      )}
                    >
                      <div className={cn('text-3xl mb-2', m.earned ? '' : 'grayscale')}>
                        {m.earned ? m.icon : '🔒'}
                      </div>
                      <p className={cn('text-sm font-bold', m.earned ? 'text-gray-900' : 'text-gray-400')}>
                        {m.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{m.description}</p>
                      {m.earned ? (
                        <Badge variant="default" className="mt-2 text-xs bg-green-100 text-green-700">
                          ✓ Earned
                        </Badge>
                      ) : m.hint ? (
                        <p className="text-xs text-gray-400 mt-2 italic">{m.hint}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
