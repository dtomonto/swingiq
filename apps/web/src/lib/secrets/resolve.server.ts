// ============================================================
// Keys & Secrets — resolution + status (SERVER-ONLY)
// ------------------------------------------------------------
// The read side. `resolveSecret` is env-first, then the encrypted vault, so a
// key set in the host (Vercel) always wins and a key added from the dashboard
// activates immediately. `getSecretStatus` powers the admin dashboard with
// MASKED previews only — never raw values. `hydrateSecretsIntoEnv` loads vault
// secrets into process.env so the existing sync capability checks see them too.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import { MANAGED_KEYS, type SecretCategory } from './registry';
import { maskSecret } from './mask';
import { getStoredSecret, listStoredSecretMeta, vaultWritable } from './store.server';

export type SecretSource = 'env' | 'vault' | 'none';

/** Resolve a managed secret: a real env value wins, else the encrypted vault. */
export async function resolveSecret(name: string): Promise<string | undefined> {
  const fromEnv = process.env[name];
  if (isConfigured(fromEnv)) return fromEnv!.trim();
  const fromVault = await getStoredSecret(name);
  return fromVault ?? undefined;
}

export interface SecretStatus {
  name: string;
  label: string;
  provider: string;
  providerLabel: string;
  category: SecretCategory;
  secret: boolean;
  activates: string;
  source: SecretSource;
  /** Masked preview — safe for the browser. Empty when unset. */
  masked: string;
  updatedAt?: string;
  placeholder?: string;
  docsUrl?: string;
}

/**
 * Per-key status for the dashboard. Reads env + vault and returns ONLY masked
 * previews. `source` tells the operator where each live value comes from.
 */
export async function getSecretStatus(): Promise<SecretStatus[]> {
  const storedMeta = new Map((await listStoredSecretMeta()).map((m) => [m.name, m]));

  return Promise.all(
    MANAGED_KEYS.map(async (k): Promise<SecretStatus> => {
      const envVal = process.env[k.name];
      let source: SecretSource = 'none';
      let masked = '';
      let updatedAt: string | undefined;

      if (isConfigured(envVal)) {
        source = 'env';
        masked = maskSecret(envVal!.trim());
      } else if (storedMeta.has(k.name)) {
        const plain = await getStoredSecret(k.name);
        if (plain) {
          source = 'vault';
          masked = maskSecret(plain);
          updatedAt = storedMeta.get(k.name)!.updatedAt;
        }
      }

      return {
        name: k.name, label: k.label, provider: k.provider, providerLabel: k.providerLabel,
        category: k.category, secret: k.secret, activates: k.activates,
        source, masked, updatedAt, placeholder: k.placeholder, docsUrl: k.docsUrl,
      };
    }),
  );
}

let hydrated: Promise<void> | null = null;

/**
 * Load vault secrets into process.env (only names NOT already set in env), so
 * the existing sync `process.env`-based capability checks pick up dashboard-added
 * keys. Best-effort + cached per server instance; never throws.
 */
export function hydrateSecretsIntoEnv(): Promise<void> {
  if (!hydrated) {
    hydrated = (async () => {
      if (!vaultWritable()) return;
      try {
        for (const meta of await listStoredSecretMeta()) {
          if (isConfigured(process.env[meta.name])) continue; // env wins
          const plain = await getStoredSecret(meta.name);
          if (plain) process.env[meta.name] = plain;
        }
      } catch {
        /* best-effort */
      }
    })();
  }
  return hydrated;
}

/** TEST-ONLY: drop the hydration cache. */
export function __resetHydration(): void {
  hydrated = null;
}
