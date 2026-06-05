'use client';

import { useState } from 'react';
import { ToolShell, ResultPanel, ToolCta } from '@/components/tools/ToolShell';
import { ChoiceGroup, type Choice } from '@/components/tools/fields';
import { EmailCapture } from '@/components/email/EmailCapture';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

// Seeded, extensible question set per sport. Replace/extend with a
// real fitting dataset later — there is intentionally no claim of a
// live manufacturer database here.
interface SportQuestion { key: string; label: string; choices: Choice[]; }
interface SportSpec {
  key: string;
  label: string;
  questions: SportQuestion[];
  flag: (a: Record<string, string>) => { flags: string[]; validate: string[]; mismatch: string[] };
}

const SPORTS: SportSpec[] = [
  {
    key: 'golf', label: 'Golf clubs',
    questions: [
      { key: 'flight', label: 'Typical ball flight', choices: [{ value: 'low', label: 'Too low' }, { value: 'high', label: 'Too high / ballooning' }, { value: 'ok', label: 'About right' }] },
      { key: 'miss', label: 'Most common miss', choices: [{ value: 'right', label: 'Right (slice/push)' }, { value: 'left', label: 'Left (hook/pull)' }, { value: 'mixed', label: 'Both ways' }] },
      { key: 'feel', label: 'How does the shaft feel?', choices: [{ value: 'stiff', label: 'Stiff / hard to load' }, { value: 'whippy', label: 'Whippy / loose' }, { value: 'fine', label: 'Fine' }] },
    ],
    flag: (a) => {
      const flags: string[] = []; const validate: string[] = []; const mismatch: string[] = [];
      if (a.flight === 'low' && a.feel === 'stiff') { flags.push('Possible shaft too stiff for your speed (low launch).'); mismatch.push('Shaft flex vs. swing speed'); }
      if (a.flight === 'high' && a.feel === 'whippy') { flags.push('Possible shaft too soft (ballooning, high spin).'); mismatch.push('Shaft flex / spin'); }
      if (a.miss === 'right') { flags.push('A persistent right miss can be lie angle, face angle, or setup — worth checking with a fitter.'); mismatch.push('Lie/face angle'); }
      validate.push('What is your measured swing speed (driver)?', 'When were your clubs last fitted, if ever?', 'Are your lie angles checked for your posture?');
      return { flags: flags.length ? flags : ['No strong club fit-risk flags from these answers.'], validate, mismatch };
    },
  },
  {
    key: 'tennis', label: 'Tennis rackets',
    questions: [
      { key: 'arm', label: 'Any arm/wrist discomfort?', choices: [{ value: 'yes', label: 'Yes, sometimes' }, { value: 'no', label: 'No' }] },
      { key: 'power', label: 'Power vs. control feel', choices: [{ value: 'nopower', label: 'Not enough power' }, { value: 'nocontrol', label: 'Hard to control' }, { value: 'ok', label: 'Balanced' }] },
      { key: 'string', label: 'String type (if known)', choices: [{ value: 'poly', label: 'Polyester' }, { value: 'multi', label: 'Multifilament / synthetic' }, { value: 'unknown', label: 'Not sure' }] },
    ],
    flag: (a) => {
      const flags: string[] = []; const validate: string[] = []; const mismatch: string[] = [];
      if (a.arm === 'yes' && a.string === 'poly') { flags.push('Arm discomfort with polyester strings is a common comfort mismatch — softer strings or lower tension may help.'); mismatch.push('String stiffness / tension'); }
      if (a.power === 'nopower') { flags.push('Low power can mean a head-light/low-stiffness frame mismatch for your style.'); mismatch.push('Frame power level'); }
      if (a.power === 'nocontrol') { flags.push('Control issues can mean too much power for your swing or wrong string setup.'); mismatch.push('Frame/string control'); }
      validate.push('What is your current string tension?', 'What grip size are you using?', 'Has a coach or fitter assessed your frame?');
      return { flags: flags.length ? flags : ['No strong racket fit-risk flags from these answers.'], validate, mismatch };
    },
  },
  {
    key: 'baseball', label: 'Baseball bats',
    questions: [
      { key: 'speed', label: 'Bat feels…', choices: [{ value: 'slow', label: 'Slow / hard to whip' }, { value: 'light', label: 'Too light / no mass' }, { value: 'ok', label: 'About right' }] },
      { key: 'contact', label: 'Most common contact', choices: [{ value: 'late', label: 'Late / jammed' }, { value: 'weak', label: 'Weak' }, { value: 'solid', label: 'Solid' }] },
    ],
    flag: (a) => {
      const flags: string[] = []; const validate: string[] = []; const mismatch: string[] = [];
      if (a.speed === 'slow' || a.contact === 'late') { flags.push('Bat may be too heavy/long for your current bat speed (late, jammed contact).'); mismatch.push('Bat weight/length (drop)'); }
      if (a.speed === 'light') { flags.push('A bat that feels too light can cost you mass at contact.'); mismatch.push('Bat weight'); }
      validate.push('What length and drop (weight) is your bat?', 'What is your age/league certification requirement?', 'Can you control the bat through the zone with good balance?');
      return { flags: flags.length ? flags : ['No strong bat fit-risk flags from these answers.'], validate, mismatch };
    },
  },
  {
    key: 'softball-slow', label: 'Slow-pitch softball bats',
    questions: [
      { key: 'balance', label: 'Bat balance feel', choices: [{ value: 'endheavy', label: 'End-heavy / hard to time' }, { value: 'light', label: 'Too light' }, { value: 'ok', label: 'About right' }] },
      { key: 'result', label: 'Most common result', choices: [{ value: 'late', label: 'Late / under the ball' }, { value: 'weak', label: 'Weak contact' }, { value: 'solid', label: 'Solid' }] },
    ],
    flag: (a) => {
      const flags: string[] = []; const validate: string[] = []; const mismatch: string[] = [];
      if (a.balance === 'endheavy' && a.result === 'late') { flags.push('An end-loaded bat can be hard to time against the high arc if you are late.'); mismatch.push('Bat balance (end-load vs. balanced)'); }
      validate.push('Is your bat balanced or end-loaded?', 'What certification stamps does your league require?', 'Does the weight let you stay on time with the arc?');
      return { flags: flags.length ? flags : ['No strong bat fit-risk flags from these answers.'], validate, mismatch };
    },
  },
  {
    key: 'softball-fast', label: 'Fast-pitch softball bats',
    questions: [
      { key: 'speed', label: 'Bat feels…', choices: [{ value: 'slow', label: 'Slow to the ball' }, { value: 'light', label: 'Too light' }, { value: 'ok', label: 'About right' }] },
      { key: 'contact', label: 'Most common contact', choices: [{ value: 'late', label: 'Late on speed' }, { value: 'weak', label: 'Weak' }, { value: 'solid', label: 'Solid' }] },
    ],
    flag: (a) => {
      const flags: string[] = []; const validate: string[] = []; const mismatch: string[] = [];
      if (a.speed === 'slow' || a.contact === 'late') { flags.push('Being late on speed can indicate a bat that is too long/heavy for your quickness.'); mismatch.push('Bat length/weight (drop)'); }
      validate.push('What length and drop is your bat?', 'What certification does your league require?', 'Can you get the barrel to the ball on time against speed?');
      return { flags: flags.length ? flags : ['No strong bat fit-risk flags from these answers.'], validate, mismatch };
    },
  },
];

