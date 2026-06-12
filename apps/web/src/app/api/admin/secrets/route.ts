// ============================================================
// /api/admin/secrets — manage runtime keys (ADMIN-ONLY)
// ------------------------------------------------------------
// GET    → per-key status (source + MASKED preview only)
// POST   → set/replace a managed key's value (encrypted at rest)
// DELETE → remove a stored key (reverts to its env value, if any)
//
// SECURITY: every method requires `security.manage`. Raw secret values are
// accepted on POST but NEVER returned — responses carry masked previews only.
// Only names in the managed registry are writable. Responses are no-store.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkSecretsAccess } from '@/lib/secrets/access.server';
import { getSecretStatus } from '@/lib/secrets/resolve.server';
import { setSecret, deleteSecret, vaultWritable } from '@/lib/secrets/store.server';
import { isManagedKey } from '@/lib/secrets/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET() {
  const { ok } = await checkSecretsAccess();
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });
  const status = await getSecretStatus();
  return NextResponse.json({ status, vaultWritable: vaultWritable() }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const { ok, ctx } = await checkSecretsAccess();
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });

  let body: { name?: unknown; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400, headers: NO_STORE });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const value = typeof body.value === 'string' ? body.value : '';
  if (!isManagedKey(name)) {
    return NextResponse.json({ error: 'Unknown key.' }, { status: 400, headers: NO_STORE });
  }

  const result = await setSecret(name, value, ctx.email ?? undefined);
  if (!result.ok) {
    const message =
      result.reason === 'no_encryption'
        ? 'Vault is locked — set SECRETS_ENCRYPTION_KEY to store keys here.'
        : result.reason === 'empty'
          ? 'Value cannot be empty.'
          : result.reason === 'invalid_value'
            ? 'Value is not an allowed option for this setting.'
            : 'Unknown key.';
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE });
  }

  // Return the refreshed (masked) status for this key — never the raw value.
  const status = (await getSecretStatus()).find((s) => s.name === name);
  return NextResponse.json({ ok: true, status }, { headers: NO_STORE });
}

export async function DELETE(req: NextRequest) {
  const { ok } = await checkSecretsAccess();
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });
  const name = new URL(req.url).searchParams.get('name')?.trim() ?? '';
  if (!isManagedKey(name)) {
    return NextResponse.json({ error: 'Unknown key.' }, { status: 400, headers: NO_STORE });
  }
  await deleteSecret(name);
  const status = (await getSecretStatus()).find((s) => s.name === name);
  return NextResponse.json({ ok: true, status }, { headers: NO_STORE });
}
