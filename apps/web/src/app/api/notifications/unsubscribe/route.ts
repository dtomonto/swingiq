// POST /api/notifications/unsubscribe — remove a browser push subscription.
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { deletePushSubscription } from '@/lib/notifications/push-subscriptions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let endpoint: string | undefined;
  try {
    endpoint = (await req.json())?.endpoint;
  } catch {
    /* empty */
  }
  if (!endpoint) return NextResponse.json({ error: 'invalid endpoint' }, { status: 400 });

  await deletePushSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
