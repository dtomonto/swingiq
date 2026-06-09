// ============================================================
// AI coach response cache (intelligence upgrade Sprint 2, #6)
// ============================================================

import { TtlLruCache, cacheKey } from './response-cache';
import type { CoachContext } from '../ai-coach-prompts';

describe('#6 TtlLruCache', () => {
  it('stores and retrieves a value', () => {
    const c = new TtlLruCache<string>(10, 1000);
    c.set('a', 'A', 0);
    expect(c.get('a', 0)).toBe('A');
  });

  it('expires entries after the TTL', () => {
    const c = new TtlLruCache<string>(10, 1000);
    c.set('a', 'A', 0);
    expect(c.get('a', 999)).toBe('A');
    expect(c.get('a', 1000)).toBeUndefined();
    expect(c.get('a', 5000)).toBeUndefined();
  });

  it('evicts the least-recently-used entry past capacity', () => {
    const c = new TtlLruCache<string>(2, 10_000);
    c.set('a', 'A', 0);
    c.set('b', 'B', 0);
    c.get('a', 1); // touch 'a' → 'b' is now LRU
    c.set('c', 'C', 1); // evicts 'b'
    expect(c.get('a', 2)).toBe('A');
    expect(c.get('c', 2)).toBe('C');
    expect(c.get('b', 2)).toBeUndefined();
    expect(c.size).toBe(2);
  });

  it('refreshes recency on get', () => {
    const c = new TtlLruCache<string>(2, 10_000);
    c.set('a', 'A', 0);
    c.set('b', 'B', 0);
    c.get('a', 1); // 'a' most recent now
    c.set('c', 'C', 1); // should evict 'b', keep 'a'
    expect(c.get('a', 2)).toBe('A');
    expect(c.get('b', 2)).toBeUndefined();
  });
});

describe('#6 cacheKey', () => {
  const base: CoachContext = {
    active_sport: 'golf',
    user_question: 'Why do I slice?',
    current_session_stats: { shot_count: 20, avg_face_to_path: 6.2 },
    primary_diagnosis_id: 'slice_weak_fade',
  };

  it('is identical for identical context', () => {
    expect(cacheKey(base)).toBe(cacheKey({ ...base }));
  });

  it('normalizes question whitespace/case', () => {
    expect(cacheKey(base)).toBe(cacheKey({ ...base, user_question: '  why   DO i Slice? ' }));
  });

  it('is independent of object key ordering in stats', () => {
    const a = cacheKey({ ...base, current_session_stats: { shot_count: 20, avg_face_to_path: 6.2 } });
    const b = cacheKey({ ...base, current_session_stats: { avg_face_to_path: 6.2, shot_count: 20 } });
    expect(a).toBe(b);
  });

  it('differs when the question or data changes', () => {
    expect(cacheKey(base)).not.toBe(cacheKey({ ...base, user_question: 'how do I fix it?' }));
    expect(cacheKey(base)).not.toBe(
      cacheKey({ ...base, current_session_stats: { shot_count: 20, avg_face_to_path: 9.9 } }),
    );
  });
});
