// SwingVantage Academy — content integrity + engine + store tests.
import {
  PATHS, COURSES, LESSONS, QUIZZES, CHALLENGES, CERTIFICATIONS, ROLES,
  getLesson, getQuiz, getChallenge, getCourse, getBadge, getCertification,
  getPathBySlug, courseLessonIds,
} from '../content';
import {
  isCourseComplete, earnedBadgeIds, isCertificationEligible,
  certificationReadiness, featureFluency, masteryLevel, nextRecommendedCourse,
  currentStreak, momentumScore, isCertificationExpired,
} from '../engine';
import { DEFAULT_ACADEMY_PROGRESS, type AcademyProgress } from '../types';
import { useAcademyStore } from '../store';

// Build a progress object with the given lessons complete + quizzes passed.
function progressWith(opts: {
  lessons?: string[]; quizzesPassed?: string[]; challenges?: string[];
}): AcademyProgress {
  const quizAttempts: AcademyProgress['quizAttempts'] = {};
  for (const q of opts.quizzesPassed ?? []) {
    quizAttempts[q] = { attempts: 1, bestScore: 100, passed: true, lastAttemptAt: 'now' };
  }
  const challengeSubmissions: Record<string, string> = {};
  for (const c of opts.challenges ?? []) challengeSubmissions[c] = 'now';
  return {
    ...DEFAULT_ACADEMY_PROGRESS,
    completedLessonIds: opts.lessons ?? [],
    quizAttempts,
    challengeSubmissions,
  };
}

describe('Academy content integrity', () => {
  it('every course references real lessons, badges, and prerequisites', () => {
    for (const c of COURSES) {
      for (const lid of courseLessonIds(c)) expect(getLesson(lid)).toBeDefined();
      if (c.badgeId) expect(getBadge(c.badgeId)).toBeDefined();
      for (const pre of c.prerequisiteCourseIds ?? []) expect(getCourse(pre)).toBeDefined();
    }
  });

  it('every lesson references real quizzes/challenges/prerequisites', () => {
    for (const l of LESSONS) {
      if (l.quizId) expect(getQuiz(l.quizId)).toBeDefined();
      if (l.challengeId) expect(getChallenge(l.challengeId)).toBeDefined();
      for (const pre of l.prerequisites ?? []) expect(getLesson(pre)).toBeDefined();
    }
  });

  it('every path references real courses and certifications', () => {
    for (const p of PATHS) {
      for (const cid of p.courseIds) expect(getCourse(cid)).toBeDefined();
      if (p.certificationId) expect(getCertification(p.certificationId)).toBeDefined();
    }
  });

  it('every certification references real courses/challenges/quizzes/badges', () => {
    for (const cert of CERTIFICATIONS) {
      for (const cid of cert.requiredCourseIds) expect(getCourse(cid)).toBeDefined();
      for (const ch of cert.requiredChallengeIds ?? []) expect(getChallenge(ch)).toBeDefined();
      if (cert.finalAssessmentQuizId) expect(getQuiz(cert.finalAssessmentQuizId)).toBeDefined();
      expect(getBadge(cert.badgeId)).toBeDefined();
    }
  });

  it('every role references real paths and certifications', () => {
    for (const r of ROLES) {
      for (const s of r.recommendedPathSlugs) expect(getPathBySlug(s)).toBeDefined();
      if (r.targetCertificationId) expect(getCertification(r.targetCertificationId)).toBeDefined();
    }
  });

  it('every quiz question has in-range, non-empty correct answers', () => {
    for (const q of QUIZZES) {
      for (const question of q.questions) {
        expect(question.correct.length).toBeGreaterThan(0);
        for (const idx of question.correct) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(question.options.length);
        }
      }
    }
  });

  it('seed meets the minimum content bar', () => {
    expect(PATHS.length).toBeGreaterThanOrEqual(9);
    expect(COURSES.length).toBeGreaterThanOrEqual(18);
    expect(LESSONS.length).toBeGreaterThanOrEqual(29);
    expect(CERTIFICATIONS.length).toBeGreaterThanOrEqual(7);
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(7);
  });
});

