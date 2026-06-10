// ============================================================
// Keys & Secrets — encrypted durable store (SERVER-ONLY)
// ------------------------------------------------------------
// Persists operator-managed secret values, ENCRYPTED AT REST (AES-256-GCM), so
// keys added from the dashboard take effect immediately without a redeploy.
// Mirrors lib/publishing/store.ts: a Supabase `app_secrets` table when
// configured, else an in-process fallback. Plaintext is only ever held
// transiently in memory during encrypt/decrypt — rows store ciphertext only.
//
// Run apps/web/supabase-secrets.sql once to enable durable persistence.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { encryptSecret, decryptSecret, secretsEncryptionAvailable, type EncryptedSecret } from './crypto.server';
import { isManagedKey } from './registry';

const TABLE = 'app_secrets';
const GLOBAL_KEY = '__app_secrets_mem_store__';

interface SecretRow {
  name: string;
  enc: EncryptedSecret;
  actorEmail?: string;
  updatedAt: string;
}

function mem(): Map<string, SecretRow> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map<string, SecretRow>();
  return g[GLOBAL_KEY] as Map<string, SecretRow>;
}

const admin = () => createSupabaseAdminClient();

export type SetSecretResult =
  | { ok: true }
  | { ok: false; reason: 'no_encryption' | 'unknown_key' | 'empty' };

/**
 * Encrypt + persist a managed secret. Refuses unknown key names (only the
 * registry's names are writable) and refuses when no master key is configured.
 */
export async function setSecret(name: string, plaintext: string, actorEmail?: string): Promise<SetSecretResult> {
  if (!isManagedKey(name)) return { ok: false, reason: 'unknown_key' };
  const value = (plaintext ?? '').trim();
  if (!value) return { ok: false, reason: 'empty' };
  const enc = encryptSecret(value);
  if (!enc) return { ok: false, reason: 'no_encryption' };

  const row: SecretRow = { name, enc, actorEmail, updatedAt: new Date().toISOString() };
  const c = admin();
  if (!c) {
    mem().set(name, row);
    return { ok: true };
  }
  const { error } = await c
    .from(TABLE)
    .upsert({ name, data: enc, actor_email: actorEmail ?? null, updated_at: row.updatedAt }, { onConflict: 'name' });
  if (error) mem().set(name, row); // graceful fallback
  return { ok: true };
}

/** Remove a stored secret (reverts the key to its env value, if any). */
export async function deleteSecret(name: string): Promise<void> {
  const c = admin();
  if (!c) {
    mem().delete(name);
    return;
  }
  const { error } = await c.from(TABLE).delete().eq('name', name);
  if (error) mem().delete(name);
}

async function listRows(): Promise<SecretRow[]> {
  const c = admin();
  if (!c) return Array.from(mem().values());
  try {
    const { data, error } = await c.from(TABLE).select('name, data, actor_email, updated_at');
    if (error || !data) return Array.from(mem().values());
    return (data as Array<{ name: string; data: EncryptedSecret; actor_email: string | null; updated_at: string }>).map(
      (r) => ({ name: r.name, enc: r.data, actorEmail: r.actor_email ?? undefined, updatedAt: r.updated_at }),
    );
  } catch {
    return Array.from(mem().values());
  }
}

export interface StoredSecretMeta {
  name: string;
  actorEmail?: string;
  updatedAt: string;
}

/** Names of all stored secrets (NO values) — for status + the admin queue. */
export async function listStoredSecretMeta(): Promise<StoredSecretMeta[]> {
  return (await listRows()).map(({ name, actorEmail, updatedAt }) => ({ name, actorEmail, updatedAt }));
}

/** Decrypt a single stored secret's plaintext. SERVER-ONLY (used by the
 *  resolver). Null when absent or undecryptable. */
export async function getStoredSecret(name: string): Promise<string | null> {
  const rows = await listRows();
  const row = rows.find((r) => r.name === name);
  if (!row) return null;
  return decryptSecret(row.enc);
}

/** Whether the vault can persist (master key present). */
export function vaultWritable(): boolean {
  return secretsEncryptionAvailable();
}

/** TEST-ONLY: clear the in-process store. */
export function __resetSecretStore(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g[GLOBAL_KEY];
}
