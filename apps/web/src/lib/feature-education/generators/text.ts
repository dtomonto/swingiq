// ============================================================
// SwingVantage — Feature Education Engine: Text generators
// ------------------------------------------------------------
// Deterministic generators for the long-form written assets:
// tutorial, how-to, manual, onboarding. Each returns a draft
// EducationAsset grounded in the feature's real surfaces.
// ============================================================

import { type FeatureRecord, type EducationAsset, type AssetStep } from '../types';
import { PROMPTS } from '../prompts';
import {
  type GenContext,
  baseAsset,
  whereToFind,
  primaryRoute,
  audienceLabel,
  pickAudience,
  sectionsFrom,
  relatedLines,
} from './helpers';

/** Generic, grounded steps for using a feature (route-aware). */
export function genericSteps(feature: FeatureRecord): AssetStep[] {
  const open = feature.adminControls[0] ?? primaryRoute(feature);
  const steps: AssetStep[] = [];
  if (open) steps.push({ title: `Open ${feature.name}`, detail: `Go to ${open}.` });
  steps.push({
    title: 'See what’s on screen',
    detail: `${feature.name} is where you ${lowerFirst(feature.description)}`,
  });
  steps.push({
    title: 'Take the main action',
    detail: 'Use the primary control to run the feature — the screen guides you through it.',
  });
  steps.push({
    title: 'Review the result',
    detail: 'Read what comes back. Anything based on visual analysis is a smart starting point, not a measurement.',
  });
  steps.push({
    title: 'Save or come back',
    detail: 'Your work is tied to your private account and synced across devices, so you can pick up later.',
  });
  return steps;
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export function generateTutorial(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const audience = pickAudience(feature, 'new-user');
  const steps = genericSteps(feature);
  const sections = sectionsFrom(PROMPTS.tutorial.sections, {
    'What it does': [feature.description],
    'Who it’s for': [`Built for ${feature.audiences.map(audienceLabel).join(', ')}.`],
    'Why it matters': [
      'It turns something you’d otherwise have to figure out into a few clear steps you can act on today.',
    ],
    'When to use it': [whereToFind(feature), 'Use it whenever you want the outcome this feature provides.'],
    'Step by step': steps.map((s, i) => `${i + 1}. ${s.title} — ${s.detail}`),
    'Common mistakes': [
      'Skipping the on-screen guidance and guessing.',
      'Expecting a perfect score on day one — each result is a confident starting point to build on.',
    ],
    'Best practices': [
      'Do one focused thing at a time.',
      'Come back regularly so your progress is comparable over time.',
    ],
    'What you’ll get': ['A clear, saved result you can build on and revisit.'],
    'Related & next': relatedLines(feature),
  });
  return baseAsset(
    feature,
    'tutorial',
    audience,
    {
      title: `How to use ${feature.name}`,
      summary: `A plain-language walkthrough of ${feature.name} for ${audienceLabel(audience)}.`,
      sections,
      steps,
    },
    ctx,
  );
}

export function generateHowTo(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const audience = pickAudience(feature, 'returning-user');
  const goal = `get the most out of ${feature.name}`;
  const steps = genericSteps(feature);
  const sections = sectionsFrom(PROMPTS['how-to'].sections, {
    Goal: [`How to ${goal}.`],
    'Before you start': [
      whereToFind(feature),
      feature.permissions.length
        ? `You’ll need: ${feature.permissions.join(', ')}.`
        : 'No special permissions required.',
    ],
    Steps: steps.map((s, i) => `${i + 1}. ${s.title} — ${s.detail}`),
    'Decision points': [
      'If you’re not sure which option to pick, choose the default — you can change it later.',
    ],
    'Done when': ['You’ve completed the main action and seen your saved result.'],
    'If you get stuck': [
      'Check the troubleshooting guide for this feature.',
      'Still stuck? Contact support from the in-app help menu.',
    ],
  });
  return baseAsset(
    feature,
    'how-to',
    audience,
    {
      title: `How to ${goal}`,
      summary: `Task-based steps to ${goal}.`,
      sections,
      steps,
    },
    ctx,
  );
}

export function generateManual(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const audience = pickAudience(feature, 'power-user');
  const sections = sectionsFrom(PROMPTS.manual.sections, {
    Overview: [feature.description, whereToFind(feature)],
    'Access & permissions': [
      feature.audiences.includes('admin') ? 'Admin-only.' : 'Available to signed-in athletes.',
      feature.permissions.length ? `Permissions: ${feature.permissions.join(', ')}.` : 'No special permissions.',
    ],
    Inputs: inputsFor(feature),
    Outputs: ['A saved result tied to your account.'],
    Settings: feature.featureFlags.length
      ? [`Controlled by feature flag(s): ${feature.featureFlags.join(', ')}.`]
      : ['No dedicated settings; uses sensible defaults.'],
    'Edge cases': ['Empty state on first use until you add data.', 'Large or unusual inputs may take longer.'],
    Limitations: [
      'Outputs based on visual analysis are estimates, not measurements.',
      'Accuracy depends on the quality of what you provide.',
    ],
    'Data dependencies': feature.dbTables.length
      ? [`Reads/writes: ${feature.dbTables.join(', ')}.`]
      : ['Operates on your account data and session inputs.'],
    'Security & privacy': [
      'Data is tied to your private account and synced across devices.',
      'Swing videos are processed privately and are not stored on our servers.',
    ],
    Troubleshooting: ['See the dedicated troubleshooting guide for symptom → fix steps.'],
    'Admin notes': feature.audiences.includes('admin')
      ? ['See the admin guide for setup, monitoring, and escalation.']
      : ['No admin action required for normal use.'],
    'Version history': [
      `Detected ${feature.releaseVersion ? `in ${feature.releaseVersion}` : 'from'} ${feature.detectedFrom.join(', ')}.`,
      `Confidence: ${feature.confidence}/100${feature.needsHumanReview ? ' (needs human review).' : '.'}`,
    ],
  });
  return baseAsset(
    feature,
    'manual',
    audience,
    {
      title: `${feature.name} — manual`,
      summary: `Complete reference for ${feature.name}.`,
      sections,
    },
    ctx,
  );
}

function inputsFor(feature: FeatureRecord): string[] {
  if (feature.apiEndpoints.length) return [`API request to ${feature.apiEndpoints.join(', ')}.`];
  if (feature.category === 'new-feature' || feature.routes.some((r) => r === '/video' || r === '/diagnose'))
    return ['A swing video, photo, or your session data, depending on the screen.'];
  return ['Your selections and session data on the screen.'];
}

export function generateOnboarding(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const audience = pickAudience(feature, 'new-user');
  const open = feature.adminControls[0] ?? primaryRoute(feature);
  const sections = sectionsFrom(PROMPTS.onboarding.sections, {
    Welcome: [`Let’s get you started with ${feature.name}.`],
    'First steps': [open ? `Open ${open}.` : 'Find the feature from the main navigation.', 'Take a quick look around — nothing here is permanent.'],
    'Your first win': ['Complete the one main action. That’s your first result — saved automatically.'],
    'What’s next': relatedLines(feature),
  });
  return baseAsset(
    feature,
    'onboarding',
    audience,
    {
      title: `Get started with ${feature.name}`,
      summary: `A 2-minute first-run walkthrough of ${feature.name}.`,
      sections,
      steps: genericSteps(feature).slice(0, 3),
    },
    ctx,
  );
}
