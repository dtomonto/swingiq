'use client';

import { useState } from 'react';
import { ToolShell, ResultPanel, ToolCta } from '@/components/tools/ToolShell';
import { ChoiceGroup, type Choice } from '@/components/tools/fields';
import { EmailCapture } from '@/components/email/EmailCapture';
import type { LeadSource } from '@/lib/email/capture';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface Outcome {
  issue: string;
  checkpoint: string;
  drills: string[];
  plan: string[];
}

interface SportConfig {
  key: string;
  label: string;
  leadSource: LeadSource;
  symptomLabel: string;
  symptoms: Choice[];
  outcomes: Record<string, Outcome>;
}

const SPORTS: SportConfig[] = [
  {
    key: 'golf', label: 'Golf', leadSource: 'golf_slice', symptomLabel: 'What is your most common miss?',
    symptoms: [
      { value: 'slice', label: 'Slice (curves right)' },
      { value: 'hook', label: 'Hook (curves left)' },
      { value: 'fat_thin', label: 'Fat / thin contact' },
      { value: 'inconsistent', label: 'Inconsistent everything' },
    ],
    outcomes: {
      slice: { issue: 'Out-to-in path with an open face', checkpoint: 'Square your club path before the face — stop cutting across the ball.', drills: ['Headcover gate drill', 'Transition drop rehearsal', 'Split-hand release'], plan: ['Days 1–2: path drills slow', 'Days 3–4: add release', 'Days 5–6: build speed', 'Day 7: retest'] },
      hook: { issue: 'Overly in-to-out path with a closed face', checkpoint: 'Quiet the hands and neutralize a too-strong release.', drills: ['Neutral-grip check', 'Hold-off finish drill', 'Tempo half-swings'], plan: ['Days 1–2: grip + face', 'Days 3–4: hold-off finish', 'Days 5–6: speed', 'Day 7: retest'] },
      fat_thin: { issue: 'Low point control / weight shift', checkpoint: 'Get your weight onto the lead side through impact.', drills: ['Towel-behind-ball drill', 'Lead-side bump drill', 'Punch shots'], plan: ['Days 1–3: low-point drills', 'Days 4–6: half to full', 'Day 7: retest'] },
      inconsistent: { issue: 'Tempo and sequencing', checkpoint: 'Build a repeatable tempo before chasing positions.', drills: ['3:1 tempo counts', 'Feet-together swings', 'Slow-motion reps'], plan: ['Daily tempo work, retest day 7'] },
    },
  },
  {
    key: 'tennis', label: 'Tennis', leadSource: 'tennis_forehand', symptomLabel: 'Where does your forehand go wrong?',
    symptoms: [
      { value: 'long', label: 'Flies long' },
      { value: 'net', label: 'Into the net' },
      { value: 'late', label: 'Always late' },
      { value: 'weak', label: 'No power' },
    ],
    outcomes: {
      long: { issue: 'Too flat, not enough topspin', checkpoint: 'Add low-to-high brush for margin.', drills: ['Drop-feed topspin', 'Low-to-high shadow swings', 'Window target drill'], plan: ['Days 1–3: topspin feel', 'Days 4–6: rally', 'Day 7: retest'] },
      net: { issue: 'Closing the face / brushing down', checkpoint: 'Finish high and meet the ball out front.', drills: ['High-finish cue', 'Contact-point catch', 'Drop-feed'], plan: ['Days 1–3: contact point', 'Days 4–6: rally', 'Day 7: retest'] },
      late: { issue: 'Late unit turn', checkpoint: 'Turn shoulders before the bounce.', drills: ['Early-turn shadow', 'Split-step timing', 'Catch-at-contact'], plan: ['Daily turn timing, retest day 7'] },
      weak: { issue: 'All-arm swing, no legs/core', checkpoint: 'Drive from the ground up.', drills: ['Load-and-explode', 'Hip-lead rotation', 'Medicine-ball throw (light)'], plan: ['Days 1–3: sequence', 'Days 4–6: power', 'Day 7: retest'] },
    },
  },
  {
    key: 'baseball', label: 'Baseball', leadSource: 'youth_baseball', symptomLabel: 'What happens most at contact?',
    symptoms: [
      { value: 'grounders', label: 'Ground balls' },
      { value: 'popups', label: 'Pop-ups' },
      { value: 'late', label: 'Late / jammed' },
      { value: 'weak', label: 'Weak contact' },
    ],
    outcomes: {
      grounders: { issue: 'Rolling over / steep path', checkpoint: 'Stay through the ball; delay the top-hand roll.', drills: ['High-tee line drill', 'Stay-through cue', 'Two-ball spacing'], plan: ['Days 1–3: path', 'Days 4–6: live toss', 'Day 7: retest'] },
      popups: { issue: 'Swinging under the ball', checkpoint: 'Level the path; keep the back shoulder up.', drills: ['Belt-high tee', 'Level-path cue', 'Soft toss'], plan: ['Days 1–3: level path', 'Days 4–6: toss', 'Day 7: retest'] },
      late: { issue: 'Late timing / long load', checkpoint: 'Shorten and start the load earlier.', drills: ['Short-load reps', 'Timing soft toss', 'Rhythm count'], plan: ['Daily timing, retest day 7'] },
      weak: { issue: 'Sequence leaks energy', checkpoint: 'Hips lead, then hands.', drills: ['Hip-lead rotation', 'Connection ball', 'Tee for sequence'], plan: ['Days 1–3: sequence', 'Days 4–6: toss', 'Day 7: retest'] },
    },
  },
  {
    key: 'slowpitch', label: 'Slow-Pitch Softball', leadSource: 'slow_pitch_softball', symptomLabel: 'Your most common result?',
    symptoms: [
      { value: 'popups', label: 'Pop-ups' },
      { value: 'grounders', label: 'Ground balls' },
      { value: 'nopower', label: 'No carry / power' },
      { value: 'mishit', label: 'Mis-hits / timing' },
    ],
    outcomes: {
      popups: { issue: 'Chopping down at a dropping ball', checkpoint: 'Match a slightly upward path to the arc.', drills: ['Contact-height tee', 'Slight-up path cue', 'Timed soft toss'], plan: ['Days 1–3: path', 'Days 4–6: timing', 'Day 7: retest'] },
      grounders: { issue: 'Rolling over the top hand', checkpoint: 'Stay through and drive the line.', drills: ['High-tee line drill', 'Stay-through cue', 'Two-ball drill'], plan: ['Days 1–3: path', 'Days 4–6: timing', 'Day 7: retest'] },
      nopower: { issue: 'Late hips / drifting forward', checkpoint: 'Rotate onto a firm front side.', drills: ['Hip-lead rotation', 'Step-and-load timing', 'Balance hold'], plan: ['Days 1–3: sequence', 'Days 4–6: power', 'Day 7: retest'] },
      mishit: { issue: 'Timing against the arc', checkpoint: 'Load on a count matched to the drop.', drills: ['Counted soft toss', 'Rhythm load', 'Tee reset'], plan: ['Daily timing, retest day 7'] },
    },
  },
  {
    key: 'fastpitch', label: 'Fast-Pitch Softball', leadSource: 'youth_softball', symptomLabel: 'What breaks down most?',
    symptoms: [
      { value: 'late', label: 'Late on speed' },
      { value: 'grounders', label: 'Ground balls' },
      { value: 'popups', label: 'Pop-ups' },
      { value: 'weak', label: 'Weak contact' },
    ],
    outcomes: {
      late: { issue: 'Long swing / late start', checkpoint: 'Shorten to the ball; start on time.', drills: ['Short-to-it reps', 'Quick-hands toss', 'Reaction tee'], plan: ['Daily quickness, retest day 7'] },
      grounders: { issue: 'Top-hand roll / steep', checkpoint: 'Stay through the middle.', drills: ['Line-drive tee', 'Stay-through cue', 'Two-ball drill'], plan: ['Days 1–3: path', 'Days 4–6: live', 'Day 7: retest'] },
      popups: { issue: 'Dropping under', checkpoint: 'Level path, back shoulder up.', drills: ['Belt-high tee', 'Level cue', 'Soft toss'], plan: ['Days 1–3: level', 'Days 4–6: toss', 'Day 7: retest'] },
      weak: { issue: 'Sequence / connection', checkpoint: 'Hips before hands; stay connected.', drills: ['Connection ball', 'Hip-lead drill', 'Sequence tee'], plan: ['Days 1–3: sequence', 'Days 4–6: live', 'Day 7: retest'] },
    },
  },
];

