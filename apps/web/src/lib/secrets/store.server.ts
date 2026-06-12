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
import { isConfigured } from '@/lib/capabilities';
import { encryptSecret, decryptSecret, secretsEncryptionAvailable, type EncryptedSecret } from './crypto.server';
import { findManagedKey } from './registry';

const TABLE = 'app_secrets';
const GLOBAL_KEY = '__app_secrets_mem_store__';
const INJECTED_KEY = '__app_secrets_injected__';

/**
 * Names this process has injected into process.env from the vault, so a key
 * saved from the dashboard activates IMMEDIATELY (server-side capability checks
 * read process.env synchronously) without waiting for a restart. We only ever
 * inject when the host env did NOT already configure the key — host env always
 * wins, mirroring resolveSecret + hydrateSecretsIntoEnv. On delete we revert
 * only what we injected, never a real host env value. Kept on globalThis so it
 * survives module re-evaluation in dev. NEXT_PUBLIC_* values are inlined into
 * the client bundle at build time, so those activate server-side immediately
 * but reach the browser only after a rebuild.
 */
function injected(): Set<string> {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[INJECTED_KEY]) g[INJECTED_KEY] = new Set<string>();
  return g[INJECTED_KEY] as Set<string>;
}

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
  | { ok: false; reason: 'no_encryption' | 'unknown_key' | 'empty' | 'invalid_value' };

/**
 * Encrypt + persist a managed secret. Refuses unknown key names (only the
 * registry's names are writable), values outside a 'select' entry's allowed
 * options, and writes when no master key is configured.
 */
export async function setSecret(name: string, plaintext: string, actorEmail?: string): Promise<SetSecretResult> {
  const key = findManagedKey(name);
  if (!key) return { ok: false, reason: 'unknown_key' };
  const value = (plaintext ?? '').trim();
  if (!value) return { ok: false, reason: 'empty' };
  // Constrained 'select' settings (e.g. a provider) must be one of their options.
  if (key.options && !key.options.includes(value)) return { ok: false, reason: 'invalid_value' };
  const enc = encryptSecret(value);
  if (!enc) return { ok: false, reason: 'no_encryption' };

  const row: SecretRow = { name, enc, actorEmail, updatedAt: new Date().toISOString() };
  const c = admin();
  if (!c) {
    mem().set(name, row);
    activateInProcess(name, value);
    return { ok: true };
  }
  const { error } = await c
    .from(TABLE)
    .upsert({ name, data: enc, actor_email: actorEmail ?? null, updated_at: row.updatedAt }, { onConflict: 'name' });
  if (error) mem().set(name, row); // graceful fallback
  activateInProcess(name, value);
  return { ok: true };
}

/**
 * Make a just-saved vault key live in THIS process immediately, so server-side
 * capability checks (which read process.env synchronously) flip on without a
 * restart. Host env always wins: if the name is already configured in the host
 * environment we leave it untouched (matches resolveSecret's env-first rule).
 */
function activateInProcess(name: string, value: string): void {
  if (isConfigured(process.env[name])) return; // host env wins — never override
  process.env[name] = value;
  injected().add(name);
}

/** Remove a stored secret (reverts the key to its env value, if any). */
export async function deleteSecret(name: string): Promise<void> {
  const c = admin();
  if (!c) {
    mem().delete(name);
    deactivateInProcess(name);
    return;
  }
  const { error } = await c.from(TABLE).delete().eq('name', name);
  if (error) mem().delete(name);
  deactivateInProcess(name);
}

/** Revert only what we injected — never a real host env value. */
function deactivateInProcess(name: string): void {
  if (injected().has(name)) {
    delete process.env[name];
    injected().delete(name);
  }
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

/**
 * True when `name`'s current process.env value was injected from the vault by
 * this process (live save or boot hydration), NOT set as a host env var. Lets
 * status reporting keep showing such keys as "vault" even though they now live
 * in process.env for synchronous capability checks.
 */
export function isInjected(name: string): boolean {
  return injected().has(name);
}

/** Record that `name` was injected into process.env from the vault (used by
 *  boot hydration, which writes process.env directly). */
export function markInjected(name: string): void {
  injected().add(name);
}

/** TEST-ONLY: clear the in-process store. */
export function __resetSecretStore(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g[GLOBAL_KEY];
  delete g[INJECTED_KEY];
}
