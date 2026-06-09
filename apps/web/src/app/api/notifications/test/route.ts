// POST /api/notifications/test — send a test push to the signed-in user's own
// devices, so they can confirm their subscription works. Honest result.
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { sendPushToUser } from '@/lib/notifications/web-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const result = await sendPushToUser(user.id, {
    title: 'SwingVantage',
    body: 'Push is on — practice reminders will arrive here.',
    url: '/dashboard',
    tag: 'test',
  });
  return NextResponse.json(result);
}
