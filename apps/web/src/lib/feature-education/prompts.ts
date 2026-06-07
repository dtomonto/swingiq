// ============================================================
// SwingVantage — Feature Education Engine: Prompt Library
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Modular, versioned templates (spec §24). Each asset type has:
//     - the ordered section headings the DETERMINISTIC generator fills
//       (so "edit the template → change the doc structure"), and
//     - a `system` instruction + `guidance` that an OPTIONAL LLM enhancer
//       uses to re-word the deterministic draft for polish.
//
//   Generators import `PROMPTS[type].sections` so the structure is defined
//   in exactly one place and is editable here. Bumping `PROMPTS_VERSION`
//   lets the drift engine know content was generated against an older
//   template.
// ============================================================

import type { AssetType, FeatureAudience } from './types';

export const PROMPTS_VERSION = '1.0.0';

export interface PromptTemplate {
  type: AssetType;
  version: number;
  audienceDefault: FeatureAudience;
  /** Ordered section headings the deterministic generator fills. */
  sections: string[];
  /** Instruction an LLM enhancer must honor (preserves meaning + brand). */
  system: string;
  /** Human guidance — also shown in the admin "prompts" view. */
  guidance: string;
}

/** Shared brand contract every enhancer prompt inherits. */
export const BRAND_CONTRACT =
  'Voice: warm, confident, plain-spoken coach; ~7th-grade reading level; ' +
  'action-oriented. Never guarantee results/scores, never make medical claims, ' +
  'never say data "never leaves your device" (it is account-synced). Frame visual ' +
  'analysis as an estimate / smart starting point. Ground every statement in the ' +
  'provided feature facts — do not invent screens, settings, or endpoints.';

export const PROMPTS: Record<AssetType, PromptTemplate> = {
  tutorial: {
    type: 'tutorial',
    version: 1,
    audienceDefault: 'new-user',
    sections: [
      'What it does',
      'Who it’s for',
      'Why it matters',
      'When to use it',
      'Step by step',
      'Common mistakes',
      'Best practices',
      'What you’ll get',
      'Related & next',
    ],
    system: `Write a plain-language user tutorial. ${BRAND_CONTRACT}`,
    guidance: 'Beginner-friendly walkthrough a brand-new user can follow end to end.',
  },
  manual: {
    type: 'manual',
    version: 1,
    audienceDefault: 'power-user',
    sections: [
      'Overview',
      'Access & permissions',
      'Inputs',
      'Outputs',
      'Settings',
      'Edge cases',
      'Limitations',
      'Data dependencies',
      'Security & privacy',
      'Troubleshooting',
      'Admin notes',
      'Version history',
    ],
    system: `Write a precise, formal product-manual entry. ${BRAND_CONTRACT}`,
    guidance: 'Complete reference. Accurate over friendly; still readable.',
  },
  'how-to': {
    type: 'how-to',
    version: 1,
    audienceDefault: 'returning-user',
    sections: ['Goal', 'Before you start', 'Steps', 'Decision points', 'Done when', 'If you get stuck'],
    system: `Write a task-based how-to ("How to accomplish X"). ${BRAND_CONTRACT}`,
    guidance: 'One concrete goal, achieved in numbered steps.',
  },
  'admin-guide': {
    type: 'admin-guide',
    version: 1,
    audienceDefault: 'admin',
    sections: [
      'Setup',
      'Permissions & roles',
      'Configuration',
      'Monitoring',
      'Data management',
      'Audit log',
      'Support escalation',
      'Failure states',
      'Operational risks',
    ],
    system: `Write an operator/admin guide. Technically accurate. ${BRAND_CONTRACT}`,
    guidance: 'For an admin setting up and running the feature safely.',
  },
  faq: {
    type: 'faq',
    version: 1,
    audienceDefault: 'all',
    sections: ['Frequently asked questions'],
    system: `Write likely user questions with concise, accurate answers. ${BRAND_CONTRACT}`,
    guidance: 'Anticipate real "what / where / why can’t I / can I…" questions.',
  },
  troubleshooting: {
    type: 'troubleshooting',
    version: 1,
    audienceDefault: 'returning-user',
    sections: ['Common issues', 'Empty & loading states', 'Permissions', 'Still stuck? Escalation'],
    system: `Write a troubleshooting guide: symptom → cause → fix. ${BRAND_CONTRACT}`,
    guidance: 'Map real failure modes to plain fixes; end with an escalation path.',
  },
  onboarding: {
    type: 'onboarding',
    version: 1,
    audienceDefault: 'new-user',
    sections: ['Welcome', 'First steps', 'Your first win', 'What’s next'],
    system: `Write a short first-run onboarding walkthrough. ${BRAND_CONTRACT}`,
    guidance: 'Get a new user to a first success fast; encouraging tone.',
  },
  'in-app-help': {
    type: 'in-app-help',
    version: 1,
    audienceDefault: 'all',
    sections: ['Recommended placements', 'Tooltip copy', 'Empty-state copy'],
    system: `Write short in-app helper microcopy + placement recommendations. ${BRAND_CONTRACT}`,
    guidance: 'Tiny, contextual nudges so users never meet a feature unguided.',
  },
  'video-brief': {
    type: 'video-brief',
    version: 1,
    audienceDefault: 'all',
    sections: ['Objective', 'Script', 'Storyboard', 'Captions & accessibility', 'SEO & thumbnail'],
    system: `Write a short product video script + storyboard. ${BRAND_CONTRACT}`,
    guidance: 'A tight, captioned screen-capture walkthrough; built via Video Studio.',
  },
  'release-note': {
    type: 'release-note',
    version: 1,
    audienceDefault: 'all',
    sections: [
      'What changed',
      'Why it matters',
      'Who it affects',
      'How to use it',
      'Where to find it',
      'Known limitations',
      'Admin actions',
    ],
    system: `Write a polished product release note. ${BRAND_CONTRACT}`,
    guidance: 'Announce the change in confident product voice; link to learning.',
  },
  'support-enablement': {
    type: 'support-enablement',
    version: 1,
    audienceDefault: 'support',
    sections: [
      'Support summary',
      'Common questions',
      'Troubleshooting checklist',
      'Escalation path',
      'Known issues',
      'Suggested macros',
      'Risk & required knowledge',
    ],
    system: `Write internal support enablement notes. Candid and practical. ${BRAND_CONTRACT}`,
    guidance: 'Arm a support agent to resolve tickets about this feature fast.',
  },
  'seo-article': {
    type: 'seo-article',
    version: 1,
    audienceDefault: 'all',
    sections: ['Answer (summary)', 'What it is', 'How to do it', 'FAQ', 'Related'],
    system: `Write a public, SEO/AEO/GEO-optimized help article. ${BRAND_CONTRACT}`,
    guidance: 'Public help page: direct answer first, then steps; schema-ready.',
  },
  'course-module': {
    type: 'course-module',
    version: 1,
    audienceDefault: 'admin',
    sections: ['Learning objective', 'Lesson', 'Knowledge check', 'Completion criteria'],
    system: `Write an internal academy lesson module. ${BRAND_CONTRACT}`,
    guidance: 'Convert the feature into a staff academy lesson with a quiz.',
  },
};
