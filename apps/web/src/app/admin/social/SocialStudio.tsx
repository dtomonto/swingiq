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
}

type Status = 'approved' | 'rejected' | undefined;

const title = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const postKey = (p: { platform: string; variationType: string }) => `${p.platform}:${p.variationType}`;

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-red-500/15 text-red-300 border-red-500/30';
}

export function SocialStudio({ posts, choices, defaultPlatforms }: Props) {
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

  const finalText = (post: GeneratedPost) => edits[postKey(post)] ?? post.text;

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

  const field = 'w-full bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5 text-sm text-gray-100 focus:border-emerald-500 outline-none';
  const btn = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50';

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {/* ---- Controls ---- */}
      <aside className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-300">Blog post</label>
          <select className={field} value={slug} onChange={(e) => setSlug(e.target.value)}>
            {posts.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>

          <div>
            <span className="block text-xs font-semibold text-gray-300 mb-1.5">Platforms</span>
            <div className="grid grid-cols-2 gap-1.5">
              {choices.platforms.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-xs text-gray-300">
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
            <label className="block text-xs font-semibold text-gray-300 mb-1">Campaign (optional)</label>
            <input className={field} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="blog_distribution" />
          </div>

          <button onClick={generate} disabled={loading || !slug} className={`${btn} w-full bg-emerald-600 hover:bg-emerald-500 text-white`}>
            {loading ? 'Generating…' : 'Generate social posts'}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </aside>

      {/* ---- Results ---- */}
      <main className="min-w-0">
        {!result ? (
          <div className="bg-gray-900 border border-gray-800 border-dashed rounded-lg p-10 text-center text-gray-500 text-sm">
            Pick a post and platforms, then generate. Posts work with or without an AI key.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${result.source === 'ai' ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-gray-700/40 text-gray-300 border-gray-600'}`}>
                    {result.source === 'ai' ? `AI-written (${result.model})` : 'Keyless draft'}
                  </span>
                  <span className="text-xs text-gray-500">{result.posts.length} posts</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={generate} disabled={loading} className={`${btn} bg-gray-700 hover:bg-gray-600 text-gray-100`}>
                    {loading ? 'Regenerating…' : 'Regenerate all'}
                  </button>
                  <button onClick={exportCsv} className={`${btn} bg-gray-700 hover:bg-gray-600 text-gray-100`}>
                    Export CSV
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-3">
                <span className="text-gray-500">Angle:</span> {title(result.analysis.primaryAngle)} ·{' '}
                <span className="text-gray-500">Funnel:</span> {title(result.analysis.funnelStage)} ·{' '}
                <span className="text-gray-500">Audience:</span> {title(result.analysis.targetAudience)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Insight: {result.analysis.strongestInsight}</p>
            </div>

            {/* Platform tabs */}
            <div className="flex gap-1 flex-wrap">
              {platformTabs.map((p) => (
                <button
                  key={p}
                  onClick={() => setActive(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${active === p ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {platformLabel(p)}
                </button>
              ))}
            </div>

            {/* Active platform posts */}
            {active && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {platformLabel(active)} · {PLATFORM_RULES[active].linkRule.replace(/_/g, ' ')} · hashtags{' '}
                  {PLATFORM_RULES[active].hashtagRange.join('–')}
                </p>
                <button
                  onClick={() => regeneratePlatform(active)}
                  disabled={regenPlatform === active}
                  className={`${btn} bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs`}
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
                  <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-100">{title(post.variationType)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${scoreColor(post.qualityScore)}`}>
                          {post.qualityScore}
                        </span>
                        <span className="text-xs text-gray-500">{title(post.hookType)} hook</span>
                      </div>
                      <span className={`text-xs ${over ? 'text-red-400' : 'text-gray-500'}`}>
                        {text.length}/{max}
                      </span>
                    </div>

                    <textarea
                      value={text}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                      rows={Math.min(8, Math.max(3, Math.ceil(text.length / 60)))}
                      className="w-full bg-gray-950 border border-gray-700 rounded-md p-2.5 text-sm text-gray-100 font-mono leading-relaxed focus:border-emerald-500 outline-none"
                    />

                    {post.hashtags.length > 0 && (
                      <p className="text-xs text-sky-300/80 mt-1.5">{post.hashtags.join(' ')}</p>
                    )}

                    {post.warnings.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {post.warnings.map((w, i) => (
                          <li key={i} className="text-xs text-amber-400/90">⚠ {w}</li>
                        ))}
                      </ul>
                    )}

                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Link &amp; rationale</summary>
                      <p className="text-xs text-gray-400 mt-1 break-all">{post.utmUrl || '(link in pin destination)'}</p>
                      <p className="text-xs text-gray-500 mt-1 italic">{post.rationale}</p>
                    </details>

                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => copyPost(post)} className={`${btn} bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs`}>
                        {copied === key ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => setStatuses((p) => ({ ...p, [key]: status === 'approved' ? undefined : 'approved' }))}
                        className={`${btn} text-xs ${status === 'approved' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                      >
                        {status === 'approved' ? '✓ Approved' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setStatuses((p) => ({ ...p, [key]: status === 'rejected' ? undefined : 'rejected' }))}
                        className={`${btn} text-xs ${status === 'rejected' ? 'bg-red-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                      >
                        {status === 'rejected' ? '✕ Rejected' : 'Reject'}
                      </button>
                    </div>
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
      <label className="block text-xs font-semibold text-gray-300 mb-1">{label}</label>
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
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-100 mb-2">{t}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-xs text-gray-400">
      <span className="text-gray-500">{k}:</span> {v}
    </p>
  );
}
