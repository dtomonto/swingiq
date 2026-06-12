// P2 — AI Coach analytics helpers + wiring guard.
// The helpers must emit the right event names + non-PII props (never question/
// answer text), and both coach surfaces + the route must keep the wiring.

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  trackCoachOpened,
  trackCoachQuestion,
  trackCoachAnswered,
  trackCoachRated,
} from '../analytics';

type Captured = [string, Record<string, unknown> | undefined];

function withPosthog(run: (calls: Captured[]) => void) {
  const calls: Captured[] = [];
  const realWindow = (global as { window?: unknown }).window;
  (global as { window?: unknown }).window = {
    posthog: { capture: (e: string, p?: Record<string, unknown>) => calls.push([e, p]) },
  };
  try {
    run(calls);
  } finally {
    (global as { window?: unknown }).window = realWindow;
  }
}

describe('AI Coach analytics helpers (P2)', () => {
  it('trackCoachOpened fires ai_coach_opened with sport + surface', () => {
    withPosthog((calls) => {
      trackCoachOpened('golf', 'page');
      expect(calls).toContainEqual(['ai_coach_opened', { sport: 'golf', surface: 'page' }]);
    });
  });

  it('trackCoachQuestion carries source (never the question text)', () => {
    withPosthog((calls) => {
      trackCoachQuestion('tennis', 'floating', 'suggested');
      expect(calls).toContainEqual([
        'ai_coach_question_asked',
        { sport: 'tennis', surface: 'floating', source: 'suggested' },
      ]);
    });
  });

  it('trackCoachAnswered includes AI observability when aiMeta is present', () => {
    withPosthog((calls) => {
      trackCoachAnswered('golf', 'page', {
        ok: true,
        aiMeta: { provider: 'openai', model: 'gpt-4o-mini', latencyMs: 1234, cached: false },
      });
      expect(calls[0][0]).toBe('ai_coach_answered');
      expect(calls[0][1]).toEqual({
        sport: 'golf',
        surface: 'page',
        ok: true,
        cached: false,
        fallback: null,
        ai_provider: 'openai',
        ai_model: 'gpt-4o-mini',
        ai_latency_ms: 1234,
      });
    });
  });

  it('trackCoachAnswered omits AI fields when no provider ran (cache/fallback)', () => {
    withPosthog((calls) => {
      trackCoachAnswered('golf', 'page', { ok: true, aiMeta: { cached: true } });
      expect(calls[0][1]).toEqual({ sport: 'golf', surface: 'page', ok: true, cached: true, fallback: null });
    });
    withPosthog((calls) => {
      trackCoachAnswered('golf', 'floating', { ok: false }); // network error, no meta
      expect(calls[0][1]).toEqual({ sport: 'golf', surface: 'floating', ok: false, cached: false, fallback: null });
    });
  });

  it('trackCoachRated fires the helpful/not signal', () => {
    withPosthog((calls) => {
      trackCoachRated('baseball', 'page', 'helpful');
      expect(calls).toContainEqual([
        'ai_coach_answer_rated',
        { sport: 'baseball', surface: 'page', value: 'helpful' },
      ]);
    });
  });
});

const read = (rel: string) => readFileSync(join(__dirname, rel), 'utf8');

describe('AI Coach wiring is present (guards against removal)', () => {
  it('the route echoes non-PII aiMeta on every path', () => {
    const route = read('../../../app/api/ai-coach/route.ts');
    expect(route).toContain('aiMeta');
    expect(route).toContain('provider: result.provider');
    expect(route).toContain("fallback: 'paused'");
    expect(route).toContain("fallback: 'disabled'");
  });

  it('the /ai-coach page fires opened/question/answered + rating', () => {
    const chat = read('../../../app/(app)/ai-coach/AICoachChat.tsx');
    for (const fn of ['trackCoachOpened', 'trackCoachQuestion', 'trackCoachAnswered', 'trackCoachRated']) {
      expect(chat).toContain(fn);
    }
  });

  it('the floating coach fires opened/question/answered', () => {
    const floating = read('../../../components/ui/FloatingCoach.tsx');
    for (const fn of ['trackCoachOpened', 'trackCoachQuestion', 'trackCoachAnswered']) {
      expect(floating).toContain(fn);
    }
  });
});
