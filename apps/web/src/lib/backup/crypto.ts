/**
 * SwingIQ Backup Encryption
 *
 * Uses the browser Web Crypto API (window.crypto.subtle) — no external dependencies.
 * AES-256-GCM with PBKDF2 key derivation (OWASP 2023 recommended iterations).
 */

import type { SwingIQBackup } from './schema';

const MARKER = 'swingiq_encrypted';
const VERSION = 1;
const ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

interface EncryptedBlob {
  swingiq_encrypted: true;
  v: number;
  salt: string;
  iv: string;
  data: string;
}

function toBase64(buf: ArrayBuffer | ArrayBufferLike): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts a SwingIQBackup with a password using AES-256-GCM.
 * Returns a base64-encoded JSON blob string.
 */
export async function encryptBackup(
  backup: SwingIQBackup,
  password: string,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);

  const plaintext = enc.encode(JSON.stringify(backup));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  );

  const blob: EncryptedBlob = {
    swingiq_encrypted: true,
    v: VERSION,
    salt: toBase64(salt.buffer as ArrayBuffer),
    iv: toBase64(iv.buffer as ArrayBuffer),
    data: toBase64(ciphertext),
  };

  return btoa(JSON.stringify(blob));
}

/**
 * Decrypts an encrypted blob string back to a SwingIQBackup.
 * Throws if the password is wrong or the data is corrupted.
 */
export async function decryptBackup(
  encryptedBlob: string,
  password: string,
): Promise<SwingIQBackup> {
  let blob: EncryptedBlob;
  try {
    blob = JSON.parse(atob(encryptedBlob)) as EncryptedBlob;
  } catch {
    throw new Error('Incorrect password or corrupted backup.');
  }

  if (!blob || blob[MARKER as keyof EncryptedBlob] !== true) {
    throw new Error('Incorrect password or corrupted backup.');
  }

  try {
    const salt = fromBase64(blob.salt);
    const iv = fromBase64(blob.iv);
    const ciphertext = fromBase64(blob.data);
    const key = await deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      key,
      ciphertext as unknown as ArrayBuffer,
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plaintext)) as SwingIQBackup;
  } catch {
    throw new Error('Incorrect password or corrupted backup.');
  }
}

/**
 * Returns true if the string is an encrypted SwingIQ backup blob.
 */
export function isEncryptedBackup(content: string): boolean {
  try {
    const parsed = JSON.parse(atob(content));
    return parsed && parsed.swingiq_encrypted === true;
  } catch {
    return false;
  }
}
