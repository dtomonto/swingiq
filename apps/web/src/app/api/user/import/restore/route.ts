// POST /api/user/import/restore
//
// Applies a SwingVantageBackup to the authenticated user's server-side data.
// Supports merge and replace modes.
//
// Body: { backup: SwingVantageBackup, mode: 'merge' | 'replace' }
//
// NOTE: Until Supabase tables are populated this returns a 503 directing
// users to the client-side restore in Settings → Backup & Restore.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { validateBackupFile } from '@/lib/backup/validate';
import type { SwingVantageBackup } from '@/lib/backup/schema';

export const maxDuration = 30; // seconds — restore may take time for large datasets

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseConfigured) {
    return NextResponse.json(
      {
        error:
          'Server-side restore requires Supabase to be configured. ' +
          'Use the client-side restore in Settings → Backup & Restore instead.',
        client_restore_url: '/settings/backup',
      },
      { status: 503 },
    );
  }

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: { backup?: unknown; mode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const mode = body.mode;
  if (mode !== 'merge' && mode !== 'replace') {
    return NextResponse.json(
      { error: 'Invalid mode. Must be "merge" or "replace".' },
      { status: 400 },
    );
  }

  if (!body.backup || typeof body.backup !== 'object') {
    return NextResponse.json({ error: 'Missing backup object in request body.' }, { status: 400 });
  }

  const validation = validateBackupFile(body.backup);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid backup file.', details: validation.errors },
      { status: 422 },
    );
  }

  const backup = body.backup as SwingVantageBackup;

  // TODO: Implement Supabase upsert logic once tables are populated.
  //
  // For merge mode:
  //   await supabase.from('sessions').upsert(
  //     backup.data.sessions.map(s => ({ ...s, user_id: user.id })),
  //     { onConflict: 'id', ignoreDuplicates: true }
  //   );
  //
  // For replace mode:
  //   await supabase.from('sessions').delete().eq('user_id', user.id);
  //   await supabase.from('sessions').insert(
  //     backup.data.sessions.map(s => ({ ...s, user_id: user.id }))
  //   );
  //
  // Do same for clubs, golfer_profiles, shots (via sessions), etc.

  return NextResponse.json(
    {
      message: 'Server-side restore endpoint is ready. Supabase upsert logic is pending implementation.',
      user_id: user.id,
      mode,
      backup_version: backup.backupVersion,
      record_counts: backup.metadata?.recordCounts ?? {},
      client_restore_url: '/settings/backup',
    },
    { status: 200 },
  );
}