export function SwingMistakeQuizTool() {
  const [sportKey, setSportKey] = useState('');
  const [symptom, setSymptom] = useState('');
  const [result, setResult] = useState<{ sport: SportConfig; outcome: Outcome } | null>(null);
  const [error, setError] = useState('');

  const sport = SPORTS.find((s) => s.key === sportKey);

  function onSubmit() {
    if (!sport || !symptom) {
      setError('Please choose a sport and the symptom that fits best.');
      return;
    }
    setError('');
    const outcome = sport.outcomes[symptom];
    setResult({ sport, outcome });
    track(ANALYTICS_EVENTS.QUIZ_COMPLETED, { tool: 'swing-mistake-quiz', sport: sport.key });
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, { tool: 'swing-mistake-quiz', sport: sport.key, issue: outcome.issue });
  }

  function reset() {
    setSportKey(''); setSymptom(''); setResult(null); setError('');
  }

  return (
    <ToolShell
      slug="swing-mistake-quiz"
      title="Swing Mistake Quiz"
      subtitle="Pick your sport and the result you see most. Get your likely top issue, a key checkpoint, drills, and a practice plan."
    >
      {!result && (
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          onFocus={() => track(ANALYTICS_EVENTS.QUIZ_STARTED, { tool: 'swing-mistake-quiz' })}
          className="rounded-2xl border border-gray-200 bg-white p-5"
        >
          <ChoiceGroup
            label="Choose your sport" name="sport" value={sportKey}
            onChange={(v) => { setSportKey(v); setSymptom(''); }}
            choices={SPORTS.map((s) => ({ value: s.key, label: s.label }))}
          />
          {sport && (
            <ChoiceGroup label={sport.symptomLabel} name="symptom" value={symptom} onChange={setSymptom} choices={sport.symptoms} />
          )}
          {error && <p role="alert" className="mb-3 text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1">
            See My Likely Issue
          </button>
        </form>
      )}

      {result && (
        <ResultPanel>
          <p className="text-sm font-medium text-gray-500">{result.sport.label}</p>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Likely top issue</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{result.outcome.issue}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Key checkpoint</p>
            <p className="mt-1 text-gray-800">{result.outcome.checkpoint}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Drills</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {result.outcome.drills.map((d) => <li key={d} className="flex gap-2"><span className="text-green-600">•</span>{d}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Practice plan</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {result.outcome.plan.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>

          <EmailCapture source={result.sport.leadSource} heading="Email me this plan" subheading="Your plan plus a day-7 retest reminder." meta={{ sport: result.sport.key }} />

          <ToolCta href="/dashboard" label="Analyze My Real Swing Free" />
          <button onClick={reset} className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Start over</button>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
