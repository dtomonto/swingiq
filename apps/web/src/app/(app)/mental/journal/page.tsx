'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NotebookPen, Trash2, Download, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMentalPerformance } from '@/lib/mental-performance/useMentalPerformance';
import { emotionMeta, mistakeMeta } from '@/lib/mental-performance/constants';
import { JournalEntryForm } from '@/components/mental-performance/JournalEntryForm';
import { SafetyDisclaimer } from '@/components/mental-performance/SafetyDisclaimer';

export default function MentalJournalPage() {
  const mp = useMentalPerformance();
  const [confirmClear, setConfirmClear] = useState(false);
  const insights = mp.insights;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(mp.exportMental(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swingvantage-mental-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Link href="/mental" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></Link>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <NotebookPen size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mental Performance Journal</h1>
          <p className="text-sm text-muted-foreground">Reflect, spot patterns, recover faster.</p>
        </div>
      </header>

      {/* Consent toggle */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck size={16} className="text-primary" aria-hidden="true" /> Store my journal on this device
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Off by default. When on, entries are saved locally (and synced to your account). Turn it off
              and nothing new is stored — your choice, always.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={mp.storeLogs}
            onClick={() => mp.setStoreLogs(!mp.storeLogs)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${mp.storeLogs ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-transform ${mp.storeLogs ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Anonymized insights opt-in (separate, explicit consent) */}
        <div className="mt-4 flex items-start justify-between gap-4 border-t border-border pt-4">
          <div>
            <div className="font-semibold text-foreground">Help improve routines for everyone</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Off by default. When on, SwingVantage learns from <span className="font-medium">anonymized</span> signals
              only — your sport, the emotion and mistake type, and which routine helped. Never your words, never your
              identity. Helps us build better resets for athletes like you.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={mp.shareInsights}
            onClick={() => mp.setShareInsights(!mp.shareInsights)}
            aria-label="Share anonymized insights"
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${mp.shareInsights ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-transform ${mp.shareInsights ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Insights */}
      {insights.total > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold text-foreground">Your patterns</h2>
          <p className="mt-1 text-sm text-muted-foreground">{insights.headline}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top triggers</div>
              <ul className="mt-1 space-y-1 text-sm text-foreground">
                {insights.topTriggers.map((t) => (
                  <li key={t.emotion}>{emotionMeta(t.emotion)?.label ?? t.emotion} · {t.count}</li>
                ))}
                {insights.topTriggers.length === 0 && <li className="text-muted-foreground">—</li>}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slowest to recover</div>
              <ul className="mt-1 space-y-1 text-sm text-foreground">
                {insights.slowestRecovery.map((r) => (
                  <li key={r.context}>{r.context} · {r.avg}/5</li>
                ))}
                {insights.slowestRecovery.length === 0 && <li className="text-muted-foreground">—</li>}
              </ul>
            </div>
          </div>
          {insights.pressureReadiness != null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pressure readiness</span>
                <span className="font-semibold text-foreground">{insights.pressureReadiness}/100</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${insights.pressureReadiness}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entry form (only when consented to store) */}
      {mp.storeLogs ? (
        <JournalEntryForm />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
          Turn on “Store my journal” above to start logging moments.
        </div>
      )}

      {/* History */}
      {mp.state.logs.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">History</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={exportData}><Download size={14} /> Export</Button>
              {confirmClear ? (
                <Button variant="danger" size="sm" onClick={() => { mp.clearAllLogs(); setConfirmClear(false); }}>Confirm clear</Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}><Trash2 size={14} /> Clear</Button>
              )}
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {mp.state.logs.map((l) => (
              <li key={l.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {emotionMeta(l.emotion)?.emoji} {mistakeMeta(l.mistake)?.label ?? 'Moment'}
                  </span>
                  <button onClick={() => mp.deleteLog(l.id)} aria-label="Delete entry" className="text-muted-foreground hover:text-error">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{new Date(l.date).toLocaleString()}</div>
                {l.reflection && <p className="mt-1 text-sm text-foreground">{l.reflection}</p>}
                {l.nextTimeCue && <p className="mt-1 text-sm text-primary">Cue: {l.nextTimeCue}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <SafetyDisclaimer variant="full" />
    </div>
  );
}
