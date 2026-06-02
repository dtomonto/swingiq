import { NextResponse } from 'next/server';
import { getServerCapabilities } from '@/lib/capabilities';

export const runtime = 'nodejs';

// Boolean-only summary of which optional integrations are live.
// Lets client UIs render honest "active" vs "coming soon" states
// without ever receiving a secret value.
export async function GET() {
  return NextResponse.json(getServerCapabilities(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
