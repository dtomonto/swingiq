// POST /api/user/import/preview
//
// Validates an uploaded SwingIQBackup and returns a restore preview —
// counts of new, duplicate, and conflicting records — without applying anything.
//
// Body: { backup: SwingIQBackup }  (max 10 MB)

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { validateBackupFile } from '@/lib/backup/validate';
import type { SwingIQBackup } from '@/lib/backup/schema';

export const maxDuration = 10; // seconds

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseConfigured && !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: { backup?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
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

  const backup = body.backup as SwingIQBackup;

  // Build a server-side preview summary
  // Full duplicate detection requires querying the user's Supabase data.
  // Until then, return counts from the backup itself.
  const preview = {
    valid: true,
    backup_version: backup.backupVersion,
    created_at: backup.createdAt,
    record_counts: backup.metadata?.recordCounts ?? {
      sessions: backup.data?.sessions?.length ?? 0,
      clubs: backup.data?.clubs?.length ?? 0,
      videoAnalyses: backup.data?.videoAnalyses?.length ?? 0,
    },
    sports_included: backup.metadata?.sportsIncluded ?? [],
    warnings: validation.warnings,
    note: supabaseConfigured
      ? 'Duplicate detection requires Supabase queries — pending implementation.'
      : 'Using client-side restore. Server-side duplicate detection available once Supabase is connected.',
  };

  return NextResponse.json({ preview }, { status: 200 });
}
