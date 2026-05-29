// ============================================================
// POST /api/research/run
//
// Triggers a new research run.
// Called by:
//   • Vercel Cron (every 90 days) — Authorization header
//   • Admin UI — requires ADMIN_SECRET header
//   • Manual curl / admin script
//
// Security:
//   • Vercel Cron requests include Authorization: Bearer <CRON_SECRET>
//   • Admin requests must include x-admin-secret header
//   • Neither secret is ever sent to the client
//   • No private user data is accessed during research
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  runResearchWorkflow,
  buildLLMConfig,
  computeNextScheduled,
} from '@swingiq/core';

const CRON_SECRET = process.env.CRON_SECRET;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron auth
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;

  // Admin manual trigger
  const adminHeader = req.headers.get('x-admin-secret');
  if (ADMIN_SECRET && adminHeader === ADMIN_SECRET) return true;

  // Development mode — allow if neither secret is configured
  if (!CRON_SECRET && !ADMIN_SECRET && process.env.NODE_ENV === 'development') return true;

  return false;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { scope?: string[]; dry_run?: boolean; triggered_by?: string } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch { /* empty body is fine */ }

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const triggeredBy = (body.triggered_by as 'cron' | 'admin' | 'manual') ?? 'admin';
  const scope = (body.scope as never[]) ?? ['full'];
  const dryRun = body.dry_run ?? false;

  const llm = buildLLMConfig();

  // Run the research workflow
  // This is intentionally async — for long runs in production,
  // consider moving to a background job / Supabase edge function.
  const result = await runResearchWorkflow({
    run_id: runId,
    triggered_by: triggeredBy,
    scope,
    llm,
    dry_run: dryRun,
  });

  // TODO: Persist result.run, result.sources, result.proposals to Supabase
  // For now, return the full result so admins can see what happened
  // In production, only return the run summary (not raw source data)

  return NextResponse.json({
    run: result.run,
    sources_count: result.sources.length,
    proposals_count: result.proposals.length,
    proposals: result.proposals.map((p) => ({
      id: p.id,
      metric_name: p.metric_name,
      club_type: p.club_type,
      change_type: p.proposed_change_type,
      risk_level: p.risk_level,
      confidence_score: p.confidence_score,
      review_status: p.review_status,
      rationale: p.rationale,
    })),
    next_scheduled_at: computeNextScheduled(),
    errors: result.errors,
  }, { status: 200 });
}

// GET returns current status / last run info
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Research run endpoint ready.',
    ai_provider: process.env.AI_PROVIDER ?? 'none',
    auto_approve_enabled: process.env.RESEARCH_AUTO_APPROVE_LOW_RISK === 'true',
    next_scheduled_at: computeNextScheduled(),
    instructions: {
      trigger_manual: 'POST /api/research/run with x-admin-secret header',
      dry_run: 'Add { "dry_run": true } to body to test without persisting',
      full_scope: 'Add { "scope": ["full"] } for complete research cycle',
    },
  });
}
