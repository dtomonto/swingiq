import figma from '@figma/code-connect';

import { FixCard } from './FixCard';

/**
 * Code Connect: Figma "Fix Card" → code <FixCard>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   Eyebrow (text)         → eyebrow
 *   Fix (text)             → fix
 *   Why (text)             → why
 *   Confidence (text)      → confidence
 *   Confidence note (text) → confidenceNote
 */
figma.connect(
  FixCard,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      eyebrow: figma.string('Eyebrow'),
      fix: figma.string('Fix'),
      why: figma.string('Why'),
      confidence: figma.string('Confidence'),
      confidenceNote: figma.string('Confidence note'),
    },
    example: ({ eyebrow, fix, why, confidence, confidenceNote }) => (
      <FixCard
        eyebrow={eyebrow}
        fix={fix}
        why={why}
        confidence={confidence}
        confidenceNote={confidenceNote}
      />
    ),
  },
);
