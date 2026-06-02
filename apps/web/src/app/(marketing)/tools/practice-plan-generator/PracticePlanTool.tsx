'use client';

import { useState } from 'react';
import { ToolShell, ResultPanel, ToolCta } from '@/components/tools/ToolShell';
import { ChoiceGroup } from '@/components/tools/fields';
import { EmailCapture } from '@/components/email/EmailCapture';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface Answers { sport: string; issue: string; freq: string; horizon: string; }
const EMPTY: Answers = { sport: '', issue: '', freq: '', horizon: '' };

const FOCUS: Record<string, string> = {
  path: 'swing path',
  contact: 'consistent contact',
  timing: 'timing',
  power: 'power & sequence',
  consistency: 'overall consistency',
};

interface Plan {
  week: string[];
  month?: string[];
  metrics: string[];
  retest: string;
}

function build(a: Answers): Plan {
  const focus = FOCUS[a.issue] ?? 'your top priority';
  const week = [
    `Day 1 — Baseline: film/record your swing and note where ${focus} breaks down.`,
    `Day 2 — Slow drill work on ${focus} (quality over quantity).`,
    'Day 3 — Repeat the drill, add a checkpoint you can feel.',
    'Day 4 — Light day: rehearse the feel, short session.',
    `Day 5 — Build toward game speed while keeping ${focus} intact.`,
    'Day 6 — Mixed reps: alternate drill and normal swings.',
    'Day 7 — Retest: re-record and compare to Day 1.',
  ];
  const month = a.horizon === '30'
    ? [
        'Week 1 — Groove the single highest-priority change at slow/half speed.',
        'Week 2 — Add speed while keeping the new pattern; introduce target work.',
        'Week 3 — Pressure reps: simulate game situations and track results.',
        'Week 4 — Consolidate, retest against your Week 1 baseline, set the next priority.',
      ]
    : undefined;
  const metrics = [
    `A clear, repeatable improvement in ${focus} on video.`,
    'Tighter dispersion / more consistent contact, not just one good rep.',
    a.sport === 'golf' ? 'If using a launch monitor: steadier path/face and smash factor.' : 'More line drives / solid contact in live reps.',
  ];
  const retest = a.horizon === '30'
    ? 'Retest at the end of each week (days 7, 14, 21, 28) and compare to your original baseline.'
    : 'Retest on day 7 and compare directly to your day-1 baseline before changing focus.';
  return { week, month, metrics, retest };
}

export function PracticePlanTool() {
  const [a, setA] = useState<Answers>(EMPTY);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const set = (k: keyof Answers) => (v: string) => setA((p) => ({ ...p, [k]: v }));

  function onSubmit() {
    if (!a.sport || !a.issue || !a.horizon) { setError('Please choose sport, focus, and plan length.'); return; }
    setError('');
    const p = build(a);
    setPlan(p);
    track(ANALYTICS_EVENTS.PRACTICE_PLAN_SAVED, { sport: a.sport, issue: a.issue, horizon: a.horizon });
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, { tool: 'practice-plan-generator', sport: a.sport });
  }
  function reset() { setA(EMPTY); setPlan(null); setError(''); }

  return (
    <ToolShell
      slug="practice-plan-generator"
      title="Practice Plan Generator"
      subtitle="Build a focused 7-day (or 30-day) practice plan with success metrics and a retest schedule."
    >
      {!plan && (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="rounded-2xl border border-border bg-card p-5">
          <ChoiceGroup label="Sport" name="sport" value={a.sport} onChange={set('sport')}
            choices={[{ value: 'golf', label: 'Golf' }, { value: 'tennis', label: 'Tennis' }, { value: 'baseball', label: 'Baseball' }, { value: 'softball', label: 'Softball' }]} />
          <ChoiceGroup label="Main focus" name="issue" value={a.issue} onChange={set('issue')}
            choices={[{ value: 'path', label: 'Swing path' }, { value: 'contact', label: 'Contact' }, { value: 'timing', label: 'Timing' }, { value: 'power', label: 'Power' }, { value: 'consistency', label: 'Consistency' }]} />
          <ChoiceGroup label="Sessions per week" name="freq" value={a.freq} onChange={set('freq')}
            choices={[{ value: '2', label: '2' }, { value: '3', label: '3–4' }, { value: '5', label: '5+' }]} />
          <ChoiceGroup label="Plan length" name="horizon" value={a.horizon} onChange={set('horizon')}
            choices={[{ value: '7', label: '7-day' }, { value: '30', label: '30-day' }]} />
          {error && <p role="alert" className="mb-3 text-sm font-medium text-error">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
            Build My Plan
          </button>
        </form>
      )}

      {plan && (
        <ResultPanel>
          <div>
            <p className="font-semibold text-foreground">7-day plan</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{plan.week.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          {plan.month && (
            <div>
              <p className="font-semibold text-foreground">30-day arc</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{plan.month.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
          )}
          <div className="rounded-xl bg-muted p-4">
            <p className="font-semibold text-foreground">Success metrics</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{plan.metrics.map((m) => <li key={m} className="flex gap-2"><span className="text-primary">•</span>{m}</li>)}</ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Retest schedule</p>
            <p className="mt-1 text-sm text-muted-foreground">{plan.retest}</p>
          </div>

          <EmailCapture source="practice_plan" heading="Email me this plan + reminders" subheading="We'll send the plan and retest reminders so you actually finish it." meta={{ sport: a.sport }} />
          <ToolCta href="/dashboard" label="Analyze My Swing & Track Progress Free" />
          <button onClick={reset} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted">Start over</button>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
