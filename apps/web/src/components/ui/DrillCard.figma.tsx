import figma from '@figma/code-connect';

import { DrillCard } from './DrillCard';

/**
 * Code Connect: Figma "Drill Card" → code <DrillCard>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   Number (text)    → n (number)
 *   Name (text)      → name
 *   Reps (text)      → reps
 *   How (text)       → how
 *   Done (boolean)   → done
 *   On paper (bool)  → onPaper
 *   (onToggle is a code-only callback — not modeled in Figma.)
 */
figma.connect(
  DrillCard,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      n: figma.string('Number'),
      name: figma.string('Name'),
      reps: figma.string('Reps'),
      how: figma.string('How'),
      done: figma.boolean('Done'),
      onPaper: figma.boolean('On paper'),
    },
    example: ({ n, name, reps, how, done, onPaper }) => (
      <DrillCard n={Number(n)} name={name} reps={reps} how={how} done={done} onPaper={onPaper} />
    ),
  },
);
