'use client';

import { useState } from 'react';
import { ToolShell, ResultPanel, ToolCta } from '@/components/tools/ToolShell';
import { ChoiceGroup } from '@/components/tools/fields';
import { EmailCapture } from '@/components/email/EmailCapture';
import { YouthSafetyNotice } from '@/components/trust/YouthSafetyNotice';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface Answers {
  sport: string;
  skill: string;
  space: string;
  equipment: string;
  time: string;
  issue: string;
  who: string;
}

const EMPTY: Answers = { sport: '', skill: '', space: '', equipment: '', time: '', issue: '', who: '' };

interface Plan {
  warmup: string[];
  drills: { name: string; how: string }[];
  structure: string;
  progression: string;
}

function build(a: Answers): Plan {
  const small = a.space === 'small';
  const noGear = a.equipment === 'none';
  const short = a.time === '10';

  const warmup = [
    'Gentle full-body mobility: arm circles, trunk rotations, hip openers (2–3 min).',
    a.sport === 'golf' ? 'Slow practice swings to feel tempo, no ball.' : 'Slow practice swings / shadow reps to feel the motion.',
    'A few easy reps at 50% to wake up the pattern.',
  ];

  const pathDrill = small
    ? { name: 'Slow-motion mirror reps', how: 'In front of a mirror, move slowly through your key position, pausing to check it. 3 sets of 8 at quarter speed.' }
    : { name: 'Half-speed pattern reps', how: 'Make controlled half-speed swings focusing on one position. 3 sets of 8.' };

  const feedbackDrill = noGear
    ? { name: 'Phone-camera checkpoint', how: 'Film one rep, compare it to your target position, adjust, and repeat. 5 filmed reps.' }
    : { name: 'Tee / target reps', how: 'Use your available gear to groove contact toward a target or net. 2 sets of 10.' };

  const balanceDrill = { name: 'Balance finish hold', how: 'Hold your finish for two seconds after each rep to build control and stability.' };

  const structure = short
    ? '10-minute session: 2 min warm-up, 6 min drills (rotate the three), 2 min film + review.'
    : a.time === '30'
      ? '30-minute session: 5 min warm-up, 20 min drills (≈7 min each), 5 min film + review.'
      : '20-minute session: 3 min warm-up, 14 min drills, 3 min film + review.';

  const progression = a.skill === 'beginner'
    ? 'Stay at slow/half speed for the first week. Add speed only when the position holds up on video.'
    : 'Build from half to three-quarter speed across the week. Re-film and compare before going full speed.';

  return { warmup, drills: [pathDrill, feedbackDrill, balanceDrill], structure, progression };
}

export function AtHomeDrillTool() {
  const [a, setA] = useState<Answers>(EMPTY);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const set = (k: keyof Answers) => (v: string) => setA((p) => ({ ...p, [k]: v }));
  const youth = a.who === 'youth';

  function onSubmit() {
    if (!a.sport || !a.skill || !a.space || !a.time || !a.who) {
      setError('Please choose sport, skill, space, time, and who is practicing.');
      return;
    }
    setError('');
    setPlan(build(a));
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, { tool: 'at-home-drill-generator', sport: a.sport, who: a.who });
  }
  function reset() { setA(EMPTY); setPlan(null); setError(''); }

  return (
    <ToolShell
      slug="at-home-swing-drill-generator"
      title="At-Home Swing Drill Generator"
      subtitle="Tell us your sport, space, gear, and time. Get a safe at-home session with a warm-up, three drills, structure, and a progression."
    >
      {!plan && (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="rounded-2xl border border-gray-200 bg-white p-5">
          <ChoiceGroup label="Sport" name="sport" value={a.sport} onChange={set('sport')}
            choices={[{ value: 'golf', label: 'Golf' }, { value: 'tennis', label: 'Tennis' }, { value: 'baseball', label: 'Baseball' }, { value: 'softball', label: 'Softball' }]} />
          <ChoiceGroup label="Skill level" name="skill" value={a.skill} onChange={set('skill')}
            choices={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]} />
          <ChoiceGroup label="How much space?" name="space" value={a.space} onChange={set('space')}
            choices={[{ value: 'small', label: 'Small (indoor room)' }, { value: 'medium', label: 'Medium (garage/yard)' }, { value: 'large', label: 'Large (open yard)' }]} />
          <ChoiceGroup label="Equipment on hand" name="equipment" value={a.equipment} onChange={set('equipment')}
            choices={[{ value: 'none', label: 'None / just phone' }, { value: 'basic', label: 'Bat or club' }, { value: 'net', label: 'Net / tee' }]} />
          <ChoiceGroup label="Time available" name="time" value={a.time} onChange={set('time')}
            choices={[{ value: '10', label: '10 min' }, { value: '20', label: '20 min' }, { value: '30', label: '30 min' }]} />
          <ChoiceGroup label="Main issue (optional)" name="issue" value={a.issue} onChange={set('issue')}
            choices={[{ value: 'path', label: 'Swing path' }, { value: 'contact', label: 'Contact' }, { value: 'timing', label: 'Timing' }, { value: 'consistency', label: 'Consistency' }]} />
          <ChoiceGroup label="Who is practicing?" name="who" value={a.who} onChange={set('who')}
            choices={[{ value: 'adult', label: 'Adult' }, { value: 'youth', label: 'Youth (with parent supervision)' }]} />
          {error && <p role="alert" className="mb-3 text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1">
            Generate My Home Session
          </button>
        </form>
      )}

      {plan && (
        <ResultPanel>
          {youth && <YouthSafetyNotice />}
          <div>
            <p className="font-semibold text-gray-900">Warm-up</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">{plan.warmup.map((w) => <li key={w} className="flex gap-2"><span className="text-green-600">•</span>{w}</li>)}</ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">3 drills</p>
            <div className="mt-2 space-y-2">
              {plan.drills.map((d, i) => (
                <div key={d.name} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{i + 1}. {d.name}</p>
                  <p className="text-sm text-gray-600">{d.how}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">Session structure</p>
            <p className="mt-1 text-sm text-gray-600">{plan.structure}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Progression</p>
            <p className="mt-1 text-sm text-gray-600">{plan.progression}</p>
          </div>
          <p className="text-xs italic text-gray-500">
            Safety: clear your space before any swing, keep full-speed swings outdoors, warm up first, and stop if anything hurts.
            {youth ? ' A parent or guardian should supervise youth practice and confirm equipment fit.' : ''}
          </p>

          <EmailCapture source={youth ? 'youth_baseball' : 'practice_plan'} heading="Email me this session" subheading="Plus a reminder to retest in a week." meta={{ sport: a.sport }} />
          <ToolCta href="/dashboard" label="Analyze My Swing Free" />
          <button onClick={reset} className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Start over</button>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
