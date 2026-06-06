'use client';

// ============================================================
// SwingVantage Academy — standalone learner-progress store
// ------------------------------------------------------------
// Internal enablement data lives in its OWN persisted store
// (localStorage key `swingvantage-academy`), separate from the
// athlete-facing `swingiq-store` that syncs to user accounts.
// This mirrors the app's other secondary stores (Motion Lab,
// retest, DrillMatch) and keeps employee learning data out of
// the cloud-synced athlete state.
//
// Mutations award points, auto-claim eligible certifications,
// and award earned badges via the pure engine, so the UI stays
// presentational.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_ACADEMY_PROGRESS, POINTS,
  type AcademyProgress, type AcademyRoleId,
} from './types';
import { CERTIFICATIONS, getCertification } from './content';
import { earnedBadgeIds, isCertificationEligible } from './engine';

/** Auto-claim newly-eligible certifications and award newly-earned badges. */
function reconcileRewards(progress: AcademyProgress): AcademyProgress {
  const now = new Date().toISOString();
  let points = progress.points;
  const certifications = { ...progress.certifications };

  for (const cert of CERTIFICATIONS) {
    if (!certifications[cert.id] && isCertificationEligible(progress, cert)) {
      const expiresAt = cert.expiresMonths
        ? new Date(Date.now() + cert.expiresMonths * 30 * 24 * 3600 * 1000).toISOString()
        : null;
      certifications[cert.id] = { earnedAt: now, expiresAt };
      points += POINTS.certification;
    }
  }

  const withCerts: AcademyProgress = { ...progress, certifications, points };

  const earnedBadges = { ...withCerts.earnedBadges };
  for (const badgeId of earnedBadgeIds(withCerts)) {
    if (!earnedBadges[badgeId]) earnedBadges[badgeId] = now;
  }

  return { ...withCerts, earnedBadges };
}

export interface AcademyStore {
  progress: AcademyProgress;
  setRole: (roleId: AcademyRoleId | null) => void;
  completeLesson: (lessonId: string) => void;
  recordQuizAttempt: (quizId: string, score: number, passed: boolean) => void;
  submitChallenge: (challengeId: string) => void;
  claimCertification: (certId: string) => void;
  reset: () => void;
}

export const useAcademyStore = create<AcademyStore>()(
  persist(
    (set) => ({
      progress: DEFAULT_ACADEMY_PROGRESS,

      setRole: (roleId) =>
        set((s) => ({
          progress: {
            ...s.progress,
            roleId,
            startedAt: s.progress.startedAt ?? new Date().toISOString(),
          },
        })),

      completeLesson: (lessonId) =>
        set((s) => {
          if (s.progress.completedLessonIds.includes(lessonId)) return s;
          const now = new Date().toISOString();
          const next: AcademyProgress = {
            ...s.progress,
            completedLessonIds: [...s.progress.completedLessonIds, lessonId],
            points: s.progress.points + POINTS.lesson,
            startedAt: s.progress.startedAt ?? now,
            lastActivityAt: now,
          };
          return { progress: reconcileRewards(next) };
        }),

      recordQuizAttempt: (quizId, score, passed) =>
        set((s) => {
          const now = new Date().toISOString();
          const prev = s.progress.quizAttempts[quizId];
          const wasPassed = prev?.passed ?? false;
          const next: AcademyProgress = {
            ...s.progress,
            quizAttempts: {
              ...s.progress.quizAttempts,
              [quizId]: {
                attempts: (prev?.attempts ?? 0) + 1,
                bestScore: Math.max(prev?.bestScore ?? 0, score),
                passed: wasPassed || passed,
                lastAttemptAt: now,
              },
            },
            points: s.progress.points + (!wasPassed && passed ? POINTS.quizPass : 0),
            startedAt: s.progress.startedAt ?? now,
            lastActivityAt: now,
          };
          return { progress: reconcileRewards(next) };
        }),

      submitChallenge: (challengeId) =>
        set((s) => {
          if (s.progress.challengeSubmissions[challengeId]) return s;
          const now = new Date().toISOString();
          const next: AcademyProgress = {
            ...s.progress,
            challengeSubmissions: { ...s.progress.challengeSubmissions, [challengeId]: now },
            points: s.progress.points + POINTS.challenge,
            startedAt: s.progress.startedAt ?? now,
            lastActivityAt: now,
          };
          return { progress: reconcileRewards(next) };
        }),

      claimCertification: (certId) =>
        set((s) => {
          const cert = getCertification(certId);
          if (!cert || s.progress.certifications[certId]) return s;
          if (!isCertificationEligible(s.progress, cert)) return s;
          return { progress: reconcileRewards(s.progress) };
        }),

      reset: () => set({ progress: DEFAULT_ACADEMY_PROGRESS }),
    }),
    {
      name: 'swingvantage-academy',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
        }
        return localStorage;
      }),
    },
  ),
);
