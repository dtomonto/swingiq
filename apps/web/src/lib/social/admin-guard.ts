// ============================================================
// SwingVantage — Blog-to-Social: shared admin guard for API routes
//
// Mirrors app/admin/layout.tsx: require x-admin-secret to match
// ADMIN_SECRET in production; open in development for local iteration.
// One place so every /api/social/* route guards identically.
// ============================================================

import type { NextRequest } from 'next/server';
import { safeEqual } from '@/lib/security/constant-time';
import { isAdminUser } from '@/lib/auth/admin';

/** Header-based check (x-admin-secret); open in dev when no secret is set. */
export function isAdminRequest(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return safeEqual(req.headers.get('x-admin-secret'), secret);
}

/** Authorized via the secret header OR a logged-in allowlisted admin user. */
export async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
  if (isAdminRequest(req)) return true;
  return isAdminUser();
}
