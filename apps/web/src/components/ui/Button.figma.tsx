import figma from '@figma/code-connect';

import { Button } from './Button';

/**
 * Code Connect: Figma "Button" component set → code <Button>.
 * Figma node: aXNDKbiBOJPRFWor54x6oC ▸ Components ▸ Button (28:26)
 *
 * Figma props → code props
 *   Style (variant)  Primary|Secondary|Outline|Ghost → variant
 *   Size  (variant)  Small|Medium|Large              → size
 *   Label (text)                                     → children
 *
 * Note: the Figma set has no Danger variant; code's `danger` is intentionally
 * unmapped (status buttons are composed in code, not in the marketing DS).
 */
figma.connect(
  Button,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=28-26',
  {
    props: {
      label: figma.string('Label'),
      variant: figma.enum('Style', {
        Primary: 'primary',
        Secondary: 'secondary',
        Outline: 'outline',
        Ghost: 'ghost',
      }),
      size: figma.enum('Size', {
        Small: 'sm',
        Medium: 'md',
        Large: 'lg',
      }),
    },
    example: ({ label, variant, size }) => (
      <Button variant={variant} size={size}>
        {label}
      </Button>
    ),
  },
);
