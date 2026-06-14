// ============================================================
// WS-05 — friends domain unit tests (pure helpers + authorization)
// Focus on the security-critical decisions: handle validation, privacy
// filtering, accepted-friend checks, and upload-for-friend authorization.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeHandle,
  isValidHandle,
  mergePermissions,
  initialsFrom,
  friendSummaryFromProfile,
  sendRequestByHandle,
} from '../service';
import {
  isAcceptedFriendshipRow,
  rowGrants,
  areAcceptedFriends,
  assertCanUploadForAthlete,
  FriendAuthError,
  type FriendshipRowLike,
} from '../authz';

// Minimal Supabase fake: select→(or|eq)→maybeSingle resolves `row`.
function fakeClient(row: unknown): SupabaseClient {
  const terminal = { maybeSingle: async () => ({ data: row }) };
  const builder = {
    select: () => ({ or: () => terminal, eq: () => terminal }),
  };
  return { from: () => builder } as unknown as SupabaseClient;
}

describe('handle helpers', () => {
  it('normalizes case, whitespace, and a leading @', () => {
    expect(normalizeHandle('  @TigerW ')).toBe('tigerw');
  });
  it('validates format (3–20 lowercase alphanum/underscore)', () => {
    expect(isValidHandle('tiger_w')).toBe(true);
    expect(isValidHandle('ab')).toBe(false);
    expect(isValidHandle('Has Space')).toBe(false);
    expect(isValidHandle('UPPER')).toBe(false);
  });
});

describe('mergePermissions', () => {
  it('starts from safe defaults and applies the patch', () => {
    expect(mergePermissions(null, {})).toEqual({
      view_profile: true,
      view_reports: false,
      allow_upload_for_me: false,
    });
    expect(mergePermissions({ allow_upload_for_me: false }, { allow_upload_for_me: true }).allow_upload_for_me).toBe(true);
  });
});

describe('initialsFrom', () => {
  it('derives initials from name, then handle, then fallback', () => {
    expect(initialsFrom('Tiger Woods', null)).toBe('TW');
    expect(initialsFrom(null, 'rory')).toBe('RO');
    expect(initialsFrom(null, null)).toBe('?');
  });
});

describe('friendSummaryFromProfile privacy filter', () => {
  const row = {
    user_id: 'u2',
    display_name: 'Sam Iron',
    handle: 'sami',
    primary_sport: 'golf',
    skill_level: 'advanced',
    profile_intelligence_summary: { archetype: { label: 'Technician' }, stage: { name: 'Competent' } },
  };
  it('omits private fields when view_profile is NOT granted', () => {
    const s = friendSummaryFromProfile(row, { viewProfileGranted: false });
    expect(s.displayName).toBe('Sam Iron');
    expect(s.handle).toBe('sami');
    expect(s.skillLevel).toBeUndefined();
    expect(s.archetype).toBeUndefined();
  });
  it('includes extended fields when granted', () => {
    const s = friendSummaryFromProfile(row, { viewProfileGranted: true });
    expect(s.skillLevel).toBe('advanced');
    expect(s.archetype).toBe('Technician');
    expect(s.stage).toBe('Competent');
  });
});

describe('accepted-friend checks (pure)', () => {
  const accepted: FriendshipRowLike = {
    requester_user_id: 'a',
    receiver_user_id: 'b',
    status: 'accepted',
    permissions: { view_profile: true, view_reports: false, allow_upload_for_me: true },
  };
  it('isAcceptedFriendshipRow is true only for accepted rows between the pair', () => {
    expect(isAcceptedFriendshipRow(accepted, 'a', 'b')).toBe(true);
    expect(isAcceptedFriendshipRow(accepted, 'b', 'a')).toBe(true);
    expect(isAcceptedFriendshipRow({ ...accepted, status: 'pending' }, 'a', 'b')).toBe(false);
    expect(isAcceptedFriendshipRow(accepted, 'a', 'c')).toBe(false);
    expect(isAcceptedFriendshipRow(null, 'a', 'b')).toBe(false);
  });
  it('rowGrants reflects the permission flag', () => {
    expect(rowGrants(accepted, 'allow_upload_for_me')).toBe(true);
    expect(rowGrants(accepted, 'view_reports')).toBe(false);
  });
});

describe('areAcceptedFriends (DB-backed)', () => {
  it('false when same user, true when an accepted row exists', async () => {
    expect(await areAcceptedFriends(fakeClient(null), 'a', 'a')).toBe(false);
    expect(await areAcceptedFriends(fakeClient(null), 'a', 'b')).toBe(false);
    const ok = fakeClient({ requester_user_id: 'a', receiver_user_id: 'b', status: 'accepted', permissions: {} });
    expect(await areAcceptedFriends(ok, 'a', 'b')).toBe(true);
  });
});

describe('assertCanUploadForAthlete (WS-06 contract)', () => {
  it('allows uploading for yourself', async () => {
    await expect(assertCanUploadForAthlete(fakeClient(null), 'a', 'a')).resolves.toBeUndefined();
  });
  it('rejects when not friends', async () => {
    await expect(assertCanUploadForAthlete(fakeClient(null), 'a', 'b')).rejects.toBeInstanceOf(FriendAuthError);
  });
  it('rejects accepted friends without allow_upload_for_me', async () => {
    const c = fakeClient({ requester_user_id: 'a', receiver_user_id: 'b', status: 'accepted', permissions: { allow_upload_for_me: false } });
    await expect(assertCanUploadForAthlete(c, 'a', 'b')).rejects.toThrow(/not enabled/i);
  });
  it('allows when accepted + permission granted', async () => {
    const c = fakeClient({ requester_user_id: 'a', receiver_user_id: 'b', status: 'accepted', permissions: { allow_upload_for_me: true } });
    await expect(assertCanUploadForAthlete(c, 'a', 'b')).resolves.toBeUndefined();
  });
});

describe('sendRequestByHandle guards', () => {
  it('returns not_found for an invalid handle without touching the DB', async () => {
    const boom = fakeClient(undefined);
    const res = await sendRequestByHandle(boom, boom, 'me', 'no'); // too short
    expect(res.status).toBe('not_found');
  });
  it('returns self when the handle resolves to the actor', async () => {
    const admin = fakeClient({ user_id: 'me' });
    const res = await sendRequestByHandle(fakeClient(null), admin, 'me', 'myhandle');
    expect(res.status).toBe('self');
  });
  it('returns not_found when the handle resolves to nobody', async () => {
    const admin = fakeClient(null);
    const res = await sendRequestByHandle(fakeClient(null), admin, 'me', 'ghosthandle');
    expect(res.status).toBe('not_found');
  });
});
