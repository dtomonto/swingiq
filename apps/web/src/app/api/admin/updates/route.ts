// ============================================================
// POST /api/admin/updates — publish / unpublish an auto-generated update
// ------------------------------------------------------------
// Secure by construction: re-asserts admin + the content.publish permission
// server-side (never trusts the client), then flips the targeted entry's
// status in its versioned data file. The audit entry is recorded client-side
// after a successful response (local-first audit log).
//
// Writes only succeed in a writable environment (local dev). Production's
// runtime FS is read-only, so this returns a clear, honest 409 there.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import {
  setPublishState,
  readProductCandidate,
  readProductCandidates,
  type PublishKind,
} from '@/lib/admin/updates-store';
import { setContentPublishState } from '@/lib/admin/content-publish-store';
import { validateUpdate, scoreUpdateQuality } from '@/lib/updates/validation';
import { recordPublishDecision } from '@/lib/publishing/service';
import type { PublishEntityType } from '@/lib/publishing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS: PublishKind[] = ['product', 'dev', 'seo', 'blog'];

/** Map the legacy publish kind to a PublishingOS entity type. */
const KIND_TO_ENTITY: Record<PublishKind, PublishEntityType> = {
  product: 'update',
  dev: 'dev-update',
  seo: 'seo-page',
  blog: 'blog-post',
};

/** Public route each kind controls (revalidated after a durable publish). */
const KIND_TO_ROUTE: Record<PublishKind, string> = {
  product: '/updates',
  dev: '/dev-updates',
  seo: '/',
  blog: '/blog',
};

/**
 * GET /api/admin/updates — per-row quality scores for the Publishing table.
 * Lets the admin see each PRODUCT entry's validation status + quality score
 * BEFORE publishing (not just after). Read-only; admin-gated.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const product = readProductCandidates().map((candidate) => {
    const validation = validateUpdate(candidate);
    const quality = scoreUpdateQuality(candidate);
    return {
      id: candidate.id,
      score: quality.score,
      needsHumanReview: quality.needsHumanReview,
      valid: validation.ok,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
    };
  });

  return NextResponse.json({ ok: true, product });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'content.publish')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { kind?: string; id?: string; action?: string; riskAcknowledged?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const { id, action } = body;
  // Type as the PublishKind union (validated below) so the dispatch narrows:
  // the else-branch becomes 'seo' | 'blog' (OverrideKind) for setContentPublishState.
  const kind = body.kind as PublishKind | undefined;
  if (!kind || !KINDS.includes(kind)) {
    return NextResponse.json({ error: 'invalid kind' }, { status: 400 });
  }
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  }

  const publish = action === 'publish';

  // Quality gate: a PRODUCT update may only go live if it passes validation
  // (title, unique URL-safe slug, summary, SEO metadata). This is what stops a
  // published card from existing without a valid, indexable detail page.
  // Unpublishing is never gated. Dev/seo/blog keep their existing flow.
  let quality: ReturnType<typeof scoreUpdateQuality> | undefined;
  let validationWarnings: string[] = [];
  if (publish && kind === 'product') {
    const candidate = readProductCandidate(id);
    if (!candidate) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    const validation = validateUpdate(candidate);
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: 'validation-failed',
          message: `Cannot publish — fix: ${validation.errors.map((e) => e.message).join(' ')}`,
          errors: validation.errors,
        },
        { status: 422 },
      );
    }
    validationWarnings = validation.warnings.map((w) => w.message);
    quality = scoreUpdateQuality(candidate);
  }

  const result =
    kind === 'product' || kind === 'dev'
      ? setPublishState(kind, id, publish)
      : setContentPublishState(kind, id, publish);

  if (!result.ok) {
    if (result.reason === 'read-only') {
      // PRODUCTION PATH: the filesystem is read-only, so instead of dead-ending
      // we persist the decision durably in PublishingOS (a DB override the
      // public read path honours) and revalidate the affected route. This is
      // what makes "publish in production" real — no commit/push required.
      const decision = await recordPublishDecision({
        entityType: KIND_TO_ENTITY[kind],
        entityId: id,
        title: readProductCandidate(id)?.title ?? id,
        slug: id,
        action: publish ? 'publish' : 'unpublish',
        actorEmail: admin.email ?? undefined,
        riskAcknowledged: body.riskAcknowledged === true,
        affectedRoutes: [KIND_TO_ROUTE[kind]],
      });
      if (!decision.ok) {
        return NextResponse.json(
          { error: decision.reason, message: decision.message },
          { status: decision.reason === 'blocked-critical' ? 423 : 422 },
        );
      }
      try {
        revalidatePath(KIND_TO_ROUTE[kind]);
      } catch {
        /* revalidation is best-effort */
      }
      return NextResponse.json({
        ok: true,
        kind,
        id,
        published: decision.published,
        mode: 'instant-db',
        persistent: decision.persistent,
        actor: admin.email ?? 'header-admin',
        ...(quality ? { qualityScore: quality.score, needsHumanReview: quality.needsHumanReview } : {}),
        ...(validationWarnings.length > 0 ? { warnings: validationWarnings } : {}),
      });
    }
    if (result.reason === 'not-found') {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  // LOCAL PATH: the file write succeeded — a reviewable git diff to commit/push.
  try {
    revalidatePath(KIND_TO_ROUTE[kind]);
  } catch {
    /* revalidation is best-effort */
  }
  return NextResponse.json({
    ok: true,
    kind,
    id,
    published: result.published,
    mode: 'file',
    actor: admin.email ?? 'header-admin',
    ...(quality ? { qualityScore: quality.score, needsHumanReview: quality.needsHumanReview } : {}),
    ...(validationWarnings.length > 0 ? { warnings: validationWarnings } : {}),
  });
}
