import figma from '@figma/code-connect';

import { BeforeAfter } from './BeforeAfter';

/**
 * Code Connect: Figma "Before / After" → code <BeforeAfter>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   Label (text)    → label
 *   Before (text)   → before
 *   After (text)    → after
 *   Unit (text)     → unit
 *   Better (bool)   → better
 *   Note (text)     → note
 *   On paper (bool) → onPaper
 */
figma.connect(
  BeforeAfter,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      label: figma.string('Label'),
      before: figma.string('Before'),
      after: figma.string('After'),
      unit: figma.string('Unit'),
      note: figma.string('Note'),
      better: figma.boolean('Better'),
      onPaper: figma.boolean('On paper'),
    },
    example: ({ label, before, after, unit, better, note, onPaper }) => (
      <BeforeAfter
        label={label}
        before={before}
        after={after}
        unit={unit}
        better={better}
        note={note}
        onPaper={onPaper}
      />
    ),
  },
);
