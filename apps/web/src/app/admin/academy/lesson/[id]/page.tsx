'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { getLesson, COURSES, courseLessonIds } from '@/lib/academy/content';
import { LessonContent } from '@/components/academy/LessonContent';
import { Button } from '@/components/ui/Button';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = getLesson(id);
  if (!lesson) return notFound();

  // Locate the course that contains this lesson (for breadcrumb + next lesson).
  const course = COURSES.find((c) => courseLessonIds(c).includes(id));
  const lessonIds = course ? courseLessonIds(course) : [id];
  const idx = lessonIds.indexOf(id);
  const nextId = idx >= 0 && idx < lessonIds.length - 1 ? lessonIds[idx + 1] : null;
  const nextLesson = nextId ? getLesson(nextId) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/admin/academy/catalog" className="text-primary hover:underline">Catalog</Link>
        {course && <> <span className="mx-1">/</span> <Link href={`/admin/academy/course/${course.slug}`} className="text-primary hover:underline">{course.title}</Link></>}
      </nav>

      <LessonContent lesson={lesson} />

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
        {course ? (
          <Link href={`/admin/academy/course/${course.slug}`}><Button variant="outline">← Back to course</Button></Link>
        ) : <span />}
        {nextLesson && (
          <Link href={`/admin/academy/lesson/${nextLesson.id}`}><Button>Next: {nextLesson.title} →</Button></Link>
        )}
      </div>
    </div>
  );
}
