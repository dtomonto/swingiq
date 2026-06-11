'use client';

import { useState } from 'react';
import { Save, Play, Copy, Rss } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { SignalRadarConfig } from '@/lib/signal-radar/types';
import { parseFeedList } from '@/lib/signal-radar/feed-url';
import { Btn, INPUT_CLS } from './ui';

export function ScheduledCollection({ config, onUpdate }: {
  config: SignalRadarConfig;
  onUpdate: (patch: Partial<SignalRadarConfig>) => void;
}) {
  const [draft, setDraft] = useState(config.feedSources.join('\n'));
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const valid = parseFeedList(draft);

  const save = () => { onUpdate({ feedSources: valid }); setStatus(`Saved ${valid.length} feed${valid.length === 1 ? '' : 's'}.`); };

  const copyEnv = () => {
    try { void navigator.clipboard?.writeText(valid.join(',')); setStatus('Copied SIGNALRADAR_FEEDS value to clipboard — paste it into your deploy env.'); }
    catch { setStatus('Copy failed — select the feed list and copy manually.'); }
  };

  const runNow = async () => {
    if (!valid.length) { setStatus('Add at least one valid https feed URL first.'); return; }
    setRunning(true); setStatus(null);
    try {
      const res = await fetch('/api/signal-radar/cron', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ feeds: valid }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus(`Run failed (${res.status}).`); }
      else if (!data.enabled) { setStatus('Fetched, but nothing was stored — the durable store (Supabase) isn’t configured, so automated collection is off.'); }
      else { setStatus(`Collected ${data.added} new signal${data.added === 1 ? '' : 's'} from ${data.fetched}/${data.feeds} feed${data.feeds === 1 ? '' : 's'}${data.errors?.length ? ` · ${data.errors.length} error(s)` : ''}.`); }
    } catch { setStatus('Run failed — network error.'); }
    finally { setRunning(false); }
  };

  return (
    <SectionCard
      title={<span className="flex items-center gap-2"><Rss className="h-4 w-4 text-muted-foreground" /> Scheduled feeds</span>}
      description="Keyless, ToS-safe. Add RSS/Atom feed URLs (a blog /feed, reddit.com/r/golf/search.rss?q=swing+analysis, a YouTube channel feed). Save them here, Copy env to wire the scheduler, or Run now to pull immediately."
      actions={
        <div className="flex gap-2">
          <Btn size="sm" onClick={copyEnv} title="Copy as SIGNALRADAR_FEEDS env value"><Copy className="h-3.5 w-3.5" /> Copy env</Btn>
          <Btn size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Save</Btn>
          <Btn size="sm" tone="primary" disabled={running} onClick={runNow}><Play className="h-3.5 w-3.5" /> {running ? 'Running…' : 'Run now'}</Btn>
        </div>
      }
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        placeholder="https://www.reddit.com/r/golf/search.rss?q=swing%20analysis&#10;https://example.com/blog/feed"
        className={`${INPUT_CLS} font-mono text-xs`}
      />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{valid.length} valid https feed{valid.length === 1 ? '' : 's'} (http and private hosts are rejected).</span>
        <StatusBadge tone={valid.length ? 'success' : 'neutral'}>{valid.length ? 'Ready' : 'No feeds'}</StatusBadge>
      </div>
      {status && <p className="mt-2 text-xs text-link">{status}</p>}
    </SectionCard>
  );
}
