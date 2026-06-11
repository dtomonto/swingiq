'use client';

import { useState } from 'react';
import { Plus, Lightbulb } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { CompetitorDef, CompetitorInsight } from '@/lib/signal-radar/types';
import { Btn, EmptyState, INPUT_CLS } from './ui';

export function CompetitorWatch({ insights, competitors, onSave, disabled }: {
  insights: CompetitorInsight[];
  competitors: CompetitorDef[];
  onSave: (list: CompetitorDef[]) => void;
  disabled: boolean;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [terms, setTerms] = useState('');

  const toggle = (id: string) =>
    onSave(competitors.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));

  const add = () => {
    if (!name.trim()) return;
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32);
    if (competitors.some((c) => c.id === id)) return;
    onSave([
      ...competitors,
      { id, name: name.trim(), category: category.trim() || 'Other', terms: (terms || name).split(',').map((t) => t.trim()).filter(Boolean), enabled: true },
    ]);
    setName(''); setCategory(''); setTerms('');
  };

  const insightFor = (id: string) => insights.find((i) => i.competitorId === id);

  return (
    <div className="space-y-4">
      <SectionCard title="Competitor watch" description="How each competitor is showing up in your signals — and the positioning openings it creates.">
        {insights.every((i) => i.signalCount === 0) ? (
          <EmptyState title="No competitor signals yet" hint="When signals mention a competitor, you’ll see volume, sentiment, recurring weaknesses and SwingVantage positioning angles here." />
        ) : (
          <ul className="space-y-3">
            {insights.filter((i) => i.signalCount > 0).map((i) => (
              <li key={i.competitorId} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{i.competitorName}</h3>
                  <StatusBadge tone="info">{i.signalCount} signals</StatusBadge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <span className="text-success-text">+{i.sentimentBreakdown.positive} pos</span>
                  <span className="text-muted-foreground">{i.sentimentBreakdown.neutral} neu</span>
                  <span className="text-error-text">{i.sentimentBreakdown.negative} neg</span>
                  <span className="text-link">{i.sentimentBreakdown.mixed} mixed</span>
                </div>
                {i.weaknesses.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {i.weaknesses.map((w) => <StatusBadge key={w} tone="danger">{w}</StatusBadge>)}
                  </div>
                )}
                {i.positioningAngles.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {i.positioningAngles.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-xs text-link">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {a}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Configure competitors" description="Toggle who SignalRadar watches, or add your own. Disabled when previewing sample data.">
        <ul className="mb-4 grid gap-2 sm:grid-cols-2">
          {competitors.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground/70">{c.category}{insightFor(c.id)?.signalCount ? ` · ${insightFor(c.id)!.signalCount} signals` : ''}</p>
              </div>
              <Btn size="sm" tone={c.enabled ? 'primary' : 'ghost'} disabled={disabled} onClick={() => toggle(c.id)}>{c.enabled ? 'Watching' : 'Off'}</Btn>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={INPUT_CLS} disabled={disabled} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={INPUT_CLS} disabled={disabled} />
          <input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Match terms (comma-sep)" className={`${INPUT_CLS} sm:col-span-1`} disabled={disabled} />
          <Btn tone="primary" disabled={disabled || !name.trim()} onClick={add}><Plus className="h-4 w-4" /> Add</Btn>
        </div>
      </SectionCard>
    </div>
  );
}
