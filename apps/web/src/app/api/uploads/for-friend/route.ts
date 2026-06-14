// ============================================================
// WS-06 — POST /api/uploads/for-friend
// Creates a video-analysis row assigned to a FRIEND athlete, but only after
// server-side authorization (accepted friend + allow_upload_for_me). The
// athlete id is resolved/trusted server-side; the client cannot assign an
// arbitrary user. Every assignment is recorded in the append-only audit log.
// The raw video never touches the server — only analysis metadata.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { FriendAuthError } from '@/lib/friends/authz';
import {
  resolveUploadTarget,
  buildOwnershipColumns,
  buildAuditEntry,
} from '@/lib/upload-for-friend/service';

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(`${clientIp(req)}:upload-for-friend`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const server = await createSupabaseServerClient();
  if (!server) return NextResponse.json({ error: 'Cloud sync is not configured.' }, { status: 503 });

  let body: {
    athleteUserId?: string;
    sport?: string;
    fileName?: string;
    analysis?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Authorize + resolve the trusted athlete id (throws FriendAuthError on denial).
  let target;
  try {
    target = await resolveUploadTarget({
      server,
      actorUserId: user.id,
      requestedAthleteUserId: body.athleteUserId ?? null,
    });
  } catch (e) {
    if (e instanceof FriendAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Could not authorize this upload.' }, { status: 500 });
  }

  const ownership = buildOwnershipColumns(target, user.id);
  const id = `vid_${globalThis.crypto.randomUUID()}`;

  // The athlete is the legacy owner (user_id) so it appears in THEIR history;
  // the friend-insert RLS policy permits this because the actor is the
  // uploaded_by_user_id and the athlete granted allow_upload_for_me.
  const { error: insertErr } = await server.from('video_analyses').insert({
    id,
    user_id: target.athleteUserId,
    sport: typeof body.sport === 'string' ? body.sport : 'golf',
    file_name: typeof body.fileName === 'string' ? body.fileName : '',
    analysis: body.analysis ?? null,
    ...ownership,
  });
  if (insertErr) {
    return NextResponse.json({ error: 'Could not save the upload.' }, { status: 400 });
  }

  // Append-only audit trail (best-effort; never blocks a successful upload).
  const audit = buildAuditEntry(target, user.id, { videoAnalysisId: id });
  await server.from('upload_audit_log').insert(audit);

  return NextResponse.json({
    id,
    athleteUserId: target.athleteUserId,
    uploadContext: target.context,
    permissionStatus: target.permissionStatus,
  });
}
