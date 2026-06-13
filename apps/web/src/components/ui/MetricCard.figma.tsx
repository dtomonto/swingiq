import figma from '@figma/code-connect';

import { MetricCard } from './MetricCard';

/**
 * Code Connect: Figma "Metric Card" → code <MetricCard>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   Label (text)                                  → label
 *   Value (text)                                  → value
 *   Unit (text)                                   → unit
 *   Target (text)                                 → target
 *   Trend (variant)  Up|Down|Neutral             → trend
 *   Trend label (text)                            → trendLabel
 *   Status (variant) Good|Warning|Danger|Neutral → status
 *   Description (text)                            → description
 */
figma.connect(
  MetricCard,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      label: figma.string('Label'),
      value: figma.string('Value'),
      unit: figma.string('Unit'),
      target: figma.string('Target'),
      trendLabel: figma.string('Trend label'),
      description: figma.string('Description'),
      trend: figma.enum('Trend', {
        Up: 'up',
        Down: 'down',
        Neutral: 'neutral',
      }),
      status: figma.enum('Status', {
        Good: 'good',
        Warning: 'warning',
        Danger: 'danger',
        Neutral: 'neutral',
      }),
    },
    example: ({ label, value, unit, target, trend, trendLabel, status, description }) => (
      <MetricCard
        label={label}
        value={value}
        unit={unit}
        target={target}
        trend={trend}
        trendLabel={trendLabel}
        status={status}
        description={description}
      />
    ),
  },
);
