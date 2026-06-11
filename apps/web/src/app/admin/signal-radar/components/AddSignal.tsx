'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type { RawSignalInput, Signal, SignalSourceType, SignalSport } from '@/lib/signal-radar/types';
import type { ImportKind } from '@/lib/signal-radar/useSignalRadar';
import { SOURCE_TYPE_LABEL, SPORT_LABEL } from '@/lib/signal-radar/labels';
import { Btn, INPUT_CLS, SubTabs } from './ui';

type Mode = 'manual' | 'import_google_alerts' | 'import_rss' | 'import_csv';

const MANUAL_SOURCES: SignalSourceType[] = ['manual', 'reddit', 'youtube', 'social', 'blog_news', 'ai_answer_engine', 'support', 'search'];
const SPORTS: SignalSport[] = ['unknown', 'golf', 'tennis', 'baseball', 'softball_fast', 'softball_slow', 'pickleball', 'padel', 'multi_sport'];

const IMPORT_KIND: Record<string, ImportKind> = {
  import_google_alerts: 'google_alerts', import_rss: 'rss', import_csv: 'csv',
};
const IMPORT_HINT: Record<string, string> = {
  import_google_alerts: 'Paste the body of a Google Alerts email/digest. Each result block becomes a signal.',
  import_rss: 'Paste an RSS/Atom feed body — e.g. reddit.com/r/golf/search.rss?q=swing+analysis, a blog /feed, or a YouTube channel feed. Fully ToS-safe.',
  import_csv: 'Paste a CSV with any of: url/link, title, text/snippet, source, author, published.',
};

export function AddSignal({ onClose, onAddManual, onImport }: {
  onClose: () => void;
  onAddManual: (input: Omit<RawSignalInput, 'collectionMethod'>) => Signal | null;
  onImport: (kind: ImportKind, text: string) => { added: number; duplicates: number };
}) {
  const [mode, setMode] = useState<Mode>('manual');
  const [result, setResult] = useState<string | null>(null);

  // manual fields
  const [sourceType, setSourceType] = useState<SignalSourceType>('manual');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [sportHint, setSportHint] = useState<SignalSport>('unknown');

  // import field
  const [bulk, setBulk] = useState('');

  const submitManual = () => {
    if (!text.trim()) return;
    const created = onAddManual({
      sourceType, sourceName: sourceName || undefined, sourceUrl: sourceUrl || undefined,
      title: title || undefined, text, authorName: authorName || undefined,
      publishedAt: publishedAt || undefined, sportHint: sportHint === 'unknown' ? undefined : sportHint,
    });
    if (created) {
      setResult(`Added — classified as ${created.classification.intent.replace(/_/g, ' ')}, priority ${created.scores.priority}.`);
      setText(''); setTitle(''); setSourceUrl(''); setAuthorName('');
    } else {
      setResult('That looks like a duplicate of an existing signal — nothing added.');
    }
  };

  const submitImport = () => {
    if (!bulk.trim()) return;
    const kind = IMPORT_KIND[mode];
    const { added, duplicates } = onImport(kind, bulk);
    setResult(`Imported ${added} new signal${added === 1 ? '' : 's'}${duplicates ? ` · skipped ${duplicates} duplicate${duplicates === 1 ? '' : 's'}` : ''}.`);
    if (added) setBulk('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-foreground/60" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold text-foreground">Add / import signals</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-4">
          <SubTabs<Mode>
            tabs={[
              { id: 'manual', label: 'Manual' },
              { id: 'import_google_alerts', label: 'Google Alerts' },
              { id: 'import_rss', label: 'RSS' },
              { id: 'import_csv', label: 'CSV' },
            ]}
            active={mode}
            onChange={(m) => { setMode(m); setResult(null); }}
          />

          {result && (
            <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-text">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {result}
            </div>
          )}

          {mode === 'manual' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted-foreground">Source type
                  <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SignalSourceType)} className={`${INPUT_CLS} mt-1`}>
                    {MANUAL_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_TYPE_LABEL[s]}</option>)}
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">Sport (optional override)
                  <select value={sportHint} onChange={(e) => setSportHint(e.target.value as SignalSport)} className={`${INPUT_CLS} mt-1`}>
                    {SPORTS.map((s) => <option key={s} value={s}>{s === 'unknown' ? 'Auto-detect' : SPORT_LABEL[s]}</option>)}
                  </select>
                </label>
              </div>
              <label className="block text-xs text-muted-foreground">Source name
                <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. r/golf, YouTube, a blog" className={`${INPUT_CLS} mt-1`} />
              </label>
              <label className="block text-xs text-muted-foreground">Source URL
                <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" className={`${INPUT_CLS} mt-1`} />
              </label>
              <label className="block text-xs text-muted-foreground">Title (optional)
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${INPUT_CLS} mt-1`} />
              </label>
              <label className="block text-xs text-muted-foreground">Mention text / quote *
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Paste the comment, post, quote, email or screenshot description…" className={`${INPUT_CLS} mt-1`} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted-foreground">Author (optional)
                  <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={`${INPUT_CLS} mt-1`} />
                </label>
                <label className="text-xs text-muted-foreground">Published (optional)
                  <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={`${INPUT_CLS} mt-1`} />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Btn onClick={onClose}>Close</Btn>
                <Btn tone="primary" disabled={!text.trim()} onClick={submitManual}>Add signal</Btn>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{IMPORT_HINT[mode]}</p>
              <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={10} placeholder="Paste here…" className={`${INPUT_CLS} font-mono text-xs`} />
              <div className="flex justify-end gap-2">
                <Btn onClick={onClose}>Close</Btn>
                <Btn tone="primary" disabled={!bulk.trim()} onClick={submitImport}>Import</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
