// AI Visual Analysis module — public API
//
// Real AI vision analysis of uploaded swing frames: schema + validation,
// sport-specific prompts, and a provider abstraction (Anthropic / OpenAI /
// Google Gemini) with a strict "not configured" fallback that never
// fabricates results.
export * from './schema';
export * from './prompts';
export * from './provider';
