// ============================================================
// SwingVantage — scheduled-publish runner (SERVER-ONLY)
//
// Publishes posts whose scheduled time has arrived. Driven by the cron
// route (/api/social/run-scheduled). Keyless-first: if persistence is off
// or autopublish is off, it no-ops cleanly and reports why.
// ============================================================

import { listDuePosts, persistenceAvailable, updatePost } from './store';
import { isAutopublishEnabled, publishPost } from './publishers';

export interface RunSummary {
  ran: boolean;
  reason?: string;
  due: number;
  published: number;
  failed: number;
  results: { id: string; platform: string; outcome: string }[];
}

export async function runScheduledPublish(now = new Date().toISOString()): Promise<RunSummary> {
  const base = { due: 0, published: 0, failed: 0, results: [] as RunSummary['results'] };
  if (!persistenceAvailable()) return { ran: false, reason: 'persistence not configured', ...base };
  if (!isAutopublishEnabled()) return { ran: false, reason: 'autopublish off', ...base };

  const due = await listDuePosts(now);
  let published = 0;
  let failed = 0;
  const results: RunSummary['results'] = [];

  for (const post of due) {
    const r = await publishPost(post);
    const ok = r.outcome === 'published' || r.outcome === 'queued';
    if (ok) {
      await updatePost(post.id, { status: 'published' });
      published += 1;
    } else {
      failed += 1; // left 'scheduled' so the next run retries
    }
    results.push({ id: post.id, platform: post.platform, outcome: r.outcome });
  }

  return { ran: true, due: due.length, published, failed, results };
}
