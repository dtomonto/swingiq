'use client';

import { useMemo, useState } from 'react';
import { PLATFORM_RULES, platformLabel } from '@/lib/social/platforms';
import type { GeneratedPost, Platform, SocialGeneration } from '@/lib/social/types';

interface PostLite {
  slug: string;
  title: string;
  sport: string;
  category: string;
  publishDate: string;
}

interface Choices {
  platforms: readonly string[];
  brandVoices: readonly string[];
  audiences: readonly string[];
  objectives: readonly string[];
  ctaIntensities: readonly string[];
  automation: readonly string[];
}

interface Props {
  posts: PostLite[];
  choices: Choices;
  defaultPlatforms: string[];
  /** Blog posts the commit hook flagged for social (newest first). */
  pending?: { slug: string; title: string }[];
  /** Server-computed publish capability per channel (no creds exposed). */
  publishCaps?: { autopublish: boolean; channels: Record<string, 'direct' | 'webhook' | 'none'> };
}

// Shape of /api/social/list rows (kept local so we don't import the
// server-only store module into the client bundle).
interface SavedPostLite {
  id: string;
  platform: string;
  variationType: string;
  text: string;
  generatedText: string;
  utmUrl: string;
  hashtags: string[];
  hookType: string;
  ctaType: string;
  status: string;
  qualityScore: number | null;
  warnings: string[];
  rationale: string | null;
}
interface SnapshotLite {
  id: string;
  blogSlug: string;
  blogUrl: string;
  source: 'ai' | 'fallback';
  model: string;
  createdAt: string;
  analysis: SocialGeneration['analysis'];
  creative: SocialGeneration['creative'];
  schedule: SocialGeneration['schedule'];
  posts: SavedPostLite[];
}

type Status = 'approved' | 'rejected' | undefined;

const title = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const postKey = (p: { platform: string; variationType: string }) => `${p.platform}:${p.variationType}`;

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-success/15 text-success-text border-success/30';
  if (score >= 60) return 'bg-primary/15 text-link border-primary/30';
  return 'bg-error/15 text-error-text border-error/30';
}

