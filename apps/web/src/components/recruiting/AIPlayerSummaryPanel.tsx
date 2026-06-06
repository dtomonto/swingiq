'use client';

// ============================================================
// Recruiting — AIPlayerSummaryPanel
// ------------------------------------------------------------
// Generates the grounded player summary for six audiences. The
// keyless engine always produces it; an optional server re-word
// (api/recruiting/summary) only runs when AI is configured and must
// pass the no-exaggeration validator, else it falls back silently.
// Each claim shows its evidence source + confidence for traceability.
// ============================================================

import { useState } from 'react';
import { Sparkles, Copy, Check, Wand2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  useRecruitingStore,
  type SummaryAudience,
  type AIPlayerSummary,
} from '@/lib/recruiting';
import { ConfidenceBadge, DataSourceLabel } from './DataSourceLabel';

const AUDIENCES: { v: SummaryAudience; label: string }[] = [
  { v: 'coach', label: 'Coach' }, { v: 'scout', label: 'Scout' }, { v: 'parent', label: 'Parent' },
  { v: 'bio', label: 'Bio' }, { v: 'email_intro', label: 'Email intro' }, { v: 'social', label: 'Social' },
];

export function AIPlayerSummaryPanel() {
  const summaries = useRecruitingStore((s) => s.summaries);
  const generate = useRecruitingStore((s) => s.generateSummary);
  const saveSummary = useRecruitingStore((s) => s.saveSummary);

  const [audience, setAudience] = useState<SummaryAudience>('coach');
  const [copied, setCopied] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const current: AIPlayerSummary | undefined = summaries.find((s) => s.audience === audience);

  async function reword() {
    if (!current) return;
    setAiBusy(true);
    setAiNote(null);
    try {
      const res = await fetch('/api/recruiting/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, body: current.body, claims: current.claims, caveats: current.caveats }),
      });
      const data = (await res.json()) as { body?: string; usedAi?: boolean };
      if (data.body && data.usedAi) {
        saveSummary({ ...current, body: data.body, generator: 'ai' });
        setAiNote('Re-worded by AI (validated — no exaggeration).');
      } else {
        setAiNote('AI is not configured — keeping the grounded version.');
      }
    } catch {
      setAiNote('AI re-word unavailable — keeping the grounded version.');
    } finally {
      setAiBusy(false);
    }
  }

  function copy() {
    if (!current) return;
    navigator.clipboard?.writeText(current.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Sparkles size={17} className="text-primary" /> AI player summary</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCES.map((a) => (
            <button
              key={a.v}
              onClick={() => setAudience(a.v)}
              className={cn('rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                audience === a.v ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70 hover:text-foreground')}
            >
              {a.label}
            </button>
          ))}
        </div>

        {!current ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Generate an honest, grounded summary for the <b>{audience.replace('_', ' ')}</b> audience.</p>
            <Button onClick={() => generate(audience)}>Generate summary</Button>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{current.body}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => generate(audience)}>Regenerate</Button>
              <Button size="sm" variant="ghost" onClick={reword} loading={aiBusy}><Wand2 size={14} /> AI re-word</Button>
              <Button size="sm" variant="ghost" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</Button>
              <Badge variant={current.generator === 'ai' ? 'info' : 'default'}>{current.generator === 'ai' ? 'AI re-worded' : 'Grounded engine'}</Badge>
            </div>
            {aiNote && <p className="text-xs text-muted-foreground">{aiNote}</p>}

            {current.claims.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What backs this (traceable)</p>
                {current.claims.map((c, i) => (
                  <div key={i} className="rounded-md border border-border p-2 space-y-1">
                    <p className="text-sm text-foreground/90">{c.text}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <DataSourceLabel source={c.source} />
                      <ConfidenceBadge level={c.confidence} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {current.caveats.length > 0 && (
              <div className="rounded-md bg-warning/10 p-2.5">
                <p className="text-xs font-medium text-warning mb-1">Honest caveats</p>
                <ul className="list-disc list-inside text-xs text-foreground/80 space-y-0.5">
                  {current.caveats.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          This summary describes evidence and never projects a recruiting ceiling (no &quot;D1&quot;, &quot;pro-ready&quot;, or guarantees).
        </p>
      </CardBody>
    </Card>
  );
}
