// ============================================================
// SwingVantage Academy — analytics (pure derivation)
// ------------------------------------------------------------
// Catalog coverage, completion distribution, certification
// readiness, and weak areas for the current learner. Cross-
// learner / department rollups require the cloud backend
// (future) — these compute honestly from local state only.
// ============================================================
import type { AcademyProgress, Difficulty } from './types';
import { COURSES, PATHS, CERTIFICATIONS, courseLessonIds } from './content';
import {
  isCourseComplete, pathProgress, certificationReadiness, isCertified,
  featureFluency, masteryLevel, currentStreak, momentumScore,
} from './engine';

export interface CatalogCoverage {
  lessonsDone: number; lessonsTotal: number;
  coursesComplete: number; coursesTotal: number;
  pathsComplete: number; pathsTotal: number;
}

export function catalogCoverage(progress: AcademyProgress): CatalogCoverage {
  const allLessonIds = new Set(COURSES.flatMap(courseLessonIds));
  const lessonsDone = progress.completedLessonIds.filter((id) => allLessonIds.has(id)).length;
  return {
    lessonsDone, lessonsTotal: allLessonIds.size,
    coursesComplete: COURSES.filter((c) => isCourseComplete(progress, c)).length,
    coursesTotal: COURSES.length,
    pathsComplete: PATHS.filter((p) => pathProgress(progress, p).percent === 100).length,
    pathsTotal: PATHS.length,
  };
}

export function completionByDifficulty(progress: AcademyProgress) {
  const diffs: Difficulty[] = ['foundational', 'intermediate', 'advanced'];
  return diffs.map((difficulty) => {
    const courses = COURSES.filter((c) => c.difficulty === difficulty);
    return {
      difficulty,
      done: courses.filter((c) => isCourseComplete(progress, c)).length,
      total: courses.length,
    };
  });
}

export function certReadinessSummary(progress: AcademyProgress) {
  return CERTIFICATIONS.map((c) => ({
    id: c.id, name: c.name, emoji: c.emoji,
    earned: isCertified(progress, c.id),
    ready: certificationReadiness(progress, c),
  }));
}

export function weakQuizzes(progress: AcademyProgress) {
  return Object.entries(progress.quizAttempts)
    .filter(([, r]) => !r.passed)
    .map(([id, r]) => ({ id, bestScore: r.bestScore, attempts: r.attempts }));
}

/** A self-contained progress report (for export / copy). */
export function progressExport(progress: AcademyProgress) {
  return {
    exportedAt: new Date().toISOString(),
    learnerName: progress.learnerName ?? null,
    role: progress.roleId,
    points: progress.points,
    masteryLevel: masteryLevel(progress).label,
    featureFluency: featureFluency(progress),
    streakDays: currentStreak(progress),
    momentum: momentumScore(progress),
    coverage: catalogCoverage(progress),
    certifications: certReadinessSummary(progress),
  };
}
