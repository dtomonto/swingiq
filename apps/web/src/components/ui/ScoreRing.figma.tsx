import figma from '@figma/code-connect';

import { ScoreRing } from './ScoreRing';

/**
 * Code Connect: Figma "Score Ring" → code <ScoreRing>.
 *
 * ⚠️ SCAFFOLD — the node id below is a PLACEHOLDER. Replace `node-id=TODO-REPLACE`
 * with the real id (Figma ▸ Dev Mode ▸ right-click component ▸ "Copy link to
 * selection"), then verify the prop names match the Figma component's properties
 * with `npm run figma:parse`. See CODE_CONNECT.md ▸ "Pending mappings".
 *
 * Inferred Figma props → code props
 *   Score (text)     → score (number)
 *   Label (text)     → label
 *   Glow  (boolean)  → glow
 */
figma.connect(
  ScoreRing,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      score: figma.string('Score'),
      label: figma.string('Label'),
      glow: figma.boolean('Glow'),
    },
    example: ({ score, label, glow }) => (
      <ScoreRing score={Number(score)} label={label} glow={glow} />
    ),
  },
);
