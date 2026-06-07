// ============================================================
// SwingVantage — Feature Education Engine: Support generators
// ------------------------------------------------------------
// Deterministic generators for: FAQ, troubleshooting, internal support
// enablement, and in-app help recommendations.
// ============================================================

import { type FeatureRecord, type EducationAsset, type AssetFaq, type InAppHelpSpec } from '../types';
import { PROMPTS } from '../prompts';
import {
  type GenContext,
  baseAsset,
  whereToFind,
  primaryRoute,
  pickAudience,
  sectionsFrom,
} from './helpers';

export function generateFaq(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const where = whereToFind(feature);
  const adminOnly = feature.audiences.includes('admin');
  const faqs: AssetFaq[] = [
    { q: `What is ${feature.name}?`, a: feature.description },
    { q: `Where do I find ${feature.name}?`, a: where },
    {
      q: `How do I use ${feature.name}?`,
      a: 'Open it, take the main action the screen guides you to, and review your saved result. See the tutorial for step-by-step help.',
    },
    {
      q: `Why don’t I see ${feature.name}?`,
      a: adminOnly
        ? 'It’s an admin-only tool. You’ll only see it if your account has admin access.'
        : 'Make sure you’re signed in. Some features appear only after you’ve added your sport or first session.',
    },
    {
      q: 'What permissions do I need?',
      a: feature.permissions.length ? `You need: ${feature.permissions.join(', ')}.` : 'No special permissions are required.',
    },
    {
      q: 'What data does it use?',
      a: 'Your account data and what you provide on the screen. Your data is tied to your private account and synced across devices.',
    },
    {
      q: 'What if it doesn’t work?',
      a: 'See the troubleshooting guide for this feature, or contact support from the in-app help menu.',
    },
    {
      q: 'Can I edit, delete, or export what I create?',
      a: 'Yes — your results live in your account and can be managed from the Data center.',
    },
  ];
  return baseAsset(
    feature,
    'faq',
    'all',
    {
      title: `${feature.name} — FAQ`,
      summary: `Common questions about ${feature.name}.`,
      sections: sectionsFrom(PROMPTS.faq.sections, {
        'Frequently asked questions': faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`),
      }),
      faqs,
    },
    ctx,
  );
}

export function generateTroubleshooting(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const audience = pickAudience(feature, 'returning-user');
  const sections = sectionsFrom(PROMPTS.troubleshooting.sections, {
    'Common issues': [
      'It won’t load → refresh the page; check your connection.',
      'Nothing happens when I take the action → make sure required fields are filled and try again.',
      feature.apiEndpoints.length
        ? `Request failed → the underlying endpoint (${feature.apiEndpoints[0]}) may be rate-limited; wait and retry.`
        : 'It’s slow → large or unusual inputs can take longer; give it a moment.',
      'Result looks off → remember outputs from visual analysis are estimates; re-run with cleaner input.',
    ],
    'Empty & loading states': [
      'A blank screen on first use is normal — add your first input to populate it.',
      'A spinner that lingers usually means a slow network; reload if it stalls.',
    ],
    Permissions: [
      feature.audiences.includes('admin')
        ? 'If you can’t open it, your account may lack admin access.'
        : 'If a control is greyed out, you may need to sign in or finish setup first.',
    ],
    'Still stuck? Escalation': [
      'Use the in-app help menu to contact support with the page URL and what you tried.',
      'Admins: check System Health and the audit log for related errors.',
    ],
  });
  return baseAsset(
    feature,
    'troubleshooting',
    audience,
    {
      title: `${feature.name} — troubleshooting`,
      summary: `Fix common problems with ${feature.name}.`,
      sections,
    },
    ctx,
  );
}

export function generateSupportEnablement(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const risk =
    feature.category === 'security-privacy' || feature.category === 'monetization' || feature.category === 'account-auth'
      ? 'high'
      : feature.needsHumanReview
        ? 'medium'
        : 'low';
  const sections = sectionsFrom(PROMPTS['support-enablement'].sections, {
    'Support summary': [feature.description, whereToFind(feature)],
    'Common questions': [
      `What is ${feature.name}? / Where is it? / How do I use it? / Why can’t I see it?`,
    ],
    'Troubleshooting checklist': [
      '1. Confirm the user is signed in and (if admin-only) has admin access.',
      '2. Confirm setup is complete (sport added / first session logged).',
      '3. Reproduce on the exact route and capture the error.',
      '4. Check System Health for related incidents.',
    ],
    'Escalation path': [
      'Tier 1: in-app help + this enablement doc.',
      'Tier 2: admin reviews audit log + System Health.',
      'Tier 3: engineering, with the route, steps, and any error id.',
    ],
    'Known issues': ['None recorded yet — log new ones in the feedback queue.'],
    'Suggested macros': [
      `"Thanks for reaching out! ${feature.name} lives ${whereToFind(feature).toLowerCase()} Here’s how to use it: <link to tutorial>."`,
    ],
    'Risk & required knowledge': [
      `Risk level: ${risk}.`,
      `Required knowledge: how ${feature.name} works end to end and where its data lives.`,
    ],
  });
  return baseAsset(
    feature,
    'support-enablement',
    'support',
    {
      title: `${feature.name} — support enablement`,
      summary: `Internal support brief for ${feature.name} (risk: ${risk}).`,
      sections,
    },
    ctx,
  );
}

/** Recommend in-app help placements for a feature (spec §9). */
export function recommendInAppHelp(feature: FeatureRecord): InAppHelpSpec {
  const route = feature.adminControls[0] ?? primaryRoute(feature) ?? '/';
  const isNew = feature.category === 'new-feature' || feature.status === 'beta';
  return {
    route,
    placement: isNew ? 'announcement' : 'tooltip',
    headline: isNew ? `New: ${feature.name}` : `About ${feature.name}`,
    body:
      feature.description.length > 120 ? feature.description.slice(0, 117) + '…' : feature.description,
    learnMoreHref: `/help/${feature.slug}`,
  };
}

export function generateInAppHelp(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const spec = recommendInAppHelp(feature);
  const sections = sectionsFrom(PROMPTS['in-app-help'].sections, {
    'Recommended placements': [
      `Primary: ${spec.placement} on ${spec.route}.`,
      'Also consider: an empty-state explainer and a "Learn more" link to the tutorial.',
      feature.category === 'new-feature' ? 'Show a one-time announcement modal on first visit.' : '',
    ].filter(Boolean),
    'Tooltip copy': [`${spec.headline}: ${spec.body}`],
    'Empty-state copy': [
      `Nothing here yet — ${spec.body} Take the first step to get started.`,
    ],
  });
  return baseAsset(
    feature,
    'in-app-help',
    'all',
    {
      title: `${feature.name} — in-app help`,
      summary: `Contextual help recommendations for ${feature.name}.`,
      sections,
      inAppHelp: spec,
    },
    ctx,
  );
}
