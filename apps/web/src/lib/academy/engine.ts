// ============================================================
// SwingVantage Academy — Derivation engine (pure functions)
// ------------------------------------------------------------
// All progress %, readiness scores, recommendations, and
// badge/certification eligibility are computed here from
// (content + AcademyProgress). No React, no store — easy to test.
// ============================================================
import type {
  AcademyProgress, AcademyRoleId, Certification, Course, MasteryLevel, VantagePath,
} from './types';
import { MASTERY_LEVELS } from './types';
import {
  COURSES, PATHS, CERTIFICATIONS, getCourse, getPath, getRole,
  courseLessonIds, pathLessonIds,
} from './content';

const pct = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100));

// ── Lessons / courses / paths completion ─────────────────────

export function isLessonComplete(progress: AcademyProgress, lessonId: string): boolean {
  return progress.completedLessonIds.includes(lessonId);
}

export function courseProgress(progress: AcademyProgress, course: Course) {
  const lessonIds = courseLessonIds(course);
  const done = lessonIds.filter((id) => progress.completedLessonIds.includes(id)).length;
  return { done, total: lessonIds.length, percent: pct(done, lessonIds.length) };
}

export const isCourseComplete = (progress: AcademyProgress, course: Course): boolean =>
  courseProgress(progress, course).percent === 100;

export function pathProgress(progress: AcademyProgress, path: VantagePath) {
  const lessonIds = pathLessonIds(path);
  const done = lessonIds.filter((id) => progress.completedLessonIds.includes(id)).length;
  return { done, total: lessonIds.length, percent: pct(done, lessonIds.length) };
}

// ── Quizzes ──────────────────────────────────────────────────

export const hasPassedQuiz = (progress: AcademyProgress, quizId: string): boolean =>
  !!progress.quizAttempts[quizId]?.passed;

// ── Certifications ───────────────────────────────────────────

