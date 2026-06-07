// ============================================================
// SwingVantage Admin — system & integration status (SERVER-ONLY)
// ------------------------------------------------------------
// Derives an honest picture of what's connected from the existing
// capability detector. NEVER returns secret values — only booleans
// and human-readable detail. Used by the Command Center health card
// and the System Health / Integrations sections.
// ============================================================

import {
  getServerCapabilities, isConfigured, type CapabilitySummary,
} from '@/lib/capabilities';

export type IntegrationCategory =
  | 'Auth & Database' | 'AI' | 'Email' | 'Payments' | 'Monetization' | 'Storage';

export interface IntegrationStatus {
  id: string;
  name: string;
  category: IntegrationCategory;
  connected: boolean;
  /** Honest one-liner about the current state — no secrets. */
  detail: string;
  /** Env var names an operator would set to connect (names only). */
  envVars: string[];
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  const caps = getServerCapabilities();
  const aiProvider = process.env.AI_PROVIDER || process.env.AI_VISION_PROVIDER || '';

  return [
    {
      id: 'supabase', name: 'Supabase (Auth + Database)', category: 'Auth & Database',
      connected: caps.auth,
      detail: caps.auth
        ? 'Connected — real accounts and cloud sync are active.'
        : 'Not connected — the app runs in local device-only mode.',
      envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    },
    {
      id: 'supabase-admin', name: 'Supabase Service Role', category: 'Auth & Database',
      connected: isConfigured(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: isConfigured(process.env.SUPABASE_SERVICE_ROLE_KEY)
        ? 'Configured — cross-user admin reads are available server-side.'
        : 'Not set — user/athlete/media admin views show no cross-user data.',
      envVars: ['SUPABASE_SERVICE_ROLE_KEY'],
    },
    {
      id: 'ai-coach', name: 'AI Coaching', category: 'AI',
      connected: caps.aiCoach,
      detail: caps.aiCoach
        ? `Connected${aiProvider ? ` · ${aiProvider}` : ''} — live coaching responses.`
        : 'Not connected — coaching uses data-grounded templates.',
      envVars: ['AI_PROVIDER', 'OPENAI_API_KEY / ANTHROPIC_API_KEY'],
    },
    {
      id: 'ai-vision', name: 'AI Swing Vision', category: 'AI',
      connected: caps.aiVision,
      detail: caps.aiVision
        ? 'Connected — real AI video/image swing analysis.'
        : 'Not connected — vision analysis is unavailable.',
      envVars: ['AI_VISION_PROVIDER', 'provider API key'],
    },
    {
      id: 'ocr', name: 'OCR / Image Extraction', category: 'AI',
      connected: caps.ocr,
      detail: caps.ocr
        ? 'Connected — launch-monitor photos auto-extract.'
        : 'Not connected — manual review of imported numbers.',
      envVars: ['OCR_PROVIDER', 'provider API key'],
    },
    {
      id: 'email', name: 'Transactional Email', category: 'Email',
      connected: caps.email,
      detail: caps.email
        ? 'Connected — auth and capture emails deliver.'
        : 'Not connected — email capture is stored locally only.',
      envVars: ['RESEND_API_KEY', 'RESEND_AUDIENCE_ID'],
    },
    {
      id: 'billing', name: 'Stripe Billing', category: 'Payments',
      connected: caps.billing,
      detail: caps.billing
        ? 'Connected — live checkout is enabled.'
        : 'Not connected — paid tiers run as a waitlist (per GTM plan).',
      envVars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    },
    {
      id: 'ads', name: 'Ad Network', category: 'Monetization',
      connected: caps.ads,
      detail: caps.ads
        ? 'Connected — paid ads eligible on non-sensitive slots.'
        : 'Not connected — house ads only (clean free experience).',
      envVars: ['NEXT_PUBLIC_ADS_PROVIDER', 'NEXT_PUBLIC_ADS_CLIENT_ID'],
    },
  ];
}

export interface SystemStatus {
  capabilities: CapabilitySummary;
  integrations: IntegrationStatus[];
  connectedCount: number;
  totalCount: number;
  nodeEnv: string;
  generatedAt: string;
}

export function getSystemStatus(): SystemStatus {
  const integrations = getIntegrationStatuses();
  return {
    capabilities: getServerCapabilities(),
    integrations,
    connectedCount: integrations.filter((i) => i.connected).length,
    totalCount: integrations.length,
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    generatedAt: new Date().toISOString(),
  };
}
