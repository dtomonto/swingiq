'use client';

// ============================================================
// SwingVantage Academy — Admin CMS store (Phase 3)
// ------------------------------------------------------------
// Lets admins author/edit courses & lessons with a publishing
// workflow (draft → review → approved → published → deprecated →
// archived), plus an audit log. Stored in its own persisted
// store (`swingvantage-academy-cms`), separate from learner
// progress. PUBLISHED items overlay the seed content (see
// overlay.ts) so authored content becomes viewable in the app.
//
// Seed content (lib/academy/content) is the baseline and is
// treated as already "published"; the CMS adds new items or
// overrides existing ones by id.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Course, Lesson } from './types';

export type ContentStatus =
  | 'draft' | 'review' | 'approved' | 'published' | 'deprecated' | 'archived';

export const CONTENT_STATUSES: ContentStatus[] = [
  'draft', 'review', 'approved', 'published', 'deprecated', 'archived',
];

/** Allowed forward/back transitions for the workflow UI. */
export const STATUS_NEXT: Record<ContentStatus, ContentStatus[]> = {
  draft: ['review', 'archived'],
  review: ['approved', 'draft'],
  approved: ['published', 'draft'],
  published: ['deprecated'],
  deprecated: ['published', 'archived'],
  archived: ['draft'],
};

export interface CmsLesson extends Lesson { status: ContentStatus; updatedAt: string }
export interface CmsCourse extends Course { status: ContentStatus; updatedAt: string }

export interface AuditEntry { at: string; action: string; target: string }

export interface AcademyCmsStore {
  lessons: Record<string, CmsLesson>;
  courses: Record<string, CmsCourse>;
  audit: AuditEntry[];
  saveLesson: (lesson: CmsLesson) => void;
  setLessonStatus: (id: string, status: ContentStatus) => void;
  removeLesson: (id: string) => void;
  saveCourse: (course: CmsCourse) => void;
  setCourseStatus: (id: string, status: ContentStatus) => void;
  removeCourse: (id: string) => void;
  reset: () => void;
}

const log = (audit: AuditEntry[], action: string, target: string): AuditEntry[] =>
  [{ at: new Date().toISOString(), action, target }, ...audit].slice(0, 200);

export const useAcademyCmsStore = create<AcademyCmsStore>()(
  persist(
    (set) => ({
      lessons: {},
      courses: {},
      audit: [],

      saveLesson: (lesson) =>
        set((s) => ({
          lessons: { ...s.lessons, [lesson.id]: { ...lesson, updatedAt: new Date().toISOString() } },
          audit: log(s.audit, s.lessons[lesson.id] ? 'edit lesson' : 'create lesson', lesson.id),
        })),

      setLessonStatus: (id, status) =>
        set((s) => {
          const l = s.lessons[id];
          if (!l) return s;
          return {
            lessons: { ...s.lessons, [id]: { ...l, status, updatedAt: new Date().toISOString() } },
            audit: log(s.audit, `lesson → ${status}`, id),
          };
        }),

      removeLesson: (id) =>
        set((s) => {
          const next = { ...s.lessons };
          delete next[id];
          return { lessons: next, audit: log(s.audit, 'delete lesson', id) };
        }),

      saveCourse: (course) =>
        set((s) => ({
          courses: { ...s.courses, [course.id]: { ...course, updatedAt: new Date().toISOString() } },
          audit: log(s.audit, s.courses[course.id] ? 'edit course' : 'create course', course.id),
        })),

      setCourseStatus: (id, status) =>
        set((s) => {
          const c = s.courses[id];
          if (!c) return s;
          return {
            courses: { ...s.courses, [id]: { ...c, status, updatedAt: new Date().toISOString() } },
            audit: log(s.audit, `course → ${status}`, id),
          };
        }),

      removeCourse: (id) =>
        set((s) => {
          const next = { ...s.courses };
          delete next[id];
          return { courses: next, audit: log(s.audit, 'delete course', id) };
        }),

      reset: () => set({ lessons: {}, courses: {}, audit: [] }),
    }),
    {
      name: 'swingvantage-academy-cms',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
        }
        return localStorage;
      }),
    },
  ),
);
