'use client';

import { useState } from 'react';
import { ToolShell, ResultPanel, ToolCta } from '@/components/tools/ToolShell';
import { NumberField } from '@/components/tools/fields';
import { EmailCapture } from '@/components/email/EmailCapture';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface Result { annualSpend: number; optimized: number; saved: number; }

export function SavingsCalculatorTool() {
  const [cost, setCost] = useState<number | ''>(75);
  const [perMonth, setPerMonth] = useState<number | ''>(2);
  const [months, setMonths] = useState<number | ''>(12);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  function onSubmit() {
    if (cost === '' || perMonth === '' || months === '') { setError('Please fill in all three fields.'); return; }
    if (cost < 0 || perMonth < 0 || months < 0) { setError('Please use positive numbers.'); return; }
    setError('');
    const annualSpend = Number(cost) * Number(perMonth) * Number(months);
    // Conservative illustration: better-targeted practice between sessions can
    // let many golfers space lessons out by ~30%. This is an estimate, not a promise.
    const optimized = Math.round(annualSpend * 0.7);
    const saved = annualSpend - optimized;
    const r = { annualSpend, optimized, saved };
    setResult(r);
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, { tool: 'private-lesson-savings-calculator', annualSpend });
  }
  function reset() { setResult(null); setError(''); }

  const money = (n: number) => `$${n.toLocaleString('en-US')}`;

  return (
    <ToolShell
      slug="private-lesson-savings-calculator"
      title="Private Lesson Savings Calculator"
      subtitle="Estimate your lesson spend and see how much more value you might get by practicing better between sessions."
    >
      {!result && (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="rounded-2xl border border-border bg-card p-5">
          <NumberField id="cost" label="Cost per lesson" value={cost} onChange={setCost} min={0} max={1000} suffix="USD" />
          <NumberField id="perMonth" label="Lessons per month" value={perMonth} onChange={setPerMonth} min={0} max={30} suffix="per month" />
          <NumberField id="months" label="Months per year you take lessons" value={months} onChange={setMonths} min={0} max={12} suffix="months" />
          {error && <p role="alert" className="mb-3 text-sm font-medium text-error">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
            Show My Savings
          </button>
        </form>
      )}

      {result && (
        <ResultPanel>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground">Estimated yearly lesson spend</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{money(result.annualSpend)}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-4 text-center">
              <p className="text-xs text-primary">Potential optimized spend</p>
              <p className="mt-1 text-2xl font-bold text-primary">{money(result.optimized)}</p>
            </div>
          </div>
          <p className="text-center text-sm text-foreground">
            By practicing the right priority between sessions, many players get the same value from fewer lessons —
            an estimated <strong>{money(result.saved)}/year</strong> in this scenario.
          </p>
          <p className="rounded-xl bg-warning/10 p-4 text-sm text-foreground">
            <strong>Lessons are still valuable.</strong> A good coach is often the fastest path to real improvement. This
            calculator is an illustration, not a promise — SwingVantage is designed to make your lessons and your practice more
            effective, not to replace your coach.
          </p>

          <EmailCapture source="general" heading="Send me a smarter practice plan" subheading="See how to get more from each lesson with focused practice between sessions." />
          <ToolCta href="/start" label="Try SwingVantage Free Before Your Next Lesson" />
          <button onClick={reset} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted">Recalculate</button>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