export function SocialStudio({
  posts,
  choices,
  defaultPlatforms,
  pending = [],
  publishCaps = { autopublish: false, channels: {} },
}: Props) {
  const [slug, setSlug] = useState(posts[0]?.slug ?? '');
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(defaultPlatforms));
  const [brandVoice, setBrandVoice] = useState('coach');
  const [audience, setAudience] = useState('');
  const [objective, setObjective] = useState('drive_traffic');
  const [ctaIntensity, setCtaIntensity] = useState('medium');
  const [campaign, setCampaign] = useState('');

  const [loading, setLoading] = useState(false);
  const [regenPlatform, setRegenPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SocialGeneration | null>(null);
  const [active, setActive] = useState<Platform | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Persistence (optional — only active once the schema is run + Supabase set).
  const [savedInfo, setSavedInfo] = useState<{ genId: string; postIds: Record<string, string> } | null>(null);
  const [library, setLibrary] = useState<SnapshotLite[]>([]);
  const [savingLib, setSavingLib] = useState(false);
  const [persistOff, setPersistOff] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [versions, setVersions] = useState<Record<string, { id: string; text: string; createdAt: string }[]>>({});
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<Record<string, { outcome: string; detail?: string } | 'publishing'>>({});
  const [scheduleInput, setScheduleInput] = useState<Record<string, string>>({});
  const [scheduledAt, setScheduledAt] = useState<Record<string, string>>({});
  const [openMetrics, setOpenMetrics] = useState<string | null>(null);
  const [metricsInput, setMetricsInput] = useState<Record<string, { impressions: string; clicks: string; engagements: string }>>({});
  const [metricsMsg, setMetricsMsg] = useState<Record<string, string>>({});
  type Ranked = { key: string; ctr: number; clicks: number; samples: number };
  const [learning, setLearning] = useState<{ hasData: boolean; hooks: Ranked[]; platforms: Ranked[]; ctas: Ranked[] } | null>(null);

  const buildOptions = (override?: string[]) => ({
    platforms: override ?? Array.from(platforms),
    brandVoice,
    audience: audience || undefined,
    objective,
    ctaIntensity,
    campaign: campaign || undefined,
  });

  async function callApi(override?: string[]): Promise<SocialGeneration> {
    const res = await fetch('/api/social/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, options: buildOptions(override) }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      throw new Error(msg.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function generate() {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await callApi();
      setResult(data);
      setEdits({});
      setStatuses({});
      setSavedInfo(null);
      setActive((data.posts[0]?.platform as Platform) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function regeneratePlatform(p: Platform) {
    setRegenPlatform(p);
    setError(null);
    try {
      const data = await callApi([p]);
      setResult((prev) =>
        prev
          ? { ...prev, posts: prev.posts.filter((x) => x.platform !== p).concat(data.posts) }
          : data,
      );
      setEdits((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => k.startsWith(`${p}:`) && delete next[k]);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed.');
    } finally {
      setRegenPlatform(null);
    }
  }

  async function saveToLibrary() {
    if (!result) return;
    setSavingLib(true);
    setError(null);
    try {
      const res = await fetch('/api/social/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation: result, edits, statuses }),
      });
      if (res.status === 503) {
        setPersistOff(true);
        setError('Saving isn’t set up yet — run server/supabase_schema_social.sql to enable the library. Copy & CSV export still work.');
        return;
      }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      const data = (await res.json()) as { id: string; postIds: Record<string, string> };
      setSavedInfo({ genId: data.id, postIds: data.postIds ?? {} });
      refreshLibrary();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSavingLib(false);
    }
  }

  async function refreshLibrary() {
    if (!slug) return;
    try {
      const res = await fetch(`/api/social/list?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { generations?: SnapshotLite[]; persistence?: boolean };
      setLibrary(data.generations ?? []);
      setPersistOff(data.persistence === false);
    } catch {
      /* non-fatal */
    }
  }

  function loadSnapshot(snap: SnapshotLite) {
    const posts: GeneratedPost[] = snap.posts.map((sp) => ({
      platform: sp.platform as Platform,
      variationType: sp.variationType as GeneratedPost['variationType'],
      text: sp.generatedText,
      charCount: sp.generatedText.length,
      utmUrl: sp.utmUrl,
      hashtags: sp.hashtags,
      hookType: (sp.hookType || 'tactical') as GeneratedPost['hookType'],
      ctaType: (sp.ctaType || 'see_breakdown') as GeneratedPost['ctaType'],
      rationale: sp.rationale || '',
      qualityScore: sp.qualityScore ?? 0,
      warnings: sp.warnings,
    }));
    const nextEdits: Record<string, string> = {};
    const nextStatuses: Record<string, Status> = {};
    const postIds: Record<string, string> = {};
    for (const sp of snap.posts) {
      const key = `${sp.platform}:${sp.variationType}`;
      postIds[key] = sp.id;
      if (sp.text && sp.text !== sp.generatedText) nextEdits[key] = sp.text;
      if (sp.status === 'approved' || sp.status === 'rejected') nextStatuses[key] = sp.status;
    }
    setResult({
      blogSlug: snap.blogSlug,
      blogUrl: snap.blogUrl,
      source: snap.source,
      model: snap.model,
      promptVersion: 'social-v1',
      generatedAt: snap.createdAt,
      options: buildOptions() as SocialGeneration['options'],
      analysis: snap.analysis,
      posts,
      creative: snap.creative,
      schedule: snap.schedule,
      warnings: [],
    });
    setEdits(nextEdits);
    setStatuses(nextStatuses);
    setSavedInfo({ genId: snap.id, postIds });
    setActive((posts[0]?.platform as Platform) ?? null);
  }

  function setStatusAndPersist(key: string, next: Status) {
    setStatuses((p) => ({ ...p, [key]: next }));
    const id = savedInfo?.postIds[key];
    if (id) {
      fetch(`/api/social/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next ?? 'draft' }),
      }).catch(() => {});
    }
  }

  function persistEdit(post: GeneratedPost) {
    const key = postKey(post);
    const id = savedInfo?.postIds[key];
    const txt = edits[key];
    if (!id || txt === undefined) return;
    fetch(`/api/social/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalText: txt }),
    }).catch(() => {});
  }

  async function toggleHistory(post: GeneratedPost) {
    const key = postKey(post);
    if (openHistory === key) {
      setOpenHistory(null);
      return;
    }
    setOpenHistory(key);
    const id = savedInfo?.postIds[key];
    if (!id || versions[key]) return;
    try {
      const res = await fetch(`/api/social/posts/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as { versions?: { id: string; text: string; createdAt: string }[] };
      setVersions((v) => ({ ...v, [key]: data.versions ?? [] }));
    } catch {
      /* non-fatal */
    }
  }

  function restoreVersion(post: GeneratedPost, text: string) {
    const key = postKey(post);
    setEdits((p) => ({ ...p, [key]: text }));
    const id = savedInfo?.postIds[key];
    if (id) {
      fetch(`/api/social/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalText: text }),
      }).catch(() => {});
    }
  }

  const finalText = (post: GeneratedPost) => edits[postKey(post)] ?? post.text;

  async function publishOne(post: GeneratedPost) {
    const key = postKey(post);
    setPublishState((s) => ({ ...s, [key]: 'publishing' }));
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post: {
            platform: post.platform,
            variationType: post.variationType,
            text: finalText(post),
            utmUrl: post.utmUrl,
            hashtags: post.hashtags,
            hookType: post.hookType,
            ctaType: post.ctaType,
            qualityScore: post.qualityScore,
          },
          postId: savedInfo?.postIds[key],
        }),
      });
      const data = (await res.json()) as { outcome?: string; detail?: string; error?: string };
      setPublishState((s) => ({
        ...s,
        [key]: { outcome: data.outcome ?? (res.ok ? 'published' : 'error'), detail: data.detail ?? data.error },
      }));
    } catch (e) {
      setPublishState((s) => ({ ...s, [key]: { outcome: 'error', detail: e instanceof Error ? e.message : 'Failed' } }));
    }
  }

  async function scheduleOne(post: GeneratedPost) {
    const key = postKey(post);
    const id = savedInfo?.postIds[key];
    const local = scheduleInput[key];
    if (!id || !local) return;
    const iso = new Date(local).toISOString();
    try {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'scheduled', scheduledAt: iso }),
      });
      if (res.ok) setScheduledAt((s) => ({ ...s, [key]: iso }));
    } catch {
      /* non-fatal */
    }
  }

  async function saveMetrics(post: GeneratedPost) {
    const key = postKey(post);
    const id = savedInfo?.postIds[key];
    if (!id) return;
    const m = metricsInput[key] ?? { impressions: '', clicks: '', engagements: '' };
    try {
      const res = await fetch('/api/social/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: id,
          metrics: {
            impressions: Number(m.impressions) || 0,
            clicks: Number(m.clicks) || 0,
            engagements: Number(m.engagements) || 0,
            source: 'manual',
          },
        }),
      });
      setMetricsMsg((s) => ({ ...s, [key]: res.ok ? 'Saved ✓' : 'Failed' }));
    } catch {
      setMetricsMsg((s) => ({ ...s, [key]: 'Failed' }));
    }
  }

  async function loadLearning() {
    try {
      const res = await fetch('/api/social/learning');
      if (!res.ok) return;
      setLearning(await res.json());
    } catch {
      /* non-fatal */
    }
  }

  async function copyPost(post: GeneratedPost) {
    const tags = post.hashtags.length ? `\n\n${post.hashtags.join(' ')}` : '';
    await navigator.clipboard.writeText(finalText(post) + tags);
    setCopied(postKey(post));
    setTimeout(() => setCopied(null), 1500);
  }

  function exportCsv() {
    if (!result) return;
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const rows = [
      ['platform', 'variation', 'status', 'quality', 'chars', 'final_text', 'hashtags', 'utm_url'],
      ...result.posts.map((p) => [
        p.platform,
        p.variationType,
        statuses[postKey(p)] ?? 'draft',
        String(p.qualityScore),
        String(finalText(p).length),
        finalText(p),
        p.hashtags.join(' '),
        p.utmUrl,
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-${result.blogSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activePosts = useMemo(
    () => (result && active ? result.posts.filter((p) => p.platform === active) : []),
    [result, active],
  );
  const platformTabs = useMemo(
    () => (result ? Array.from(new Set(result.posts.map((p) => p.platform))) : []),
    [result],
  );

  const field = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:border-success outline-none';
  const btn = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50';

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {/* ---- Controls ---- */}
      <aside className="space-y-4">
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <label htmlFor="ss-blog-post" className="block text-xs font-semibold text-foreground">Blog post</label>
          <select id="ss-blog-post" className={field} value={slug} onChange={(e) => setSlug(e.target.value)}>
            {posts.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>

          {pending.filter((p) => !dismissed.has(p.slug)).length > 0 && (
            <div className="rounded-md border border-primary/30 bg-primary/10 p-2.5">
              <p className="text-2xs font-semibold text-link mb-1.5">
                Flagged for social (new posts)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pending
                  .filter((p) => !dismissed.has(p.slug))
                  .map((p) => (
                    <span key={p.slug} className="inline-flex items-center gap-1 rounded bg-primary/15 border border-primary/30 px-1.5 py-0.5">
                      <button
                        onClick={() => setSlug(p.slug)}
                        title={p.title}
                        className="text-2xs text-link hover:text-white max-w-[150px] truncate"
                      >
                        {p.title}
                      </button>
                      <button
                        onClick={() => setDismissed((d) => new Set(d).add(p.slug))}
                        title="Dismiss"
                        className="text-link/70 hover:text-link text-2xs leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold text-foreground mb-1.5">Platforms</span>
            <div className="grid grid-cols-2 gap-1.5">
              {choices.platforms.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={platforms.has(p)}
                    onChange={() =>
                      setPlatforms((prev) => {
                        const next = new Set(prev);
                        next.has(p) ? next.delete(p) : next.add(p);
                        return next;
                      })
                    }
                  />
                  {platformLabel(p as Platform)}
                </label>
              ))}
            </div>
          </div>

          <Select label="Brand voice" value={brandVoice} onChange={setBrandVoice} opts={choices.brandVoices} cls={field} />
          <Select label="Audience (auto if blank)" value={audience} onChange={setAudience} opts={['', ...choices.audiences]} cls={field} />
          <Select label="Objective" value={objective} onChange={setObjective} opts={choices.objectives} cls={field} />
          <Select label="CTA intensity" value={ctaIntensity} onChange={setCtaIntensity} opts={choices.ctaIntensities} cls={field} />

          <div>
            <label htmlFor="ss-campaign" className="block text-xs font-semibold text-foreground mb-1">Campaign (optional)</label>
            <input id="ss-campaign" className={field} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="blog_distribution" />
          </div>

          <button onClick={generate} disabled={loading || !slug} className={`${btn} w-full bg-success hover:bg-success text-white`}>
            {loading ? 'Generating…' : 'Generate social posts'}
          </button>
          {error && <p className="text-xs text-error-text">{error}</p>}
        </div>
      </aside>

      {/* ---- Results ---- */}
      <main className="min-w-0">
        {!result ? (
          <div className="bg-card border border-border border-dashed rounded-lg p-10 text-center text-muted-foreground text-sm">
            Pick a post and platforms, then generate. Posts work with or without an AI key.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${result.source === 'ai' ? 'bg-primary/15 text-link border-primary/30' : 'bg-muted/40 text-foreground border-border'}`}>
                    {result.source === 'ai' ? `AI-written (${result.model})` : 'Keyless draft'}
                  </span>
                  <span className="text-xs text-muted-foreground">{result.posts.length} posts</span>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <button onClick={generate} disabled={loading} className={`${btn} bg-muted hover:bg-muted text-foreground`}>
                    {loading ? 'Regenerating…' : 'Regenerate all'}
                  </button>
                  <button
                    onClick={saveToLibrary}
                    disabled={savingLib || !!savedInfo}
                    title="Saves this generation, your edits, and approvals. Further edits/approvals then save automatically."
                    className={`${btn} ${savedInfo ? 'bg-success text-white' : 'bg-success hover:bg-success text-white'}`}
                  >
                    {savingLib ? 'Saving…' : savedInfo ? 'Saved ✓' : 'Save to library'}
                  </button>
                  <select
                    onFocus={refreshLibrary}
                    onChange={(e) => {
                      const s = library.find((g) => g.id === e.target.value);
                      if (s) loadSnapshot(s);
                    }}
                    value={savedInfo?.genId ?? ''}
                    className="bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                  >
                    <option value="">Library{library.length ? ` (${library.length})` : ''}…</option>
                    {library.map((g) => (
                      <option key={g.id} value={g.id}>
                        {new Date(g.createdAt).toLocaleString()} · {g.source}
                      </option>
                    ))}
                  </select>
                  <button onClick={exportCsv} className={`${btn} bg-muted hover:bg-muted text-foreground`}>
                    Export CSV
                  </button>
                  <button onClick={loadLearning} className={`${btn} bg-muted hover:bg-muted text-foreground`}>
                    What&apos;s working
                  </button>
                  {persistOff && (
                    <span className="text-xs text-link/80">
                      Library off — run server/supabase_schema_social.sql to enable saving
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground mt-3">
                <span className="text-muted-foreground">Angle:</span> {title(result.analysis.primaryAngle)} ·{' '}
                <span className="text-muted-foreground">Funnel:</span> {title(result.analysis.funnelStage)} ·{' '}
                <span className="text-muted-foreground">Audience:</span> {title(result.analysis.targetAudience)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Insight: {result.analysis.strongestInsight}</p>
            </div>

            {learning && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">What&apos;s working</h3>
                {!learning.hasData ? (
                  <p className="text-xs text-muted-foreground">
                    No performance data yet. Record metrics on published posts (the Metrics button),
                    then this shows your best hooks, CTAs, and platforms — and the generator leans into them.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    {(
                      [
                        ['Hooks', 'hooks'],
                        ['Platforms', 'platforms'],
                        ['CTAs', 'ctas'],
                      ] as const
                    ).map(([label, field]) => (
                      <div key={field}>
                        <p className="text-muted-foreground mb-1">{label}</p>
                        {learning[field].slice(0, 3).map((r) => (
                          <p key={r.key} className="text-foreground">
                            {title(r.key)}{' '}
                            <span className="text-muted-foreground">
                              · {(r.ctr * 100).toFixed(1)}% CTR ({r.samples})
                            </span>
                          </p>
                        ))}
                        {learning[field].length === 0 && <p className="text-muted-foreground/70">—</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Platform tabs */}
            <div className="flex gap-1 flex-wrap">
              {platformTabs.map((p) => (
                <button
                  key={p}
                  onClick={() => setActive(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${active === p ? 'bg-success text-white' : 'bg-muted text-foreground hover:bg-muted'}`}
                >
                  {platformLabel(p)}
                </button>
              ))}
            </div>

            {/* Active platform posts */}
            {active && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {platformLabel(active)} · {PLATFORM_RULES[active].linkRule.replace(/_/g, ' ')} · hashtags{' '}
                  {PLATFORM_RULES[active].hashtagRange.join('–')}
                </p>
                <button
                  onClick={() => regeneratePlatform(active)}
                  disabled={regenPlatform === active}
                  className={`${btn} bg-muted hover:bg-muted text-foreground text-xs`}
                >
                  {regenPlatform === active ? 'Regenerating…' : `Regenerate ${platformLabel(active)}`}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {activePosts.map((post) => {
                const key = postKey(post);
                const max = PLATFORM_RULES[post.platform].maxChars;
                const text = finalText(post);
                const over = text.length > max;
                const status = statuses[key];
                return (
                  <div key={key} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{title(post.variationType)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${scoreColor(post.qualityScore)}`}>
                          {post.qualityScore}
                        </span>
                        <span className="text-xs text-muted-foreground">{title(post.hookType)} hook</span>
                      </div>
                      <span className={`text-xs ${over ? 'text-error-text' : 'text-muted-foreground'}`}>
                        {text.length}/{max}
                      </span>
                    </div>

                    <textarea
                      value={text}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                      onBlur={() => persistEdit(post)}
                      rows={Math.min(8, Math.max(3, Math.ceil(text.length / 60)))}
                      className="w-full bg-background border border-border rounded-md p-2.5 text-sm text-foreground font-mono leading-relaxed focus:border-success outline-none"
                    />

                    {post.hashtags.length > 0 && (
                      <p className="text-xs text-link/80 mt-1.5">{post.hashtags.join(' ')}</p>
                    )}

                    {post.warnings.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {post.warnings.map((w, i) => (
                          <li key={i} className="text-xs text-link/90">⚠ {w}</li>
                        ))}
                      </ul>
                    )}

                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">Link &amp; rationale</summary>
                      <p className="text-xs text-muted-foreground mt-1 break-all">{post.utmUrl || '(link in pin destination)'}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">{post.rationale}</p>
                    </details>

                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => copyPost(post)} className={`${btn} bg-success/90 hover:bg-success text-white text-xs`}>
                        {copied === key ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => setStatusAndPersist(key, status === 'approved' ? undefined : 'approved')}
                        className={`${btn} text-xs ${status === 'approved' ? 'bg-success text-white' : 'bg-muted text-foreground hover:bg-muted'}`}
                      >
                        {status === 'approved' ? '✓ Approved' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setStatusAndPersist(key, status === 'rejected' ? undefined : 'rejected')}
                        className={`${btn} text-xs ${status === 'rejected' ? 'bg-error text-white' : 'bg-muted text-foreground hover:bg-muted'}`}
                      >
                        {status === 'rejected' ? '✕ Rejected' : 'Reject'}
                      </button>
                      {savedInfo?.postIds[key] && (
                        <button
                          onClick={() => toggleHistory(post)}
                          className={`${btn} text-xs bg-muted text-foreground hover:bg-muted`}
                        >
                          {openHistory === key ? 'Hide history' : 'History'}
                        </button>
                      )}
                      {savedInfo?.postIds[key] && (
                        <button
                          onClick={() => setOpenMetrics(openMetrics === key ? null : key)}
                          className={`${btn} text-xs bg-muted text-foreground hover:bg-muted`}
                        >
                          {openMetrics === key ? 'Hide metrics' : 'Metrics'}
                        </button>
                      )}
                      {publishCaps.autopublish &&
                        publishCaps.channels[post.platform] !== 'none' &&
                        status === 'approved' && (
                          <button
                            onClick={() => publishOne(post)}
                            disabled={publishState[key] === 'publishing'}
                            title={`Publish via ${publishCaps.channels[post.platform]}`}
                            className={`${btn} text-xs bg-primary text-white hover:bg-primary`}
                          >
                            {publishState[key] === 'publishing'
                              ? 'Publishing…'
                              : `Publish (${publishCaps.channels[post.platform]})`}
                          </button>
                        )}
                      {(() => {
                        const ps = publishState[key];
                        if (!ps || ps === 'publishing') return null;
                        const ok = ps.outcome === 'published' || ps.outcome === 'queued';
                        return (
                          <span className={`text-xs ${ok ? 'text-success-text' : 'text-error-text'}`}>
                            {ps.outcome}
                            {ps.detail ? ` — ${ps.detail}` : ''}
                          </span>
                        );
                      })()}
                      {savedInfo?.postIds[key] && status === 'approved' && (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="datetime-local"
                            value={scheduleInput[key] ?? ''}
                            onChange={(e) => setScheduleInput((s) => ({ ...s, [key]: e.target.value }))}
                            className="bg-background border border-border rounded px-1.5 py-1 text-xs text-foreground"
                          />
                          <button
                            onClick={() => scheduleOne(post)}
                            disabled={!scheduleInput[key]}
                            className={`${btn} text-xs bg-muted text-foreground hover:bg-muted`}
                          >
                            Schedule
                          </button>
                        </span>
                      )}
                      {scheduledAt[key] && (
                        <span className="text-xs text-link">
                          ⏰ {new Date(scheduledAt[key]).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {openHistory === key && (
                      <div className="mt-2 border-t border-border pt-2">
                        {!versions[key] ? (
                          <p className="text-xs text-muted-foreground">Loading history…</p>
                        ) : versions[key].length === 0 ? (
                          <p className="text-xs text-muted-foreground">No saved edits yet — edits are recorded once you save to the library.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {versions[key].map((v) => (
                              <li key={v.id} className="text-xs text-muted-foreground flex items-start justify-between gap-2">
                                <span className="min-w-0">
                                  <span className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}:</span>{' '}
                                  <span className="text-foreground">
                                    {v.text.slice(0, 120)}
                                    {v.text.length > 120 ? '…' : ''}
                                  </span>
                                </span>
                                <button
                                  onClick={() => restoreVersion(post, v.text)}
                                  className="shrink-0 text-success-text hover:text-success-text"
                                >
                                  Restore
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {openMetrics === key && (
                      <div className="mt-2 border-t border-border pt-2">
                        <p className="text-xs text-muted-foreground mb-1.5">
                          Enter numbers from your analytics (Plausible/GA) to feed the learning loop.
                        </p>
                        <div className="flex flex-wrap items-end gap-2">
                          {(['impressions', 'clicks', 'engagements'] as const).map((f) => (
                            <label key={f} className="text-2xs text-muted-foreground">
                              <span className="block mb-0.5 capitalize">{f}</span>
                              <input
                                type="number"
                                min={0}
                                value={metricsInput[key]?.[f] ?? ''}
                                onChange={(e) =>
                                  setMetricsInput((s) => {
                                    const cur = s[key] ?? { impressions: '', clicks: '', engagements: '' };
                                    return { ...s, [key]: { ...cur, [f]: e.target.value } };
                                  })
                                }
                                className="w-20 bg-background border border-border rounded px-1.5 py-1 text-xs text-foreground"
                              />
                            </label>
                          ))}
                          <button
                            onClick={() => saveMetrics(post)}
                            className={`${btn} text-xs bg-success text-white hover:bg-success`}
                          >
                            Save metrics
                          </button>
                          {metricsMsg[key] && <span className="text-xs text-success-text">{metricsMsg[key]}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Creative + schedule */}
            <div className="grid md:grid-cols-2 gap-3">
              <Panel title="Creative direction">
                <Row k="Image" v={result.creative.imageConcept} />
                <Row k="Carousel" v={result.creative.carouselIdea} />
                <Row k="Video" v={result.creative.videoAngle} />
                <Row k="Overlay" v={result.creative.textOverlay} />
                <Row k="Thumbnail" v={result.creative.thumbnailHeadline} />
              </Panel>
              <Panel title="Schedule plan">
                <Row k="Best platform" v={platformLabel(result.schedule.bestPlatform)} />
                {result.schedule.cadence.map((s, i) => (
                  <Row key={i} k={`Day ${s.dayOffset}`} v={`${s.label} — ${platformLabel(s.platform)}`} />
                ))}
                <Row k="Timing" v={result.schedule.bestTimeNote} />
              </Panel>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  opts,
  cls,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opts: readonly string[];
  cls: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      <select className={cls} value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o === '' ? 'Auto' : title(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Panel({ title: t, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">{t}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="text-muted-foreground">{k}:</span> {v}
    </p>
  );
}