/** 0–100 readiness toward a certification (courses + challenges + final). */
export function certificationReadiness(progress: AcademyProgress, cert: Certification): number {
  const parts: number[] = [];
  for (const cid of cert.requiredCourseIds) {
    const c = getCourse(cid);
    if (c) parts.push(courseProgress(progress, c).percent);
  }
  for (const chId of cert.requiredChallengeIds ?? []) {
    parts.push(progress.challengeSubmissions[chId] ? 100 : 0);
  }
  if (cert.finalAssessmentQuizId) {
    parts.push(hasPassedQuiz(progress, cert.finalAssessmentQuizId) ? 100 : 0);
  }
  if (parts.length === 0) return 0;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function isCertificationEligible(progress: AcademyProgress, cert: Certification): boolean {
  const coursesDone = cert.requiredCourseIds.every((cid) => {
    const c = getCourse(cid);
    return c ? isCourseComplete(progress, c) : false;
  });
  const challengesDone = (cert.requiredChallengeIds ?? []).every(
    (chId) => !!progress.challengeSubmissions[chId],
  );
  const finalDone = cert.finalAssessmentQuizId
    ? hasPassedQuiz(progress, cert.finalAssessmentQuizId)
    : true;
  return coursesDone && challengesDone && finalDone;
}

export const isCertified = (progress: AcademyProgress, certId: string): boolean =>
  !!progress.certifications[certId] && !isCertificationExpired(progress, certId);

export function isCertificationExpired(progress: AcademyProgress, certId: string): boolean {
  const rec = progress.certifications[certId];
  if (!rec || !rec.expiresAt) return false;
  return new Date(rec.expiresAt).getTime() < Date.now();
}

// ── Mastery / scores ─────────────────────────────────────────

export function masteryLevel(progress: AcademyProgress): MasteryLevel {
  let level = MASTERY_LEVELS[0];
  for (const l of MASTERY_LEVELS) if (progress.points >= l.minPoints) level = l;
  return level;
}

export function nextMastery(progress: AcademyProgress): { next: MasteryLevel | null; toNext: number } {
  const idx = MASTERY_LEVELS.findIndex((l) => l.id === masteryLevel(progress).id);
  const next = MASTERY_LEVELS[idx + 1] ?? null;
  return { next, toNext: next ? Math.max(0, next.minPoints - progress.points) : 0 };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Consecutive-day learning streak ending today (or yesterday if today is idle). */
export function currentStreak(progress: AcademyProgress): number {
  const days = new Set(progress.activityDays ?? []);
  if (days.size === 0) return 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // grace: still counts through yesterday
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Learning momentum: % of the last 7 days with any activity. */
export function momentumScore(progress: AcademyProgress): number {
  const days = new Set(progress.activityDays ?? []);
  let active = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (days.has(dayKey(d))) active += 1;
  }
  return Math.round((active / 7) * 100);
}

/** Certifications the learner can claim right now but hasn't yet. */
export function claimableCertifications(progress: AcademyProgress): Certification[] {
  return CERTIFICATIONS.filter(
    (c) => !progress.certifications[c.id] && isCertificationEligible(progress, c),
  );
}

/** Readiness score toward the certification a cert id names (0–100). */
export const readinessFor = (progress: AcademyProgress, certId: string): number => {
  const cert = CERTIFICATIONS.find((c) => c.id === certId);
  return cert ? certificationReadiness(progress, cert) : 0;
};

/** Demo Readiness = readiness toward the Sales cert. */
export const demoReadiness = (p: AcademyProgress) => readinessFor(p, 'cert-sales');
/** Support Readiness = readiness toward the Support cert. */
export const supportReadiness = (p: AcademyProgress) => readinessFor(p, 'cert-support');

/** Feature Fluency = overall % of all lessons completed. */
export function featureFluency(progress: AcademyProgress): number {
  const total = COURSES.reduce((n, c) => n + courseLessonIds(c).length, 0);
  const allLessonIds = new Set(COURSES.flatMap((c) => courseLessonIds(c)));
  const done = progress.completedLessonIds.filter((id) => allLessonIds.has(id)).length;
  return pct(done, total);
}

// ── Recommendations ──────────────────────────────────────────

export interface Recommendation {
  course: Course;
  reason: string;
  percent: number;
}

/** Paths recommended for a role, in priority order. */
export function recommendedPaths(roleId: AcademyRoleId | null): VantagePath[] {
  if (!roleId) return PATHS.filter((p) => p.roleIds === 'all');
  const role = getRole(roleId);
  if (!role) return PATHS;
  const slugs = role.recommendedPathSlugs;
  const picked = slugs.map((s) => PATHS.find((p) => p.slug === s)).filter(Boolean) as VantagePath[];
  // Always include the "all" foundations-style paths.
  const extras = PATHS.filter((p) => p.roleIds === 'all' && !picked.includes(p));
  return [...picked, ...extras];
}

/**
 * The single best "next course" for a learner: the first incomplete course in
 * their role's recommended paths, preferring one already in progress.
 */
export function nextRecommendedCourse(progress: AcademyProgress): Recommendation | null {
  const paths = recommendedPaths(progress.roleId);
  let firstIncomplete: Recommendation | null = null;
  for (const path of paths) {
    for (const cid of path.courseIds) {
      const course = getCourse(cid);
      if (!course) continue;
      const { percent } = courseProgress(progress, course);
      if (percent === 100) continue;
      const rec: Recommendation = {
        course,
        percent,
        reason: percent > 0
          ? `You're ${percent}% through this — finish it next.`
          : `Recommended for your role in "${path.title}".`,
      };
      if (percent > 0) return rec; // prefer in-progress
      if (!firstIncomplete) firstIncomplete = rec;
    }
  }
  return firstIncomplete;
}

/** A short advisor message, e.g. "You're 72% ready for Coach Mode Certification…". */
export function advisorMessage(progress: AcademyProgress): string {
  const role = progress.roleId ? getRole(progress.roleId) : null;
  const certId = role?.targetCertificationId;
  if (certId) {
    const cert = CERTIFICATIONS.find((c) => c.id === certId);
    if (cert) {
      const r = certificationReadiness(progress, cert);
      if (r >= 100 && !isCertified(progress, certId)) {
        return `You've met every requirement for ${cert.name}. Claim it in the Certification Center.`;
      }
      if (r > 0) {
        const next = nextRecommendedCourse(progress);
        return `You're ${r}% ready for ${cert.name}.` +
          (next ? ` Do "${next.course.title}" next.` : '');
      }
    }
  }
  const next = nextRecommendedCourse(progress);
  return next
    ? `Start with "${next.course.title}" — ${next.reason}`
    : 'You’ve completed your recommended path. Explore the catalog for more.';
}

// ── Badge eligibility ────────────────────────────────────────

/**
 * Which badge ids the learner has now earned (course-completion badges +
 * certification badges). Pure — the store diffs this against earnedBadges.
 */
export function earnedBadgeIds(progress: AcademyProgress): string[] {
  const ids = new Set<string>();
  for (const course of COURSES) {
    if (course.badgeId && isCourseComplete(progress, course)) ids.add(course.badgeId);
  }
  for (const path of PATHS) {
    // path-completion badge piggybacks on the path's first course badge? No —
    // path badges come via certifications below.
    void path;
  }
  for (const cert of CERTIFICATIONS) {
    if (progress.certifications[cert.id]) ids.add(cert.badgeId);
  }
  // Video path → b-video-pro when the whole video path is complete.
  const videoPath = getPath('path-video');
  if (videoPath) {
    const allDone = videoPath.courseIds.every((cid) => {
      const c = getCourse(cid);
      return c ? isCourseComplete(progress, c) : false;
    });
    if (allDone) ids.add('b-video-pro');
  }
  return [...ids];
}
