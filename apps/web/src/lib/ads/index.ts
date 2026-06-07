// SwingVantage — AdsOS public surface.
export * from './types';
export { AD_PLACEMENTS, getPlacement } from './placements';
export { HOUSE_ADS } from './house-ads';
export { decideAd, pickHouseAd, daySeed } from './engine';
export { ADS_KEY, read, subscribe, dismissHouse } from './store';
export { useAds, type UseAds } from './useAds';
