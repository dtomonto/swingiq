// ============================================================
// SwingVantage — Feature Education Engine: public surface
// ------------------------------------------------------------
// The whole engine in one import. See docs/FEATURE_EDUCATION_ENGINE.md.
// (Server-only helpers live in ./server and are imported directly by routes.)
// ============================================================

export * from './types';
export * from './detection';
export * from './coverage';
export * from './security';
export * from './quality';
export * from './drift';
export * from './workflow';
export * from './prompts';
export * from './generators';
export {
  getRepo,
  getSnapshot,
  __setInMemoryRepoForTests,
  type FeatureEducationRepo,
} from './repo';
