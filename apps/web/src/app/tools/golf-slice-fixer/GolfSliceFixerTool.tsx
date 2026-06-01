'use client';

import { useState } from 'react';
import { ToolShell, ResultPanel, ToolCta } from '@/components/tools/ToolShell';
import { ChoiceGroup } from '@/components/tools/fields';
import { EmailCapture } from '@/components/email/EmailCapture';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface Answers {
  ballStart: string;
  curve: string;
  club: string;
  miss: string;
  contact: string;
  environment: string;
  skill: string;
}

interface SliceResult {
  pattern: string;
  priority: string;
  analyzes: string[];
  drills: { name: string; how: string }[];
  plan: string[];
}

const EMPTY: Answers = {
  ballStart: '', curve: '', club: '', miss: '', contact: '', environment: '', skill: '',
};

function diagnose(a: Answers): SliceResult {
  const overTheTop = a.ballStart === 'left' && a.curve === 'right';
  const pushSlice = (a.ballStart === 'right' || a.ballStart === 'straight') && a.curve === 'right';
  const heelContact = a.contact === 'heel';

  let pattern: string;
  let priority: string;

  if (overTheTop) {
    pattern = 'Classic over-the-top slice — the ball starts left of target and curves back right, the signature of an out-to-in club path with a face open to that path.';
    priority = 'Neutralize your club path first. Your downswing is coming from outside the target line; getting it to approach more from the inside removes most of the curve.';
  } else if (pushSlice) {
    pattern = 'Push-slice — the ball starts right and keeps curving right, which usually means the face is open to a more neutral or in-to-out path.';
    priority = 'Square the club face. Your path is workable, but the face is open at impact — grip and release are the priority.';
  } else {
    pattern = 'Mixed slice pattern — based on your answers the curve is right-to-left dominant; we need video or data to separate path from face confidently.';
    priority = 'Confirm whether path or face is the bigger contributor before grooving a fix — a quick swing analysis settles it fast.';
  }

  const drills = [
    {
      name: 'Headcover gate drill',
      how: 'Place a headcover just outside and slightly ahead of the ball. Make slow swings that miss it to train an in-to-out path.',
    },
    overTheTop || pushSlice
      ? { name: 'Split-hand release drill', how: 'Hands slightly apart, make half swings feeling the lead forearm rotate so the toe points up after impact. Trains the face to square.' }
      : { name: 'Slow-motion video check', how: 'Film face-on and down-the-line at 50% speed and compare the club at the top and at impact.' },
    {
      name: 'Transition drop rehearsal',
      how: 'From the top, rehearse dropping hands and trail elbow toward your trail pocket before turning. 10 quarter-speed reps before any full swing.',
    },
  ];

  const indoor = a.environment === 'indoor';
  const plan = [
    'Day 1 — Film a baseline swing (face-on + down-the-line). Note ball start and curve.',
    `Day 2 — ${indoor ? 'Mirror' : 'Range'} transition drop rehearsals, 3 sets of 10 at quarter speed.`,
    'Day 3 — Headcover gate drill, 20 slow swings. No full speed yet.',
    'Day 4 — Add the release/face drill, 2 sets of 10. Half swings only.',
    'Day 5 — Combine path + face feels at half speed, 20 balls or rehearsals.',
    'Day 6 — Build to 3/4 speed, keeping the new feel. Film a few swings.',
    'Day 7 — Retest: film again and compare curve to Day 1. Re-run your analysis.',
  ];

  const analyzes = [
    'Club path direction and steepness through impact',
    'Face-to-path relationship (the true cause of curve)',
    'Whether an over-the-top move is present in transition',
    heelContact ? 'Heel-side contact that adds even more slice spin' : 'Strike location on the face',
    'Tempo and sequencing from transition to release',
  ];

  return { pattern, priority, analyzes, drills, plan };
}

