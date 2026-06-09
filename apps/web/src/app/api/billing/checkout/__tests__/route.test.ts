// ============================================================
// /api/billing/checkout — F13 user-binding authz
// ------------------------------------------------------------
// Proves the checkout route binds the subscription to the authenticated user
// (client_reference_id) and requires sign-in once real checkout is live, while
// preserving the keyless waitlist flow for anonymous callers. Deps mocked.
// ============================================================

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(async () => ({ allowed: true })),
  rateLimitResponse: jest.fn(),
}));
jest.mock('@/lib/supabase-server', () => ({ getAuthenticatedUser: jest.fn() }));
jest.mock('@/lib/capabilities', () => ({ isStripeConfigured: jest.fn() }));
jest.mock('@/lib/billing/stripe', () => ({ createCheckoutSession: jest.fn() }));

import { POST } from '../route';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isStripeConfigured } from '@/lib/capabilities';
import { createCheckoutSession } from '@/lib/billing/stripe';
import type { NextRequest } from 'next/server';

const mockUser = getAuthenticatedUser as jest.Mock;
const mockConfigured = isStripeConfigured as jest.Mock;
const mockCreate = createCheckoutSession as jest.Mock;

function req(body: unknown): NextRequest {
  return {
    headers: { get: (k: string) => (k === 'origin' ? 'https://swingvantage.com' : null) },
    json: async () => body,
    url: 'https://swingvantage.com/api/billing/checkout',
  } as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue({ ok: true, url: 'https://stripe/checkout' });
});

describe('checkout route — F13 user binding', () => {
  it('rejects an invalid tier before doing anything', async () => {
    const res = await POST(req({ tier: 'enterprise' }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('requires sign-in when Stripe is live and the caller is anonymous', async () => {
    mockConfigured.mockReturnValue(true);
    mockUser.mockResolvedValue(null);
    const res = await POST(req({ tier: 'pro' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, reason: 'auth_required' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('binds client_reference_id to the user when authenticated', async () => {
    mockConfigured.mockReturnValue(true);
    mockUser.mockResolvedValue({ id: 'user_123', email: 'a@b.com' });
    const res = await POST(req({ tier: 'pro' }));
    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith('pro', expect.any(String), { userId: 'user_123', email: 'a@b.com' });
  });

  it('keeps the keyless waitlist flow for anonymous callers (Stripe not configured)', async () => {
    mockConfigured.mockReturnValue(false);
    mockUser.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ ok: false, reason: 'not_configured' });
    const res = await POST(req({ tier: 'team' }));
    expect(res.status).toBe(400);
    expect(mockCreate).toHaveBeenCalledWith('team', expect.any(String), { userId: undefined, email: undefined });
  });
});
