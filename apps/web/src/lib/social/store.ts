// ============================================================
// SwingVantage — Blog-to-Social: persistence layer (SERVER-ONLY)
//
// Saves/loads generations via the service-role client. Everything here
// degrades gracefully: if Supabase isn't configured (or the optional
// schema hasn't been run), every call returns null/[]/false and the
// Studio simply stays in-session. Run server/supabase_schema_social.sql
// to turn persistence on.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type {
  BlogAnalysis,
  CreativeSuggestions,
  GeneratedPost,
  PostStatus,
  ScheduleRecommendation,
  SocialGeneration,
} from './types';

export interface SaveOverrides {
  edits?: Record<string, string>; // key = `${platform}:${variationType}`
  statuses?: Record<string, PostStatus>;
}

export interface SavedPost {
  id: string;
  platform: string;
  variationType: string;
  text: string; // final/edited text
  generatedText: string;
  utmUrl: string;
  hashtags: string[];
  hookType: string;
  ctaType: string;
  status: PostStatus;
  qualityScore: number | null;
  warnings: string[];
  rationale: string | null;
}

export interface SavedGeneration {
  id: string;
  blogSlug: string;
  blogUrl: string;
  source: string;
  model: string;
  createdAt: string;
  analysis: BlogAnalysis;
  creative: CreativeSuggestions;
  schedule: ScheduleRecommendation;
  posts: SavedPost[];
}

export const postKeyOf = (p: { platform: string; variationType: string }) =>
  `${p.platform}:${p.variationType}`;

/** True when the service-role client exists (Supabase configured). */
export function persistenceAvailable(): boolean {
  return createSupabaseAdminClient() !== null;
}

/** Pure: build the social_posts rows for an insert. Exported for tests. */
export function toPostRows(gen: SocialGeneration, ov: SaveOverrides = {}, generationId?: string) {
  return gen.posts.map((p: GeneratedPost) => {
    const key = postKeyOf(p);
    const edited = ov.edits?.[key];
    return {
      generation_id: generationId ?? null,
      blog_slug: gen.blogSlug,
      platform: p.platform,
      variation_type: p.variationType,
      generated_text: p.text,
      edited_text: edited ?? null,
      final_text: edited ?? p.text,
      utm_url: p.utmUrl,
      hashtags: p.hashtags,
      hook_type: p.hookType,
      cta_type: p.ctaType,
      status: ov.statuses?.[key] ?? 'draft',
      quality_score: p.qualityScore,
      warnings: p.warnings,
      rationale: p.rationale,
      generation_model: gen.model,
      prompt_version: gen.promptVersion,
    };
  });
}

/** Insert a generation + its posts. Returns ids (keyed by platform:variation) or null. */
export async function saveGeneration(
  gen: SocialGeneration,
  ov: SaveOverrides = {},
): Promise<{ id: string; postIds: Record<string, string> } | null> {
  const sb = createSupabaseAdminClient();
  if (!sb) return null;
  try {
    const { data: g, error: gErr } = await sb
      .from('social_generations')
      .insert({
        blog_slug: gen.blogSlug,
        blog_url: gen.blogUrl,
        source: gen.source,
        model: gen.model,
        prompt_version: gen.promptVersion,
        options: gen.options,
        analysis: gen.analysis,
        creative: gen.creative,
        schedule: gen.schedule,
        warnings: gen.warnings,
      })
      .select('id')
      .single();
    if (gErr || !g) return null;
    const genId = (g as { id: string }).id;

    const { data: inserted, error: pErr } = await sb
      .from('social_posts')
      .insert(toPostRows(gen, ov, genId))
      .select('id, platform, variation_type');
    if (pErr) return { id: genId, postIds: {} };

    const postIds: Record<string, string> = {};
    for (const r of (inserted ?? []) as Array<{ id: string; platform: string; variation_type: string }>) {
      postIds[`${r.platform}:${r.variation_type}`] = r.id;
    }
    return { id: genId, postIds };
  } catch {
    return null;
  }
}

interface PostRow {
  id: string;
  generation_id: string;
  platform: string;
  variation_type: string;
  generated_text: string;
  final_text: string | null;
  utm_url: string;
  hashtags: string[] | null;
  hook_type: string | null;
  cta_type: string | null;
  status: PostStatus;
  quality_score: number | null;
  warnings: string[] | null;
  rationale: string | null;
}

/** Load recent saved generations (with posts) for a blog slug. */
export async function listGenerations(slug: string, limit = 10): Promise<SavedGeneration[]> {
  const sb = createSupabaseAdminClient();
  if (!sb) return [];
  try {
    const { data: gens, error } = await sb
      .from('social_generations')
      .select('id, blog_slug, blog_url, source, model, created_at, analysis, creative, schedule')
      .eq('blog_slug', slug)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !gens) return [];

    const genRows = gens as Array<{
      id: string; blog_slug: string; blog_url: string; source: string; model: string; created_at: string;
      analysis: BlogAnalysis; creative: CreativeSuggestions; schedule: ScheduleRecommendation;
    }>;
    const ids = genRows.map((g) => g.id);
    if (ids.length === 0) return [];

    const { data: posts } = await sb.from('social_posts').select('*').in('generation_id', ids);
    const byGen = new Map<string, SavedPost[]>();
    for (const r of (posts ?? []) as PostRow[]) {
      const sp: SavedPost = {
        id: r.id,
        platform: r.platform,
        variationType: r.variation_type,
        text: r.final_text ?? r.generated_text,
        generatedText: r.generated_text,
        utmUrl: r.utm_url,
        hashtags: r.hashtags ?? [],
        hookType: r.hook_type ?? '',
        ctaType: r.cta_type ?? '',
        status: r.status,
        qualityScore: r.quality_score,
        warnings: r.warnings ?? [],
        rationale: r.rationale,
      };
      const arr = byGen.get(r.generation_id) ?? [];
      arr.push(sp);
      byGen.set(r.generation_id, arr);
    }

    return genRows.map((g) => ({
      id: g.id,
      blogSlug: g.blog_slug,
      blogUrl: g.blog_url,
      source: g.source,
      model: g.model,
      createdAt: g.created_at,
      analysis: g.analysis,
      creative: g.creative,
      schedule: g.schedule,
      posts: byGen.get(g.id) ?? [],
    }));
  } catch {
    return [];
  }
}

/** Update one post's final text and/or status; records an edit version. */
export async function updatePost(
  id: string,
  patch: { finalText?: string; status?: PostStatus; note?: string },
): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  if (!sb) return false;
  try {
    const upd: Record<string, unknown> = {};
    if (typeof patch.finalText === 'string') {
      upd.final_text = patch.finalText;
      upd.edited_text = patch.finalText;
    }
    if (patch.status) {
      upd.status = patch.status;
      if (patch.status === 'published') upd.published_at = new Date().toISOString();
    }
    if (Object.keys(upd).length > 0) {
      const { error } = await sb.from('social_posts').update(upd).eq('id', id);
      if (error) return false;
    }
    if (typeof patch.finalText === 'string') {
      await sb.from('social_post_versions').insert({ post_id: id, text: patch.finalText, note: patch.note ?? null });
    }
    return true;
  } catch {
    return false;
  }
}
