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
// Mutations award points, track activity days (streaks), auto-
// claim eligible certifications, and award earned badges via the
// pure engine, so the UI stays presentational.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_ACADEMY_PROGRESS, POINTS,
  type AcademyProgress, type AcademyRoleId, type Assignment,
} from './types';
import { CERTIFICATIONS, getCertification } from './content';
import { earnedBadgeIds, isCertificationEligible } from './engine';

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Stamp activity: startedAt, lastActivityAt, and today in activityDays. */
function touch(p: AcademyProgress): AcademyProgress {
  const now = new Date().toISOString();
  const day = todayKey();
  const activityDays = p.activityDays ?? [];
  return {
    ...p,
    startedAt: p.startedAt ?? now,
    lastActivityAt: now,
    activityDays: activityDays.includes(day) ? activityDays : [...activityDays, day],
  };
}

function expiryFor(months: number | null): string | null {
  return months ? new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString() : null;
}

/** Auto-claim newly-eligible certifications and award newly-earned badges. */
function reconcileRewards(progress: AcademyProgress): AcademyProgress {
  const now = new Date().toISOString();
  let points = progress.points;
  const certifications = { ...progress.certifications };

  for (const cert of CERTIFICATIONS) {
    if (!certifications[cert.id] && isCertificationEligible(progress, cert)) {
      certifications[cert.id] = { earnedAt: now, expiresAt: expiryFor(cert.expiresMonths) };
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
  setLearnerName: (name: string) => void;
  completeLesson: (lessonId: string) => void;
  recordQuizAttempt: (quizId: string, score: number, passed: boolean) => void;
  recordSimulation: (simId: string, score: number, passed: boolean) => void;
  submitChallenge: (challengeId: string) => void;
  claimCertification: (certId: string) => void;
  recertify: (certId: string) => void;
  assign: (targetType: 'course' | 'path', targetId: string, dueAt?: string, assignedBy?: string) => void;
  unassign: (id: string) => void;
  reset: () => void;
}

export const useAcademyStore = create<AcademyStore>()(
  persist(
    (set) => ({
      progress: DEFAULT_ACADEMY_PROGRESS,

      setRole: (roleId) =>
        set((s) => ({ progress: touch({ ...s.progress, roleId }) })),

      setLearnerName: (name) =>
        set((s) => ({ progress: { ...s.progress, learnerName: name.trim() || undefined } })),

      completeLesson: (lessonId) =>
        set((s) => {
          if (s.progress.completedLessonIds.includes(lessonId)) return s;
          const next: AcademyProgress = {
            ...touch(s.progress),
            completedLessonIds: [...s.progress.completedLessonIds, lessonId],
            points: s.progress.points + POINTS.lesson,
          };
          return { progress: reconcileRewards(next) };
        }),

      recordQuizAttempt: (quizId, score, passed) =>
        set((s) => {
          const prev = s.progress.quizAttempts[quizId];
          const wasPassed = prev?.passed ?? false;
          const next: AcademyProgress = {
            ...touch(s.progress),
            quizAttempts: {
              ...s.progress.quizAttempts,
              [quizId]: {
                attempts: (prev?.attempts ?? 0) + 1,
                bestScore: Math.max(prev?.bestScore ?? 0, score),
                passed: wasPassed || passed,
                lastAttemptAt: new Date().toISOString(),
              },
            },
            points: s.progress.points + (!wasPassed && passed ? POINTS.quizPass : 0),
          };
          return { progress: reconcileRewards(next) };
        }),

      recordSimulation: (simId, score, passed) =>
        set((s) => {
          const prev = s.progress.simulationAttempts?.[simId];
          const wasPassed = prev?.passed ?? false;
          const next: AcademyProgress = {
            ...touch(s.progress),
            simulationAttempts: {
              ...(s.progress.simulationAttempts ?? {}),
              [simId]: {
                attempts: (prev?.attempts ?? 0) + 1,
                bestScore: Math.max(prev?.bestScore ?? 0, score),
                passed: wasPassed || passed,
                lastAttemptAt: new Date().toISOString(),
              },
            },
            points: s.progress.points + (!wasPassed && passed ? POINTS.simulation : 0),
          };
          return { progress: reconcileRewards(next) };
        }),

      submitChallenge: (challengeId) =>
        set((s) => {
          if (s.progress.challengeSubmissions[challengeId]) return s;
          const next: AcademyProgress = {
            ...touch(s.progress),
            challengeSubmissions: { ...s.progress.challengeSubmissions, [challengeId]: new Date().toISOString() },
            points: s.progress.points + POINTS.challenge,
          };
          return { progress: reconcileRewards(next) };
        }),

      claimCertification: (certId) =>
        set((s) => {
          const cert = getCertification(certId);
          if (!cert || s.progress.certifications[certId]) return s;
          if (!isCertificationEligible(s.progress, cert)) return s;
          return { progress: reconcileRewards(touch(s.progress)) };
        }),

      recertify: (certId) =>
        set((s) => {
          const cert = getCertification(certId);
          const rec = s.progress.certifications[certId];
          if (!cert || !rec) return s;
          if (!isCertificationEligible(s.progress, cert)) return s;
          return {
            progress: touch({
              ...s.progress,
              certifications: {
                ...s.progress.certifications,
                [certId]: { earnedAt: new Date().toISOString(), expiresAt: expiryFor(cert.expiresMonths) },
              },
            }),
          };
        }),

      assign: (targetType, targetId, dueAt, assignedBy) =>
        set((s) => {
          const existing = (s.progress.assignments ?? []).filter(
            (a) => !(a.targetType === targetType && a.targetId === targetId),
          );
          const assignment: Assignment = {
            id: `as-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            targetType, targetId, dueAt, assignedBy, createdAt: new Date().toISOString(),
          };
          return { progress: { ...s.progress, assignments: [...existing, assignment] } };
        }),

      unassign: (id) =>
        set((s) => ({
          progress: { ...s.progress, assignments: (s.progress.assignments ?? []).filter((a) => a.id !== id) },
        })),

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
      // Older persisted state may predate activityDays — backfill so engine guards hold.
      migrate: (persisted) => {
        const p = persisted as { progress?: Partial<AcademyProgress> } | undefined;
        if (p?.progress && !p.progress.activityDays) p.progress.activityDays = [];
        if (p?.progress && !p.progress.assignments) p.progress.assignments = [];
        if (p?.progress && !p.progress.simulationAttempts) p.progress.simulationAttempts = {};
        return p as never;
      },
      version: 4,
    },
  ),
);
