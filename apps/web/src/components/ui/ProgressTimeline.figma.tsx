import figma from '@figma/code-connect';

import { ProgressTimeline } from './ProgressTimeline';

/**
 * Code Connect: Figma "Progress Timeline" → code <ProgressTimeline>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   On paper (boolean) → onPaper
 *
 * `points` is data-driven (an array of { label, score }) and is not modeled as a
 * Figma property — the example below shows a representative series; wire real
 * retest data at the call site.
 */
figma.connect(
  ProgressTimeline,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      onPaper: figma.boolean('On paper'),
    },
    example: ({ onPaper }) => (
      <ProgressTimeline
        points={[
          { label: 'Baseline', score: 62 },
          { label: 'Retest 1', score: 71 },
          { label: 'Retest 2', score: 78 },
        ]}
        onPaper={onPaper}
      />
    ),
  },
);