const SKILL = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function GolfSliceFixerTool() {
  const [a, setA] = useState<Answers>(EMPTY);
  const [result, setResult] = useState<SliceResult | null>(null);
  const [error, setError] = useState('');

  const set = (k: keyof Answers) => (v: string) => setA((prev) => ({ ...prev, [k]: v }));

  const ready = a.ballStart && a.curve && a.contact && a.skill;

  function onSubmit() {
    if (!ready) {
      setError('Please answer ball start direction, curve, contact pattern, and skill level.');
      return;
    }
    setError('');
    track(ANALYTICS_EVENTS.QUIZ_COMPLETED, { tool: 'golf-slice-fixer', skill: a.skill });
    const r = diagnose(a);
    setResult(r);
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, { tool: 'golf-slice-fixer', pattern: r.pattern.slice(0, 40) });
  }

  function onReset() {
    setA(EMPTY);
    setResult(null);
    setError('');
  }

  return (
    <ToolShell
      slug="golf-slice-fixer"
      title="Golf Slice Fixer"
      subtitle="Answer a few questions about your ball flight and get your likely slice pattern, top priority, three beginner-safe drills, and a 7-day plan."
    >
      {!result && (
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          onFocus={() => track(ANALYTICS_EVENTS.QUIZ_STARTED, { tool: 'golf-slice-fixer' })}
          className="rounded-2xl border border-gray-200 bg-white p-5"
        >
          <ChoiceGroup label="Where does the ball start?" name="ballStart" value={a.ballStart} onChange={set('ballStart')}
            choices={[{ value: 'left', label: 'Left of target' }, { value: 'straight', label: 'Straight' }, { value: 'right', label: 'Right of target' }]} />
          <ChoiceGroup label="Which way does it curve?" name="curve" value={a.curve} onChange={set('curve')}
            choices={[{ value: 'right', label: 'Curves right' }, { value: 'left', label: 'Curves left' }, { value: 'straight', label: 'Stays straight' }]} />
          <ChoiceGroup label="Which club do you slice most?" name="club" value={a.club} onChange={set('club')}
            choices={[{ value: 'driver', label: 'Driver' }, { value: 'irons', label: 'Irons' }, { value: 'all', label: 'All of them' }]} />
          <ChoiceGroup label="Most common miss?" name="miss" value={a.miss} onChange={set('miss')}
            choices={[{ value: 'slice', label: 'Big slice' }, { value: 'fade', label: 'Small fade' }, { value: 'pull', label: 'Pull' }]} />
          <ChoiceGroup label="Where do you tend to make contact?" name="contact" value={a.contact} onChange={set('contact')}
            choices={[{ value: 'center', label: 'Center' }, { value: 'heel', label: 'Toward the heel' }, { value: 'toe', label: 'Toward the toe' }, { value: 'unsure', label: 'Not sure' }]} />
          <ChoiceGroup label="Where will you practice?" name="environment" value={a.environment} onChange={set('environment')}
            choices={[{ value: 'range', label: 'Driving range' }, { value: 'course', label: 'Course' }, { value: 'indoor', label: 'Indoor / at home' }]} />
          <ChoiceGroup label="Skill level" name="skill" value={a.skill} onChange={set('skill')} choices={SKILL} />

          {error && <p role="alert" className="mb-3 text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1">
            Get My Slice Diagnosis
          </button>
        </form>
      )}

      {result && (
        <ResultPanel>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Likely pattern</p>
            <p className="mt-1 font-bold text-gray-900">{result.pattern}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Top priority</p>
            <p className="mt-1 text-gray-800">{result.priority}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">What SwingIQ would analyze</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {result.analyzes.map((x) => <li key={x} className="flex gap-2"><span className="text-green-600">•</span>{x}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Your 3 beginner-safe drills</p>
            <div className="mt-2 space-y-2">
              {result.drills.map((d, i) => (
                <div key={d.name} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{i + 1}. {d.name}</p>
                  <p className="text-sm text-gray-600">{d.how}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Your 7-day practice plan</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {result.plan.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>

          <EmailCapture
            source="golf_slice"
            heading="Want this plan emailed to you?"
            subheading="We'll send your slice plan and a day-7 retest reminder. No spam."
          />

          <ToolCta href="/dashboard" label="Analyze My Real Swing Free" />
          <button onClick={onReset} className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Start over
          </button>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
