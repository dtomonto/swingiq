// GET /api/user/export
//
// Server-side data export endpoint. Returns the authenticated user's data
// in SwingVantageBackup format.
//
// Until Supabase is fully wired up this returns a 503 with instructions to
// use the client-side export in Settings → Backup & Restore instead.
// Once auth is active it will query user-owned rows from Supabase and return
// a server-generated backup.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET() {
  const user = await getAuthenticatedUser();

  // Supabase not yet configured — direct user to client-side export
  if (user === null) {
    const supabaseConfigured =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseConfigured) {
      return NextResponse.json(
        {
          error:
            'Server-side export requires Supabase to be configured. ' +
            'Use the client-side export in Settings → Backup & Restore instead.',
          client_export_url: '/settings/backup',
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // TODO: Query Supabase for user-owned data once tables are populated:
  //
  // const { data: profile } = await supabase
  //   .from('golfer_profiles').select('*').eq('user_id', user.id).single();
  // const { data: sessions } = await supabase
  //   .from('sessions').select('*').eq('user_id', user.id);
  // const { data: clubs } = await supabase
  //   .from('clubs').select('*').eq('user_id', user.id);
  //
  // Then assemble into SwingVantageBackup format and return.

  return NextResponse.json(
    {
      message: 'Server-side export endpoint is ready. Supabase data queries are pending implementation.',
      user_id: user.id,
      client_export_url: '/settings/backup',
    },
    { status: 200 },
  );
}
