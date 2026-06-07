// ============================================================
// SwingVantage — Feature Education Engine: Admin generators
// ------------------------------------------------------------
// Deterministic generators for: admin guide (operations) and the internal
// academy course module. Both are gated by the orchestrator to admin /
// internal features.
// ============================================================

import { type FeatureRecord, type EducationAsset, type AssetFaq } from '../types';
import { PROMPTS } from '../prompts';
import { type GenContext, baseAsset, whereToFind, sectionsFrom } from './helpers';

export function generateAdminGuide(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const sections = sectionsFrom(PROMPTS['admin-guide'].sections, {
    Setup: [whereToFind(feature), 'No special setup is required beyond admin access.'],
    'Permissions & roles': [
      feature.permissions.length
        ? `Required permission(s): ${feature.permissions.join(', ')}.`
        : 'Any admin role can access this; scope with RBAC if needed.',
    ],
    Configuration: feature.featureFlags.length
      ? [`Toggle via feature flag(s): ${feature.featureFlags.join(', ')} in Feature Flags.`]
      : ['No dedicated configuration; uses platform defaults.'],
    Monitoring: [
      'Watch usage in Analytics and errors in System Health.',
      'Spot-check outputs for quality before relying on them.',
    ],
    'Data management': feature.dbTables.length
      ? [`Backed by: ${feature.dbTables.join(', ')}. Handle exports/deletions via the Data/Legal tools.`]
      : ['Operates on existing account data; no dedicated store to manage.'],
    'Audit log': ['Admin actions here are recorded in the audit log; review it after changes.'],
    'Support escalation': [
      'Tier 1: support enablement doc. Tier 2: admin review. Tier 3: engineering with route + error id.',
    ],
    'Failure states': [
      'If the feature errors, it should degrade safely (honest empty/error state) rather than block the page.',
    ],
    'Operational risks': [
      feature.category === 'monetization' || feature.category === 'security-privacy'
        ? 'Higher-sensitivity area — change carefully and review before enabling broadly.'
        : 'Low operational risk for normal use.',
    ],
  });
  return baseAsset(
    feature,
    'admin-guide',
    'admin',
    {
      title: `${feature.name} — admin guide`,
      summary: `Operate ${feature.name}: setup, permissions, monitoring, escalation.`,
      sections,
    },
    ctx,
  );
}

export function generateCourseModule(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const knowledgeCheck: AssetFaq[] = [
    {
      q: `Where does ${feature.name} live in the product?`,
      a: whereToFind(feature),
    },
    {
      q: `Who is ${feature.name} for?`,
      a: feature.audiences.join(', ') + '.',
    },
    {
      q: 'What is the one thing to remember when supporting it?',
      a: 'Outputs from visual analysis are estimates — confident starting points, not certainties.',
    },
  ];
  const sections = sectionsFrom(PROMPTS['course-module'].sections, {
    'Learning objective': [`By the end, you can explain and operate ${feature.name} confidently.`],
    Lesson: [
      feature.description,
      whereToFind(feature),
      'Walk through the main action once yourself before supporting others.',
    ],
    'Knowledge check': knowledgeCheck.map((k) => `Q: ${k.q}\nA: ${k.a}`),
    'Completion criteria': ['Pass the knowledge check and complete the main action once.'],
  });
  return baseAsset(
    feature,
    'course-module',
    'admin',
    {
      title: `${feature.name} — academy module`,
      summary: `Staff academy lesson for ${feature.name}.`,
      sections,
      faqs: knowledgeCheck,
    },
    ctx,
  );
}
