// ============================================================
// SwingVantage — Agent: Ad-Creative — Public API
// ------------------------------------------------------------
// Import from '@/lib/agents/ad-creative'. Self-contained subpath
// barrel (tandem-safe).
// ============================================================

export * from './types';
export {
  generateAdCreatives,
  narrateAdCreatives,
  buildProofLine,
  adUtmUrl,
} from './engine';
export { isAdCopyClean, validateAdRewrite, allowedNumbersFor } from './compliance';
