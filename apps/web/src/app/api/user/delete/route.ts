// POST /api/user/delete
//
// Self-serve account + data deletion (GDPR/CCPA "right to erasure"). Deletes the
// authenticated user's Supabase auth account, which CASCADES to every owned row
// — every `public` user table references `auth.users(id) ON DELETE CASCADE`
// (see server/supabase_schema.sql), so removing the auth user removes all of
// their data in one atomic step. Best-effort also clears their storage folder.
//
// Keyless-first: when Supabase isn't configured there is no server-side account
// to delete — all data already lives only in the browser — so this returns 503
// and the client falls back to the local wipe (Data Center → Clear Data, which
// runs wipeAllDeviceData()). The two together give a complete erasure path in
// every mode.
//
// Security: authenticates the CALLER's own session first (getAuthenticatedUser),
// then uses the service-role admin client to delete ONLY that user's id. A user
// can never delete anyone else's account — there is no id parameter.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const STORAGE_BUCKETS = ['swing-videos'];

export async function POST() {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No cloud account exists in keyless/local mode — nothing to delete server-side.
  if (!supabaseConfigured) {
    return NextResponse.json(
      {
        error:
          'No cloud account to delete — your data lives only in this browser. ' +
          'Use Data Center → Clear Data to erase it from this device.',
        local_clear_url: '/data',
        mode: 'local-only',
      },
      { status: 503 },
    );
  }

  // The caller must be signed in; we only ever delete THEIR own id.
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    // Supabase is configured for the browser, but the server has no service-role
    // key, so we cannot perform a privileged delete. Surface honestly.
    return NextResponse.json(
      {
        error:
          'Account deletion is unavailable: the server is missing SUPABASE_SERVICE_ROLE_KEY. ' +
          'Your local data can still be cleared from Data Center → Clear Data.',
        mode: 'no-service-role',
      },
      { status: 503 },
    );
  }

  // Best-effort: remove the user's storage folder(s). Non-fatal — a storage
  // hiccup must not block the account/row deletion that follows.
  for (const bucket of STORAGE_BUCKETS) {
    try {
      const { data: files } = await admin.storage.from(bucket).list(user.id);
      if (files && files.length > 0) {
        await admin.storage
          .from(bucket)
          .remove(files.map((f) => `${user.id}/${f.name}`));
      }
    } catch {
      /* ignore — proceed to the authoritative auth-user delete (rows cascade) */
    }
  }

  // Authoritative delete: removing the auth user cascades to all owned rows.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: 'Account deletion failed. Please try again or contact privacy@swingvantage.com.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
