// ============================================================
// GET  /api/research/proposals  — list all proposals
// PATCH /api/research/proposals  — approve or reject a proposal
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

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

  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('run_id');
  const status = searchParams.get('status'); // 'pending' | 'approved' | 'rejected'

  // TODO: Supabase query:
  // let query = supabase.from('benchmark_change_proposals').select('*');
  // if (runId) query = query.eq('research_run_id', runId);
  // if (status) query = query.eq('review_status', status);
  // const { data } = await query.order('created_at', { ascending: false });

  // Demo: return empty list with instructions
  return NextResponse.json({
    proposals: [],
    total: 0,
    filters: { run_id: runId, status },
    note: 'No proposals yet. Trigger a research run at POST /api/research/run to generate proposals.',
  });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: {
    proposal_id?: string;
    action?: 'approve' | 'reject' | 'defer';
    reviewer_notes?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { proposal_id, action, reviewer_notes } = body;

  if (!proposal_id || !action) {
    return NextResponse.json(
      { error: 'Missing required fields: proposal_id, action.' },
      { status: 400 },
    );
  }

  if (!['approve', 'reject', 'defer'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be approve, reject, or defer.' },
      { status: 400 },
    );
  }

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    defer: 'deferred',
  } as const;

  // TODO: Supabase update:
  // const { data, error } = await supabase
  //   .from('benchmark_change_proposals')
  //   .update({
  //     review_status: statusMap[action],
  //     reviewer_notes: reviewer_notes ?? null,
  //     reviewed_at: new Date().toISOString(),
  //   })
  //   .eq('id', proposal_id)
  //   .select()
  //   .single();

  // If all pending proposals for a run are resolved, check if a new version should be published
  // TODO: trigger planVersionApplication if all approved

  return NextResponse.json({
    proposal_id,
    new_status: statusMap[action],
    reviewer_notes: reviewer_notes ?? null,
    reviewed_at: new Date().toISOString(),
    message: `Proposal ${action}d successfully.`,
    next_step:
      action === 'approve'
        ? 'This proposal will be included in the next benchmark version publication.'
        : 'Proposal archived. No benchmark change will be applied.',
  });
}
