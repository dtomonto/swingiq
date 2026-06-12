import figma from '@figma/code-connect';

import { Badge } from './Badge';

/**
 * Code Connect: Figma "Badge" component set → code <Badge>.
 * Figma node: aXNDKbiBOJPRFWor54x6oC ▸ Components ▸ Badge (29:12)
 *
 * Figma props → code props
 *   Tone (variant)  Neutral|Brand|Success|Warning|Error → variant
 *   Label (text)                                        → children
 *
 * Note: Figma "Brand" (solid performance green) maps to code `success` — the
 * closest green status variant; code has no dedicated brand-fill badge.
 */
figma.connect(
  Badge,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=29-12',
  {
    props: {
      label: figma.string('Label'),
      variant: figma.enum('Tone', {
        Neutral: 'default',
        Brand: 'success',
        Success: 'success',
        Warning: 'warning',
        Error: 'danger',
      }),
    },
    example: ({ label, variant }) => <Badge variant={variant}>{label}</Badge>,
  },
);
