// ============================================================
// SwingVantage — Blog-to-Social: shared admin guard for API routes
//
// Mirrors app/admin/layout.tsx: require x-admin-secret to match
// ADMIN_SECRET in production; open in development for local iteration.
// One place so every /api/social/* route guards identically.
// ============================================================

import type { NextRequest } from 'next/server';
import { safeEqual } from '@/lib/security/constant-time';

export function isAdminRequest(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return safeEqual(req.headers.get('x-admin-secret'), secret);
}
