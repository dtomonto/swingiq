// ============================================================
// SwingVantage — BodySync: provider connector framework
//
// An extensible registry of health-data providers. Each entry encodes the
// REALISTIC web-first integration path (Apple Health has no browser API, so it
// routes through a companion app / Health export / Shortcuts; wearables route
// through server-side OAuth). New providers drop in here without touching the
// scoring, coaching, or UI code.
//
// Keyless-first (like the rest of SwingVantage): every real device shows as
// "coming soon" until its credentials/app exist. Manual entry works today.
// ============================================================

import type {
  ProviderDescriptor, HealthProviderId, HealthMetricSample, IntegrationMethod,
} from '../types';

/**
 * The contract a real provider adapter implements in Phase 2/3. It only ever
 * normalizes vendor payloads into our shared HealthMetricSample shape — the
 * engines never learn a vendor's format.
 */
export interface HealthProviderAdapter {
  id: HealthProviderId;
  descriptor: ProviderDescriptor;
  /** True when server-side credentials for this provider are configured. */
  isConfigured(): boolean;
  /** OAuth providers: the consent URL to start a connection (server builds it). */
  getAuthUrl?(redirectUri: string, state: string): string | null;
  /** Normalize a raw provider payload into our vendor-neutral samples. */
  normalize(raw: unknown): HealthMetricSample[];
}

export const PROVIDER_CATALOG: ProviderDescriptor[] = [
  {
    id: 'manual', name: 'Manual Check-in', method: 'manual', status: 'manual',
    categories: ['wellness'], requiresCredentials: false, icon: '✍️',
    howItConnects: 'You log how you feel each day — works right now, no device required.',
  },
  {
    id: 'apple_health', name: 'Apple Health', method: 'file_import', status: 'coming_soon',
    categories: ['recovery', 'activity', 'cardio', 'mobility'], requiresCredentials: false, icon: '🍎',
    howItConnects:
      'Apple Health has no web connection. Import your Health export, or use the upcoming ' +
      'SwingVantage iOS companion / Shortcuts sync — never direct browser access.',
  },
  {
    id: 'apple_watch', name: 'Apple Watch', method: 'companion_app', status: 'coming_soon',
    categories: ['recovery', 'activity', 'cardio'], requiresCredentials: false, icon: '⌚',
    howItConnects: 'Apple Watch data flows through Apple Health — connect via Health export or the iOS companion.',
  },
  {
    id: 'google_fit', name: 'Google Fit', method: 'oauth', status: 'coming_soon',
    categories: ['activity', 'cardio'], requiresCredentials: true, icon: '🟢',
    howItConnects: 'Connect with a secure Google sign-in (Fitness REST API) — server-side, no password shared.',
  },
  {
    id: 'health_connect', name: 'Android Health Connect', method: 'health_connect', status: 'coming_soon',
    categories: ['recovery', 'activity', 'cardio', 'mobility'], requiresCredentials: true, icon: '🤖',
    howItConnects: 'Health Connect aggregates your Android wearables — connect via the upcoming Android companion.',
  },
  {
    id: 'garmin', name: 'Garmin', method: 'oauth', status: 'coming_soon',
    categories: ['recovery', 'activity', 'cardio'], requiresCredentials: true, icon: '🔷',
    howItConnects: 'Connect with a secure Garmin sign-in (Garmin Health API).',
  },
  {
    id: 'whoop', name: 'WHOOP', method: 'oauth', status: 'coming_soon',
    categories: ['recovery', 'cardio', 'activity'], requiresCredentials: true, icon: '🟥',
    howItConnects: 'Connect with a secure WHOOP sign-in (WHOOP API) for recovery, strain & sleep.',
  },
  {
    id: 'oura', name: 'Oura Ring', method: 'oauth', status: 'coming_soon',
    categories: ['recovery', 'cardio'], requiresCredentials: true, icon: '💍',
    howItConnects: 'Connect with a secure Oura sign-in (Oura API v2) for sleep, readiness & HRV.',
  },
  {
    id: 'fitbit', name: 'Fitbit', method: 'oauth', status: 'coming_soon',
    categories: ['recovery', 'activity', 'cardio'], requiresCredentials: true, icon: '🟦',
    howItConnects: 'Connect with a secure Fitbit sign-in (Fitbit Web API).',
  },
  {
    id: 'polar', name: 'Polar', method: 'oauth', status: 'coming_soon',
    categories: ['activity', 'cardio'], requiresCredentials: true, icon: '🅿️',
    howItConnects: 'Connect with a secure Polar sign-in (Polar AccessLink).',
  },
  {
    id: 'samsung_health', name: 'Samsung Health', method: 'companion_app', status: 'coming_soon',
    categories: ['recovery', 'activity', 'cardio'], requiresCredentials: true, icon: '🟪',
    howItConnects: 'Samsung Health connects through Android Health Connect / the upcoming companion app.',
  },
];

export function getProvider(id: HealthProviderId): ProviderDescriptor | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id);
}

/** Providers that, today, a user can actually act on (manual entry). */
export function activeProviders(): ProviderDescriptor[] {
  return PROVIDER_CATALOG.filter((p) => p.status === 'manual' || p.status === 'connected');
}

export function providersByMethod(method: IntegrationMethod): ProviderDescriptor[] {
  return PROVIDER_CATALOG.filter((p) => p.method === method);
}

// ── The one working adapter in Phase 1: manual entry. ────────
export const manualAdapter: HealthProviderAdapter = {
  id: 'manual',
  descriptor: getProvider('manual')!,
  isConfigured: () => true,
  normalize: () => [], // manual check-ins are first-class (not metric samples)
};

const ADAPTERS = new Map<HealthProviderId, HealthProviderAdapter>([['manual', manualAdapter]]);

/** Register a real provider adapter (Phase 2/3) without touching the core. */
export function registerAdapter(adapter: HealthProviderAdapter): void {
  ADAPTERS.set(adapter.id, adapter);
}
export function getAdapter(id: HealthProviderId): HealthProviderAdapter | undefined {
  return ADAPTERS.get(id);
}