export function EquipmentDiagnosticTool() {
  const [sportKey, setSportKey] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ flags: string[]; validate: string[]; mismatch: string[] } | null>(null);
  const [error, setError] = useState('');

  const sport = SPORTS.find((s) => s.key === sportKey);
  const set = (k: string) => (v: string) => setAnswers((p) => ({ ...p, [k]: v }));

  function onSubmit() {
    if (!sport) { setError('Please choose your equipment type.'); return; }
    const unanswered = sport.questions.some((q) => !answers[q.key]);
    if (unanswered) { setError('Please answer each question.'); return; }
    setError('');
    const r = sport.flag(answers);
    setResult(r);
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, { tool: 'equipment-diagnostic', sport: sport.key });
  }
  function reset() { setSportKey(''); setAnswers({}); setResult(null); setError(''); }

  return (
    <ToolShell
      slug="equipment-diagnostic"
      title="Equipment Diagnostic"
      subtitle="Spot possible equipment fit-risk flags and the questions to validate with a professional fitter. This is a starting point, not a fitting."
    >
      {!result && (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="rounded-2xl border border-border bg-card p-5">
          <ChoiceGroup label="Equipment type" name="sport" value={sportKey} onChange={(v) => { setSportKey(v); setAnswers({}); }}
            choices={SPORTS.map((s) => ({ value: s.key, label: s.label }))} />
          {sport?.questions.map((q) => (
            <ChoiceGroup key={q.key} label={q.label} name={q.key} value={answers[q.key] ?? ''} onChange={set(q.key)} choices={q.choices} />
          ))}
          {error && <p role="alert" className="mb-3 text-sm font-medium text-error">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
            Check Fit Risk
          </button>
        </form>
      )}

      {result && (
        <ResultPanel>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Fit-risk flags</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">{result.flags.map((f) => <li key={f} className="flex gap-2"><span className="text-warning">⚑</span>{f}</li>)}</ul>
          </div>
          {result.mismatch.length > 0 && (
            <div>
              <p className="font-semibold text-foreground">Possible mismatch areas</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{result.mismatch.map((m) => <li key={m} className="flex gap-2"><span className="text-primary">•</span>{m}</li>)}</ul>
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground">Questions to validate</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{result.validate.map((q) => <li key={q} className="flex gap-2"><span className="text-muted-foreground">?</span>{q}</li>)}</ul>
          </div>
          <p className="rounded-xl bg-warning/10 p-4 text-sm text-foreground">
            <strong>This is not a professional fitting.</strong> These flags are starting points based on your answers, not
            measurements. For anything that affects performance or comfort, see a qualified fitter or coach. SwingVantage does not
            use a live manufacturer database.
          </p>

          <AnalysisTransparency
            resultNoun="fit-risk check"
            basedOn={[
              `Your equipment type: ${sport?.label ?? ''}`,
              'Your answers to the fit questions',
            ]}
            videoAnalyzed={false}
            confidence={{ level: 'low', score: 30, reason: 'based on your answers, not measurements or a fitting' }}
            whatImproves={[
              'Get a session with a qualified club/bat/racket fitter',
              'Measure your swing speed (or bat speed)',
              'Bring the "questions to validate" above to a pro',
            ]}
            showSafetyNotice={false}
          />

          <EmailCapture source="general" heading="Email me these fitting questions" subheading="Take them to your next fitting or lesson." />
          <ToolCta href="/start" label="Analyze My Performance Data Free" />
          <button onClick={reset} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted">Start over</button>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
