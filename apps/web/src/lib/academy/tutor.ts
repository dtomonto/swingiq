// ============================================================
// SwingVantage Academy — AI Tutor (grounded retrieval)
// ------------------------------------------------------------
// Answers questions ONLY from approved Academy content, with
// citations to the lesson it used. Deterministic + extractive:
// no hallucination, works with zero API keys. (A configured LLM
// can later re-word the grounded answer; the retrieval + citation
// core stays the source of truth.)
// ============================================================
import type { Lesson } from './types';
import { LESSONS, COURSES, courseLessonIds } from './content';

const STOP = new Set([
  'the', 'a', 'an', 'to', 'of', 'and', 'or', 'is', 'are', 'how', 'what', 'do', 'does',
  'i', 'my', 'in', 'on', 'for', 'with', 'can', 'it', 'you', 'your', 'this', 'that',
  'about', 'explain', 'tell', 'me', 'when', 'should', 'why', 'where', 'who', 'a', 'as',
]);

function terms(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2 && !STOP.has(w));
}

export interface TutorCitation { lessonId: string; title: string; courseSlug?: string }
export interface TutorAnswer {
  answer: string;
  citations: TutorCitation[];
  followups: string[];
  grounded: boolean;
}

function courseSlugFor(lessonId: string): string | undefined {
  return COURSES.find((c) => courseLessonIds(c).includes(lessonId))?.slug;
}

function scoreLesson(qTerms: string[], lesson: Lesson): number {
  const title = lesson.title.toLowerCase();
  const hay = [
    lesson.whyItMatters, ...lesson.objectives, ...lesson.walkthrough,
    ...(lesson.bestPractices ?? []), ...(lesson.commonMistakes ?? []),
  ].join(' ').toLowerCase();
  let score = 0;
  for (const t of qTerms) {
    if (title.includes(t)) score += 3;
    if (hay.includes(t)) score += 1;
  }
  return score;
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

/** Pull the sentences from a lesson most relevant to the query. */
function extract(qTerms: string[], lesson: Lesson): string[] {
  const pool = [...lesson.walkthrough, ...(lesson.bestPractices ?? []), ...lesson.objectives];
  const scored = pool
    .flatMap(sentences)
    .map((s) => ({ s, n: qTerms.filter((t) => s.toLowerCase().includes(t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.s);
  const picked = [...new Set(scored)].slice(0, 3);
  return picked.length ? picked : [lesson.whyItMatters, lesson.walkthrough[0]].filter(Boolean);
}

export function suggestedQuestions(): string[] {
  return [
    'How does a user upload a swing video?',
    'How do I explain AI feedback to a beginner?',
    'What is 3D motion mapping?',
    'How are drill recommendations created?',
    'What can I say about AI accuracy?',
  ];
}

export function askTutor(query: string): TutorAnswer {
  const qTerms = terms(query);
  if (qTerms.length === 0) {
    return {
      answer: 'Ask me about any SwingVantage feature, role, or workflow — I answer only from the Academy’s approved lessons and cite them.',
      citations: [], followups: suggestedQuestions(), grounded: false,
    };
  }

  const ranked = LESSONS
    .map((l) => ({ l, s: scoreLesson(qTerms, l) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);

  if (ranked.length === 0) {
    return {
      answer: 'I couldn’t find an approved Academy lesson covering that, so I won’t guess. Try rephrasing, or browse the catalog. (I only answer from approved Academy content.)',
      citations: [], followups: suggestedQuestions(), grounded: false,
    };
  }

  const top = ranked[0].l;
  const answer = extract(qTerms, top).join(' ');
  const citations: TutorCitation[] = ranked.map(({ l }) => ({
    lessonId: l.id, title: l.title, courseSlug: courseSlugFor(l.id),
  }));
  const followups = (top.relatedFeatures ?? []).map((f) => `Tell me about ${f.label}`).slice(0, 3);
  return { answer, citations, followups: followups.length ? followups : suggestedQuestions().slice(0, 3), grounded: true };
}
