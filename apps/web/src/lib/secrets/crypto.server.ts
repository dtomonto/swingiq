// ============================================================
// Keys & Secrets — at-rest encryption (SERVER-ONLY)
// ------------------------------------------------------------
// AES-256-GCM authenticated encryption for secret values written to the durable
// store. The 32-byte master key comes from SECRETS_ENCRYPTION_KEY (base64/hex/
// passphrase) and NEVER leaves the server. With no master key set, encryption is
// unavailable and the vault refuses writes (keyless-safe: the dashboard stays in
// read-only detection mode rather than persisting plaintext).
// ============================================================

// (No `server-only` import so this stays unit-testable, matching the publishing
// store convention; node:crypto + the secret env read make it un-bundleable to
// the client anyway, and nothing client-side imports it.)
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const MASTER_ENV = 'SECRETS_ENCRYPTION_KEY';

/** Resolve a 32-byte key from the master env. Accepts a 32-byte base64 or hex
 *  value, or hashes any other passphrase to 32 bytes (sha256). Null when unset. */
function masterKey(): Buffer | null {
  const raw = process.env[MASTER_ENV];
  if (!raw || !raw.trim()) return null;
  const v = raw.trim();
  const b64 = safeBuf(v, 'base64');
  if (b64 && b64.length === 32) return b64;
  const hex = safeBuf(v, 'hex');
  if (hex && hex.length === 32) return hex;
  return createHash('sha256').update(v).digest();
}

function safeBuf(v: string, enc: 'base64' | 'hex'): Buffer | null {
  try {
    const b = Buffer.from(v, enc);
    return b.length > 0 ? b : null;
  } catch {
    return null;
  }
}

/** True when SECRETS_ENCRYPTION_KEY is set — i.e. the vault can read/write. */
export function secretsEncryptionAvailable(): boolean {
  return masterKey() !== null;
}

export interface EncryptedSecret {
  v: 1;
  iv: string; // base64 (12 bytes)
  tag: string; // base64 (16 bytes)
  data: string; // base64 ciphertext
}

/** Encrypt a plaintext secret. Null when no master key is configured. */
export function encryptSecret(plaintext: string): EncryptedSecret | null {
  const key = masterKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    v: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: enc.toString('base64'),
  };
}

/** Decrypt a stored secret. Null on a missing key OR an auth-tag failure
 *  (wrong master key / tampered ciphertext) — never throws. */
export function decryptSecret(enc: EncryptedSecret): string | null {
  const key = masterKey();
  if (!key) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(enc.tag, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(enc.data, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return null;
  }
}

/** Generate a fresh 32-byte master key as base64 — for the operator to paste
 *  into SECRETS_ENCRYPTION_KEY once. Not stored anywhere. */
export function generateMasterKey(): string {
  return randomBytes(32).toString('base64');
}
