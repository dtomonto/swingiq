// ============================================================
// Admin data adapters — F4 defense-in-depth authz
// ------------------------------------------------------------
// Proves every service-role (RLS-bypassing) admin adapter re-asserts
// requireAdmin() at the data boundary: a non-admin caller gets an
// "unauthorized" empty result and the service-role client is NEVER even
// constructed; an admin proceeds to the normal (honest) not-connected path.
// next/headers + Supabase are mocked, so this is a pure logic test.
// ============================================================

jest.mock('@/lib/admin/context', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/supabase-admin', () => ({ createSupabaseAdminClient: jest.fn(() => null) }));

import { requireAdmin } from '@/lib/admin/context';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { listAdminUsers, getAdminUser } from '../users';
import { getPlatformMetrics } from '../metrics';
import { listAthletes } from '../athletes';
import { listAnalyses, getAnalysis } from '../analyses';

const mockRequireAdmin = requireAdmin as jest.Mock;
const mockClient = createSupabaseAdminClient as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockClient.mockReturnValue(null);
});

describe('F4 — adapters refuse non-admins before any service-role access', () => {
  beforeEach(() => mockRequireAdmin.mockResolvedValue({ ok: false, email: null, role: 'read_only' }));

  const cases: [string, () => Promise<{ connected: boolean; reason?: string }>][] = [
    ['listAdminUsers', () => listAdminUsers()],
    ['getAdminUser', () => getAdminUser('u1')],
    ['getPlatformMetrics', () => getPlatformMetrics()],
    ['listAthletes', () => listAthletes()],
    ['listAnalyses', () => listAnalyses()],
    ['getAnalysis', () => getAnalysis('a1')],
  ];

  it.each(cases)('%s returns unauthorized + never builds the service-role client', async (_name, run) => {
    const r = await run();
    expect(r.connected).toBe(false);
    expect(r.reason).toMatch(/unauthorized/i);
    expect(mockClient).not.toHaveBeenCalled();
  });
});

describe('F4 — admins pass authz and hit the normal data path', () => {
  beforeEach(() => mockRequireAdmin.mockResolvedValue({ ok: true, email: 'owner@swingvantage.com', role: 'super_admin' }));

  it('listAdminUsers proceeds past authz, then honestly reports not-connected (no service role)', async () => {
    const r = await listAdminUsers();
    expect(mockClient).toHaveBeenCalledTimes(1); // got past the guard
    expect(r.connected).toBe(false);
    expect(r.reason).toMatch(/service role/i); // the not-connected reason, NOT unauthorized
    expect(r.reason).not.toMatch(/unauthorized/i);
  });

  it('getPlatformMetrics proceeds past authz', async () => {
    const r = await getPlatformMetrics();
    expect(mockClient).toHaveBeenCalledTimes(1);
    expect(r.connected).toBe(false);
    expect(r.reason).toMatch(/service role/i);
  });
});
