import figma from '@figma/code-connect';

import { SportChip } from './SportChip';

/**
 * Code Connect: Figma "Sport Chip" → code <SportChip>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   Sport (variant) Golf|Tennis|Baseball|Softball|Pickleball|Padel → sport
 *   Active (boolean)                                               → active
 *   Size (variant)  Small|Medium                                  → size
 */
figma.connect(
  SportChip,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      active: figma.boolean('Active'),
      sport: figma.enum('Sport', {
        Golf: 'golf',
        Tennis: 'tennis',
        Baseball: 'baseball',
        Softball: 'softball',
        Pickleball: 'pickleball',
        Padel: 'padel',
      }),
      size: figma.enum('Size', {
        Small: 'sm',
        Medium: 'md',
      }),
    },
    example: ({ sport, active, size }) => (
      <SportChip sport={sport} active={active} size={size} />
    ),
  },
);
