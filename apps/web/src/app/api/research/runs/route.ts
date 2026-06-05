// ============================================================
// GET /api/research/runs
// Returns list of research runs (from Supabase in production,
// returns demo data in development when DB not configured).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { BASELINE_VERSION } from '@swingiq/core';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function isAuthorized(req: NextRequest): boolean {
  const adminHeader = req.headers.get('x-admin-secret');
  if (ADMIN_SECRET && adminHeader === ADMIN_SECRET) return true;
  if (!ADMIN_SECRET && process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // TODO: Replace with Supabase query:
  // const { data } = await supabase
  //   .from('research_runs')
  //   .select('*')
  //   .order('created_at', { ascending: false })
  //   .limit(20);

  // Return demo data when DB is not yet connected
  const demoRuns = [
    {
      id: 'demo_baseline',
      scheduled_at: BASELINE_VERSION.created_at,
      started_at: BASELINE_VERSION.created_at,
      completed_at: BASELINE_VERSION.created_at,
      status: 'completed',
      scope: ['full'],
      sources_reviewed: 8,
      sources_accepted: 7,
      sources_rejected: 1,
      proposals_created: 0,
      proposals_approved: 0,
      proposals_rejected: 0,
      model_used: null,
      prompt_version: '1.0.0',
      errors: [],
      summary: 'Baseline research run establishing SwingVantage v1.0.0 benchmark standards. ' +
        'Values derived from TrackMan education resources, USGA standards, and established ' +
        'golf instruction principles. No AI model used for baseline — values are manually verified.',
      triggered_by: 'manual',
      next_scheduled_at: null,
      is_demo: true,
    },
  ];

  return NextResponse.json({
    runs: demoRuns,
    total: demoRuns.length,
    active_benchmark_version: BASELINE_VERSION.version,
    note: 'DB not connected — showing baseline demo data. Connect Supabase to enable persistent run history.',
  });
}