describe('Academy gamification (Phase 2)', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  it('currentStreak counts consecutive active days', () => {
    expect(currentStreak({ ...DEFAULT_ACADEMY_PROGRESS, activityDays: [] })).toBe(0);
    expect(currentStreak({ ...DEFAULT_ACADEMY_PROGRESS, activityDays: [yesterday, today] })).toBe(2);
  });

  it('momentumScore reflects last-7-day activity', () => {
    expect(momentumScore({ ...DEFAULT_ACADEMY_PROGRESS, activityDays: [] })).toBe(0);
    expect(momentumScore({ ...DEFAULT_ACADEMY_PROGRESS, activityDays: [today] })).toBeGreaterThan(0);
  });

  it('isCertificationExpired respects the expiry date', () => {
    const past = { ...DEFAULT_ACADEMY_PROGRESS, certifications: { 'cert-foundations': { earnedAt: 'x', expiresAt: '2000-01-01T00:00:00.000Z' } } };
    const future = { ...DEFAULT_ACADEMY_PROGRESS, certifications: { 'cert-foundations': { earnedAt: 'x', expiresAt: '2999-01-01T00:00:00.000Z' } } };
    expect(isCertificationExpired(past, 'cert-foundations')).toBe(true);
    expect(isCertificationExpired(future, 'cert-foundations')).toBe(false);
  });
});

describe('Academy engine', () => {
  it('empty progress = rookie, 0% fluency', () => {
    const p = DEFAULT_ACADEMY_PROGRESS;
    expect(masteryLevel(p).id).toBe('rookie');
    expect(featureFluency(p)).toBe(0);
  });

  it('completing a course marks it complete and earns its badge', () => {
    const course = getCourse('c-what-is')!;
    const p = progressWith({ lessons: courseLessonIds(course) });
    expect(isCourseComplete(p, course)).toBe(true);
    expect(earnedBadgeIds(p)).toContain('b-product-tour');
  });

  it('certification eligibility requires courses + challenges + final exam', () => {
    const cert = getCertification('cert-support')!;
    // All required courses' lessons:
    const lessons = cert.requiredCourseIds.flatMap((cid) => courseLessonIds(getCourse(cid)!));
    const partial = progressWith({ lessons });
    expect(isCertificationEligible(partial, cert)).toBe(false); // missing challenge + final

    const full = progressWith({
      lessons,
      challenges: cert.requiredChallengeIds,
      quizzesPassed: cert.finalAssessmentQuizId ? [cert.finalAssessmentQuizId] : [],
    });
    expect(isCertificationEligible(full, cert)).toBe(true);
    expect(certificationReadiness(full, cert)).toBe(100);
  });

  it('recommends a course for a role', () => {
    const p = { ...DEFAULT_ACADEMY_PROGRESS, roleId: 'support' as const };
    const rec = nextRecommendedCourse(p);
    expect(rec).not.toBeNull();
  });
});

describe('Academy store', () => {
  beforeEach(() => useAcademyStore.getState().reset());

  it('completeLesson adds the lesson, awards points, and records activity', () => {
    useAcademyStore.getState().completeLesson('l-sports-overview');
    const p = useAcademyStore.getState().progress;
    expect(p.completedLessonIds).toContain('l-sports-overview');
    expect(p.points).toBe(10);
    expect(p.activityDays).toContain(new Date().toISOString().slice(0, 10));
  });

  it('setLearnerName stores a trimmed name', () => {
    useAcademyStore.getState().setLearnerName('  Jordan Rivera  ');
    expect(useAcademyStore.getState().progress.learnerName).toBe('Jordan Rivera');
  });

  it('passing a quiz awards points once', () => {
    useAcademyStore.getState().recordQuizAttempt('q-personas', 100, true);
    useAcademyStore.getState().recordQuizAttempt('q-personas', 100, true);
    const p = useAcademyStore.getState().progress;
    expect(p.quizAttempts['q-personas'].attempts).toBe(2);
    expect(p.points).toBe(25); // quiz-pass points granted only once
  });

  it('completing all requirements auto-claims the certification + badge', () => {
    const cert = getCertification('cert-admin')!;
    for (const cid of cert.requiredCourseIds) {
      for (const lid of courseLessonIds(getCourse(cid)!)) useAcademyStore.getState().completeLesson(lid);
    }
    for (const ch of cert.requiredChallengeIds ?? []) useAcademyStore.getState().submitChallenge(ch);
    const p = useAcademyStore.getState().progress;
    expect(p.certifications['cert-admin']).toBeDefined();
    expect(p.earnedBadges[cert.badgeId]).toBeDefined();
  });
});
