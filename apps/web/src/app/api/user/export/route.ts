// GET /api/user/export
//
// Server-side data export. Reads the authenticated user's rows from the
// relational tables (RLS-scoped to them) and assembles a SwingVantageBackup.
// Returns 503 only when Supabase isn't configured or the schema migration
// hasn't been applied yet — in which case the client-side export in
// Settings → Backup & Restore is the fallback.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';
import { loadAll, fillDefaults, isSchemaMissing } from '@/lib/db/cloudRepo';
import { exportUserData } from '@/lib/backup/export';

export async function GET() {
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

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Supabase client unavailable.' }, { status: 503 });
  }

  try {
    const { state } = await loadAll(client, user.id);
    const backup = exportUserData(fillDefaults(state));
    return NextResponse.json(backup, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="swingvantage-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    if (isSchemaMissing(err)) {
      return NextResponse.json(
        {
          error:
            'Cloud storage is not set up yet (database migration pending). ' +
            'Use the client-side export in Settings → Backup & Restore instead.',
          client_export_url: '/settings/backup',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Failed to export user data.' }, { status: 500 });
  }
}
