'use client';

// SwingVantage Academy — simulation runner (free-text + rubric eval).
import { useState } from 'react';
import { evaluateResponse, type Simulation, type SimEvaluation } from '@/lib/academy/simulations';
import { useAcademyStore } from '@/lib/academy/store';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from './parts';
import { cn } from '@/lib/utils';

export function SimRunner({ sim }: { sim: Simulation }) {
  const record = useAcademyStore((s) => s.recordSimulation);
  const prior = useAcademyStore((s) => s.progress.simulationAttempts?.[sim.id]);
  const [text, setText] = useState('');
  const [result, setResult] = useState<SimEvaluation | null>(null);

  const submit = () => {
    const ev = evaluateResponse(sim, text);
    setResult(ev);
    record(sim.id, ev.score, ev.passed);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-theme border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-accent-secondary/15 px-2 py-0.5 text-xs font-medium capitalize text-accent-secondary">{sim.kind} simulation</span>
          {prior?.passed && <span className="text-xs font-semibold text-success">✓ passed · best {prior.bestScore}%</span>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{sim.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Persona: {sim.persona}</p>
        <div className="mt-3 rounded-theme border border-border bg-muted/40 p-3 text-sm italic text-foreground">{sim.scenario}</div>
        <p className="mt-3 text-sm font-medium text-foreground">{sim.prompt}</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        placeholder="Type your response…"
        className="w-full rounded-theme border border-border bg-card px-3 py-2 text-sm text-foreground"
      />

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={text.trim().length === 0}>Evaluate my response</Button>
        <span className="text-xs text-muted-foreground">Pass mark: {sim.passThreshold}%. Reviewed against the rubric below.</span>
      </div>

      {result && (
        <div className="rounded-theme border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', result.passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>
              {result.passed ? `Passed — ${result.score}%` : `Scored ${result.score}%`}
            </span>
            <span className="text-sm text-muted-foreground">{result.summary}</span>
          </div>
          <div className="mt-2"><ProgressBar value={result.score} /></div>

          {result.redFlags.length > 0 && (
            <div className="mt-4 rounded-theme border border-error/30 bg-error/5 p-3">
              <p className="text-sm font-bold text-error">Guardrail issues — fix these</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">
                {result.redFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {result.results.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-sm">
                <span className={r.met ? 'text-success' : 'text-muted-foreground'}>{r.met ? '✓' : '○'}</span>
                <span>
                  <span className={r.met ? 'text-foreground' : 'text-muted-foreground'}>{r.label}</span>
                  {!r.met && <span className="block text-xs text-muted-foreground">{r.hint}</span>}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Button variant="outline" onClick={() => setResult(null)}>Revise &amp; try again</Button>
          </div>
        </div>
      )}
    </div>
  );
}
