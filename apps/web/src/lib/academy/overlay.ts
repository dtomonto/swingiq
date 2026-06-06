// ============================================================
// SwingVantage Academy — content overlay (seed + CMS)
// ------------------------------------------------------------
// Pure helpers that merge PUBLISHED CMS content over the seed
// content registry, so admin-authored courses/lessons become
// viewable in the learner app. CMS items override seed by id.
// ============================================================
import type { Course, Lesson } from './types';
import { COURSES, getCourse, getCourseBySlug, getLesson } from './content';
import type { CmsCourse, CmsLesson } from './cms';

const isPublished = <T extends { status: string }>(x: T) => x.status === 'published';

/** Resolve a lesson by id: a published CMS override wins, else seed. */
export function resolveLesson(
  id: string,
  cmsLessons: Record<string, CmsLesson>,
): Lesson | undefined {
  const cms = cmsLessons[id];
  if (cms && isPublished(cms)) return cms;
  return getLesson(id);
}

/** Resolve a course by id: published CMS override wins, else seed. */
export function resolveCourse(
  id: string,
  cmsCourses: Record<string, CmsCourse>,
): Course | undefined {
  const cms = cmsCourses[id];
  if (cms && isPublished(cms)) return cms;
  return getCourse(id);
}

/** Resolve a course by slug across published CMS + seed. */
export function resolveCourseBySlug(
  slug: string,
  cmsCourses: Record<string, CmsCourse>,
): Course | undefined {
  const cms = Object.values(cmsCourses).find((c) => isPublished(c) && c.slug === slug);
  return cms ?? getCourseBySlug(slug);
}

/** All courses for the catalog: seed + published CMS (CMS overrides seed by id). */
export function mergedCourses(cmsCourses: Record<string, CmsCourse>): Course[] {
  const map = new Map<string, Course>();
  for (const c of COURSES) map.set(c.id, c);
  for (const c of Object.values(cmsCourses)) if (isPublished(c)) map.set(c.id, c);
  return [...map.values()];
}
