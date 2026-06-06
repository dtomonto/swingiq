// SwingVantage — ReferralOS public surface.
export * from './types';
export {
  REFERRAL_PARAM, REFERRAL_UTM, REWARD_TIERS, K_FACTOR_TARGET,
  ACTIVATION_DEFINITION, SHARE_MESSAGES, SHARE_SUBJECT,
} from './program';
export {
  generateCode, buildInviteUrl, shareMessage, tiersByThreshold,
  computeStats, pendingTierCelebrations,
} from './engine';
export {
  REFERRAL_KEY, PENDING_REFERRAL_KEY,
  recordShare, recordCreditedSignup, markActivated, acknowledgeTiers,
  setSettings, regenerateCode,
  capturePendingReferral, getPendingReferral, clearPendingReferral,
} from './store';
export { useReferral, type UseReferral } from './useReferral';
