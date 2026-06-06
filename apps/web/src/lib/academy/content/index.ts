// SwingVantage Academy — Content registry.
// Aggregates all seed content and exposes id→object lookups so the
// engine and UI never hand-roll find() calls or drift on ids.
import type {
  AcademyRole, AcademyRoleId, Badge, Certification, Challenge,
  Course, Lesson, Quiz, VantagePath,
} from '../types';
import { ROLES, BADGES } from './roles';
import { QUIZZES } from './quizzes';
import { CHALLENGES } from './challenges';
import { LESSONS } from './lessons';
import { COURSES } from './courses';
import { CERTIFICATIONS } from './certifications';
import { PATHS } from './paths';

export { ROLES, BADGES, QUIZZES, CHALLENGES, LESSONS, COURSES, CERTIFICATIONS, PATHS };

const byId = <T extends { id: string }>(arr: T[]) =>
  arr.reduce<Record<string, T>>((m, x) => { m[x.id] = x; return m; }, {});
const bySlug = <T extends { slug: string }>(arr: T[]) =>
  arr.reduce<Record<string, T>>((m, x) => { m[x.slug] = x; return m; }, {});

const rolesById = byId(ROLES);
const badgesById = byId(BADGES);
const quizzesById = byId(QUIZZES);
const challengesById = byId(CHALLENGES);
const lessonsById = byId(LESSONS);
const coursesById = byId(COURSES);
const coursesBySlug = bySlug(COURSES);
const certsById = byId(CERTIFICATIONS);
const pathsById = byId(PATHS);
const pathsBySlug = bySlug(PATHS);

export const getRole = (id: AcademyRoleId): AcademyRole | undefined => rolesById[id];
export const getBadge = (id: string): Badge | undefined => badgesById[id];
export const getQuiz = (id: string): Quiz | undefined => quizzesById[id];
export const getChallenge = (id: string): Challenge | undefined => challengesById[id];
export const getLesson = (id: string): Lesson | undefined => lessonsById[id];
export const getCourse = (id: string): Course | undefined => coursesById[id];
export const getCourseBySlug = (slug: string): Course | undefined => coursesBySlug[slug];
export const getCertification = (id: string): Certification | undefined => certsById[id];
export const getPath = (id: string): VantagePath | undefined => pathsById[id];
export const getPathBySlug = (slug: string): VantagePath | undefined => pathsBySlug[slug];

/** All lesson ids that belong to a course (across its modules), in order. */
export function courseLessonIds(course: Course): string[] {
  return course.modules.flatMap((m) => m.lessonIds);
}

/** All lesson ids in a path (across its courses), de-duplicated, in order. */
export function pathLessonIds(path: VantagePath): string[] {
  const ids: string[] = [];
  for (const cid of path.courseIds) {
    const c = coursesById[cid];
    if (c) ids.push(...courseLessonIds(c));
  }
  return [...new Set(ids)];
}
