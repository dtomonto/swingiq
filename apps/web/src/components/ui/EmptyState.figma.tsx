import figma from '@figma/code-connect';

import { EmptyState } from './EmptyState';

/**
 * Code Connect: Figma "Empty State" → code <EmptyState>.
 *
 * ⚠️ SCAFFOLD — `node-id=TODO-REPLACE` is a PLACEHOLDER. Replace it with the real
 * id (Figma ▸ Dev Mode ▸ right-click ▸ "Copy link to selection") and confirm the
 * Figma property names below match, then `npm run figma:parse`.
 *
 * Inferred Figma props → code props
 *   Title (text)       → title
 *   Description (text) → description
 *   Compact (boolean)  → compact
 *
 * `icon` (a Lucide component) and `action`/`secondaryAction` (objects with an
 * onClick/href) are code-only — wire them at the call site.
 */
figma.connect(
  EmptyState,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=TODO-REPLACE',
  {
    props: {
      title: figma.string('Title'),
      description: figma.string('Description'),
      compact: figma.boolean('Compact'),
    },
    example: ({ title, description, compact }) => (
      <EmptyState title={title} description={description} compact={compact} />
    ),
  },
);
