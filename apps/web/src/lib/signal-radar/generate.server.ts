// ============================================================
// SignalRadar OS — server data generator (SERVER-ONLY)
// ------------------------------------------------------------
// Assembles the server-computed half of the SignalRadar page: adapter
// statuses resolved from the real environment (booleans only, never
// secrets) and a clearly-labelled set of demo signals used only to make
// empty states legible. Operator signal data itself lives client-side
// (localStorage) so this works in production's read-only filesystem,
// mirroring securityOS / reliabilityOS.
// ============================================================

import 'server-only';

import { resolveAdapterStatuses, summarizeAdapters, type AdapterHealthSummary } from './adapters';
import { demoSignals } from './sample-data';
import { isSignalIngestEnabled, listIngestedSignals } from './ingest.server';
import type { AdapterStatus, Signal } from './types';

export interface SignalRadarServerData {
  adapters: AdapterStatus[];
  adapterSummary: AdapterHealthSummary;
  sampleSignals: Signal[];
  /** Durable signals fed by the webhook (empty when ingest is keyless/off). */
  ingestedSignals: Signal[];
  ingestEnabled: boolean;
  generatedAt: string;
}

export async function generateSignalRadarData(): Promise<SignalRadarServerData> {
  const now = new Date().toISOString();
  const adapters = resolveAdapterStatuses(process.env as Record<string, string | undefined>);
  const ingestEnabled = isSignalIngestEnabled();
  const ingestedSignals = ingestEnabled ? await listIngestedSignals() : [];
  return {
    adapters,
    adapterSummary: summarizeAdapters(adapters),
    sampleSignals: demoSignals(now),
    ingestedSignals,
    ingestEnabled,
    generatedAt: now,
  };
}
