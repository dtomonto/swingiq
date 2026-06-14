// ============================================================
// WS-06 — upload-for-friend authorization + ownership unit tests
// The security-critical path: a friend target must be authorized server-
// side, and the resolved (trusted) athlete id is what gets written.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveUploadTarget, buildOwnershipColumns, buildAuditEntry } from '../service';
import { FriendAuthError } from '@/lib/friends/authz';

// Minimal Supabase fake: select→or→maybeSingle resolves `row`.
function fakeClient(row: unknown): SupabaseClient {
  const terminal = { maybeSingle: async () => ({ data: row }) };
  return { from: () => ({ select: () => ({ or: () => terminal, eq: () => terminal }) }) } as unknown as SupabaseClient;
}
const accepted = (allow: boolean) => ({
  requester_user_id: 'me',
  receiver_user_id: 'friend',
  status: 'accepted',
  permissions: { allow_upload_for_me: allow },
});

describe('resolveUploadTarget', () => {
  it('treats no target as a self upload', async () => {
    const t = await resolveUploadTarget({ server: fakeClient(null), actorUserId: 'me' });
    expect(t).toEqual({ athleteUserId: 'me', context: 'self', permissionStatus: 'self_owned' });
  });
  it('treats self target as a self upload (ignores echoed id)', async () => {
    const t = await resolveUploadTarget({ server: fakeClient(null), actorUserId: 'me', requestedAthleteUserId: 'me' });
    expect(t.context).toBe('self');
  });
  it('rejects a non-friend target', async () => {
    await expect(
      resolveUploadTarget({ server: fakeClient(null), actorUserId: 'me', requestedAthleteUserId: 'friend' }),
    ).rejects.toBeInstanceOf(FriendAuthError);
  });
  it('rejects a friend who has not enabled uploads', async () => {
    await expect(
      resolveUploadTarget({ server: fakeClient(accepted(false)), actorUserId: 'me', requestedAthleteUserId: 'friend' }),
    ).rejects.toThrow(/not enabled/i);
  });
  it('authorizes a friend who enabled uploads', async () => {
    const t = await resolveUploadTarget({
      server: fakeClient(accepted(true)),
      actorUserId: 'me',
      requestedAthleteUserId: 'friend',
    });
    expect(t).toEqual({ athleteUserId: 'friend', context: 'friend', permissionStatus: 'friend_granted' });
  });
});

describe('ownership + audit', () => {
  it('attributes the session to the athlete, uploaded/assigned by the actor', () => {
    const cols = buildOwnershipColumns(
      { athleteUserId: 'friend', context: 'friend', permissionStatus: 'friend_granted' },
      'me',
    );
    expect(cols.athlete_user_id).toBe('friend');
    expect(cols.uploaded_by_user_id).toBe('me');
    expect(cols.assigned_by_user_id).toBe('me');
    expect(cols.upload_context).toBe('friend');
  });
  it('records an audit entry tying actor → athlete', () => {
    const entry = buildAuditEntry(
      { athleteUserId: 'friend', context: 'friend', permissionStatus: 'friend_granted' },
      'me',
      { videoAnalysisId: 'v1' },
    );
    expect(entry.action).toBe('upload_for_friend');
    expect(entry.actor_user_id).toBe('me');
    expect(entry.athlete_user_id).toBe('friend');
    expect(entry.video_analysis_id).toBe('v1');
  });
});
