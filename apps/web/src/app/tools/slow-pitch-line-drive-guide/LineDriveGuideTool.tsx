'use client';

import { useState } from 'react';
import { ToolShell, ResultPanel, ToolCta } from '@/components/tools/ToolShell';
import { ChoiceGroup } from '@/components/tools/fields';
import { EmailCapture } from '@/components/email/EmailCapture';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface Guide { pathIssue: string; checkpoint: string; teeDrill: string; timingCue: string; }

const GUIDES: Record<string, Guide> = {
  popups: {
    pathIssue: 'You are likely chopping down into a ball that is dropping on its arc, sending it up weakly.',
    checkpoint: 'Match a slightly upward bat path to the descending pitch so you drive through, not under or down.',
    teeDrill: 'Set a tee at your ideal contact height and groove a slightly upward path that sends line drives into a net. 3 sets of 10.',
    timingCue: 'Start your load on a slow count as the ball reaches the top of its arc, so you fire on time into the drop.',
  },
  grounders: {
    pathIssue: 'Your top hand is likely rolling over too early, pulling the bat down and across the ball.',
    checkpoint: 'Stay through the ball — drive the knob and bat toward the pitcher and delay the top-hand roll.',
    teeDrill: 'Two-ball drill: place a second ball just in front; try to drive the front ball into it to feel a path that stays through. 3 sets of 8.',
    timingCue: 'Think "drive the line," contacting the ball slightly out front so the bat is still squaring up.',
  },
  mishits: {
    pathIssue: 'Inconsistent contact in slow-pitch is usually a timing problem against the high arc, not a strength problem.',
    checkpoint: 'Build a repeatable load-and-fire rhythm tied to the ball’s arc.',
    teeDrill: 'Counted soft toss: a partner tosses on a steady count; load and fire on the same count every rep. 2 sets of 10.',
    timingCue: 'Use a consistent internal count (e.g. "down… and… hit") matched to the drop so timing repeats.',
  },
};

export function LineDriveGuideTool() {
  const [result, setResult] = useState('');
  const [guide, setGuide] = useState<Guide | null>(null);
  const [error, setError] = useState('');

  function onSubmit() {
    if (!result) { setError('Please choose the result you see most.'); return; }
    setError('');
    setGuide(GUIDES[result]);
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, { tool: 'slow-pitch-line-drive-guide', result });
  }
  function reset() { setResult(''); setGuide(null); setError(''); }

  return (
    <ToolShell
      slug="slow-pitch-line-drive-guide"
      title="Slow-Pitch Line-Drive Guide"
      subtitle="Hitting pop-ups or grounders in slow-pitch? Find your likely swing-path issue, a line-drive checkpoint, a tee drill, and a timing cue."
    >
      {!guide && (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="rounded-2xl border border-gray-200 bg-white p-5">
          <ChoiceGroup label="Your most common result?" name="result" value={result} onChange={setResult}
            choices={[{ value: 'popups', label: 'Pop-ups' }, { value: 'grounders', label: 'Ground balls' }, { value: 'mishits', label: 'Mis-hits / inconsistent' }]} />
          {error && <p role="alert" className="mb-3 text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1">
            Get My Line-Drive Fix
          </button>
        </form>
      )}

      {guide && (
        <ResultPanel>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Likely swing-path issue</p>
            <p className="mt-1 text-gray-800">{guide.pathIssue}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Line-drive checkpoint</p>
            <p className="mt-1 text-gray-800">{guide.checkpoint}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-900">Tee drill</p>
            <p className="text-sm text-gray-600">{guide.teeDrill}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-900">Timing cue</p>
            <p className="text-sm text-gray-600">{guide.timingCue}</p>
          </div>

          <EmailCapture source="slow_pitch_softball" heading="Email me this line-drive fix" subheading="Plus a reminder to retest in a week." />
          <ToolCta href="/dashboard" label="Analyze My Softball Swing Free" />
          <button onClick={reset} className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Start over</button>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
