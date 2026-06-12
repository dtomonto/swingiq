import figma from '@figma/code-connect';

import { Card, CardBody, CardTitle } from './Card';

/**
 * Code Connect: Figma "Feature Card" → code <Card> composition.
 * Figma node: aXNDKbiBOJPRFWor54x6oC ▸ Components ▸ Feature Card (30:2)
 *
 * The Figma Feature Card is an icon-chip + title + body composition; in code
 * it's assembled from the generic <Card> primitive plus CardBody/CardTitle.
 *
 * Figma props → code
 *   Title (text) → <CardTitle>
 *   Body  (text) → supporting paragraph
 */
figma.connect(
  Card,
  'https://www.figma.com/design/aXNDKbiBOJPRFWor54x6oC?node-id=30-2',
  {
    props: {
      title: figma.string('Title'),
      body: figma.string('Body'),
    },
    example: ({ title, body }) => (
      <Card>
        <CardBody>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </CardBody>
      </Card>
    ),
  },
);
