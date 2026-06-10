// ============================================================
// GET /api/region — resolve the visitor's consent region from geo headers
// ------------------------------------------------------------
// Used by the client consent system (lib/consent.ts) to pick the default:
// EU/EEA/UK/CH → strict opt-in, everywhere else → default-on with opt-out.
//
// Reads the country from whichever edge/CDN geo header is present (Vercel,
// Cloudflare, common proxies). Returns 'unknown' when no header is available
// (e.g. local dev or a host without geo) — the client then keeps the SAFE
// opt-in default. Aggregate region only; no IP or PII is returned or stored.
// ============================================================

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { regionForCountry } from '@/lib/consent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const country = (
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry') ||
    h.get('x-country-code') ||
    h.get('x-geo-country') ||
    ''
  )
    .trim()
    .toUpperCase();

  const region = regionForCountry(country); // 'eu' | 'other' | null
  return NextResponse.json(
    { region: region ?? 'unknown', country: country || null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
