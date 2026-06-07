// POST /api/user/import/restore
//
// Applies a SwingVantageBackup to the authenticated user's account-side
// (relational) data.
//
//   • merge   — union the backup into the account; existing records are
//               kept, new ones from the backup are added (never destructive).
//   • replace — the backup becomes the account: clear existing rows, then
//               write the backup's records.
//
// Body: { backup: SwingVantageBackup, mode: 'merge' | 'replace' }

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';
import { validateBackupFile } from '@/lib/backup/validate';
import type { SwingVantageBackup } from '@/lib/backup/schema';
import { mergeRestore } from '@/lib/backup/restore';
import {
  loadAll, fillDefaults, reconcile, deleteAllForUser, freshCaches, isSchemaMissing,
} from '@/lib/db/cloud-repo';
import type { SwingVantageState, SportEquipment } from '@/store';
import { DEFAULT_SPORT_EQUIPMENT } from '@/store';

export const maxDuration = 30; // seconds — restore may take time for large datasets

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set(a.map((i) => i.id));
  return [...a, ...b.filter((i) => !seen.has(i.id))];
}

function mergeSportEquipment(a: SportEquipment, b: SportEquipment): SportEquipment {
  return {
    tennis: mergeById(a.tennis, b.tennis),
    baseball: mergeById(a.baseball, b.baseball),
    softball_slow: mergeById(a.softball_slow, b.softball_slow),
    softball_fast: mergeById(a.softball_fast, b.softball_fast),
  };
}

/** Turn a validated backup into a complete store state. */
function backupToState(backup: SwingVantageBackup): SwingVantageState {
  return fillDefaults({
    profile: backup.data.profile,
    sportProfiles: backup.data.sportProfiles,
    clubs: backup.data.clubs,
    sportEquipment: backup.data.sportEquipment ?? DEFAULT_SPORT_EQUIPMENT,
    sessions: backup.data.sessions,
    video_analyses: backup.data.videoAnalyses,
    training: backup.data.training,
    settings: backup.data.settings,
    community: backup.data.community,
    tutorialProgress: backup.data.tutorialProgress,
    agent: backup.data.agentState,
  });
}

export async function POST(req: NextRequest) {
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

  const user = await getAuthenticatedUser();
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
    return NextResponse.json({ error: 'Invalid mode. Must be "merge" or "replace".' }, { status: 400 });
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
  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Supabase client unavailable.' }, { status: 503 });
  }

  try {
    let finalState: SwingVantageState;

    if (mode === 'replace') {
      await deleteAllForUser(client, user.id);
      finalState = backupToState(backup);
    } else {
      // merge: union the backup into whatever the account already holds.
      const { state: current } = await loadAll(client, user.id);
      const currentFull = fillDefaults(current);
      const merged = mergeRestore(backup, currentFull);
      finalState = fillDefaults({
        ...merged,
        sportEquipment: mergeSportEquipment(
          currentFull.sportEquipment,
          backup.data.sportEquipment ?? DEFAULT_SPORT_EQUIPMENT,
        ),
      });
    }

    // Fresh caches → reconcile writes the full resulting state (idempotent upserts).
    await reconcile(client, user.id, finalState, freshCaches());

    return NextResponse.json(
      {
        ok: true,
        mode,
        backup_version: backup.backupVersion,
        record_counts: backup.metadata?.recordCounts ?? {},
      },
      { status: 200 },
    );
  } catch (err) {
    if (isSchemaMissing(err)) {
      return NextResponse.json(
        {
          error:
            'Cloud storage is not set up yet (database migration pending). ' +
            'Use the client-side restore in Settings → Backup & Restore instead.',
          client_restore_url: '/settings/backup',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Failed to restore user data.' }, { status: 500 });
  }
}
