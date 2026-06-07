// SwingVantage — Video Studio provider layer public surface.
export type {
  VideoProvider,
  ProviderAssetParts,
  ProviderGenerateResult,
  ProviderJobStatus,
} from './types';
export { mockProvider, buildPoster, buildVtt } from './mock-provider';
export {
  getProviderConfigs,
  resolveProvider,
  getProviderById,
  providerSummary,
  globalMaxCostCents,
} from './registry';
