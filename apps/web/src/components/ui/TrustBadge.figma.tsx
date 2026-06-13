import figma from '@figma/code-connect';

import { TrustBadge } from './TrustBadge';

/**
 * Code Connect: Figma "Trust Badge" → code <TrustBadge>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   Label (text)                       → children
 *   Variant (variant) Neutral|Verified → variant
 *   (Icon is set in code, not Figma.)
 */
figma.connect(
  TrustBadge,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      label: figma.string('Label'),
      variant: figma.enum('Variant', {
        Neutral: 'neutral',
        Verified: 'verified',
      }),
    },
    example: ({ label, variant }) => <TrustBadge variant={variant}>{label}</TrustBadge>,
  },
);
