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
import { MANAGED_KEYS, type SecretCategory, type KeyControl } from './registry';
import { maskSecret } from './mask';
import { getStoredSecret, listStoredSecretMeta, vaultWritable, isInjected, markInjected } from './store.server';

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
  /** Editor control ('secret' | 'select' | 'text'). */
  control: KeyControl;
  /** Allowed values for a 'select' control. */
  options?: string[];
  /** Current RAW value — populated ONLY for non-secret config (provider/model
   *  selectors, public NEXT_PUBLIC_* values); never for credentials. */
  value?: string;
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
      let raw: string | undefined;
      let updatedAt: string | undefined;

      // A genuine host env value wins and reads as 'env'. A value we injected
      // from the vault lives in process.env too, but must still read as 'vault'
      // (so the dashboard shows it as managed + removable).
      if (isConfigured(envVal) && !isInjected(k.name)) {
        source = 'env';
        raw = envVal!.trim();
        masked = maskSecret(raw);
      } else if (storedMeta.has(k.name)) {
        const plain = await getStoredSecret(k.name);
        if (plain) {
          source = 'vault';
          raw = plain;
          masked = maskSecret(plain);
          updatedAt = storedMeta.get(k.name)!.updatedAt;
        }
      }

      return {
        name: k.name, label: k.label, provider: k.provider, providerLabel: k.providerLabel,
        category: k.category, secret: k.secret, activates: k.activates,
        source, masked,
        control: k.control ?? 'secret',
        options: k.options,
        // Expose the raw value ONLY for non-secret config — never a credential.
        value: k.secret ? undefined : raw,
        updatedAt, placeholder: k.placeholder, docsUrl: k.docsUrl,
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
          if (plain) {
            process.env[meta.name] = plain;
            markInjected(meta.name); // so status still reads it as 'vault', not 'env'
          }
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
