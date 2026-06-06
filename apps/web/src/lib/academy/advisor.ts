// ============================================================
// SwingVantage Academy — AI Learning Advisor (deterministic)
// ------------------------------------------------------------
// Builds a ranked, personalized "what to do next" plan from the
// learner's progress + role: claimable certs, weak quizzes to
// retake, in-progress courses, and the gap to their role cert.
// Grounded in real progress — no fabrication.
// ============================================================
import type { AcademyProgress } from './types';
import {
  LESSONS, getCourse, getRole, getQuiz, getCertification,
} from './content';
import {
  courseProgress, isCourseComplete, certificationReadiness,
  nextRecommendedCourse, claimableCertifications,
} from './engine';

export type AdvisorKind = 'cert-ready' | 'retake' | 'continue' | 'cert-gap';

export interface AdvisorItem {
  kind: AdvisorKind;
  title: string;
  reason: string;
  href: string;
  priority: number; // lower = more urgent
}

function lessonHrefForQuiz(quizId: string): string {
  const lesson = LESSONS.find((l) => l.quizId === quizId);
  return lesson ? `/admin/academy/lesson/${lesson.id}` : '/admin/academy/catalog';
}

export function advisorPlan(progress: AcademyProgress): AdvisorItem[] {
  const items: AdvisorItem[] = [];

  // 1) Certifications you can claim right now.
  for (const cert of claimableCertifications(progress)) {
    items.push({
      kind: 'cert-ready', title: `Claim ${cert.name}`,
      reason: 'You meet every requirement — claim it in the Certification Center.',
      href: '/admin/academy/certifications', priority: 0,
    });
  }

  // 2) Quizzes you haven't passed yet (weak areas).
  for (const [quizId, rec] of Object.entries(progress.quizAttempts)) {
    if (!rec.passed) {
      const q = getQuiz(quizId);
      if (q) items.push({
        kind: 'retake', title: `Retake: ${q.title}`,
        reason: `Best score ${rec.bestScore}% — below the ${q.passingScore}% pass mark.`,
        href: lessonHrefForQuiz(quizId), priority: 1,
      });
    }
  }

  // 3) Continue an in-progress / recommended course.
  const next = nextRecommendedCourse(progress);
  if (next) items.push({
    kind: 'continue', title: next.course.title, reason: next.reason,
    href: `/admin/academy/course/${next.course.slug}`, priority: 2,
  });

  // 4) The gap to your role's target certification.
  const role = progress.roleId ? getRole(progress.roleId) : null;
  if (role?.targetCertificationId) {
    const cert = getCertification(role.targetCertificationId);
    if (cert && !progress.certifications[cert.id]) {
      const ready = certificationReadiness(progress, cert);
      const gap = cert.requiredCourseIds
        .map((cid) => getCourse(cid))
        .find((c) => c && !isCourseComplete(progress, c));
      if (gap) items.push({
        kind: 'cert-gap', title: `Toward ${cert.name}`,
        reason: `${ready}% ready — next complete "${gap.title}" (${courseProgress(progress, gap).percent}%).`,
        href: `/admin/academy/course/${gap.slug}`, priority: 3,
      });
    }
  }

  const seen = new Set<string>();
  return items
    .filter((i) => (seen.has(i.title) ? false : seen.add(i.title)))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 6);
}
