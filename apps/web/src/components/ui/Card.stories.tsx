import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardTitle, Eyebrow } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <CardTitle>Session summary</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-muted-foreground">
          The shared card primitive carries the B signature — themed radius, border and elevation.
        </p>
      </CardBody>
    </Card>
  ),
};

export const Tints: Story = {
  render: () => (
    <div className="grid gap-3" style={{ width: 360 }}>
      {(['primary', 'success', 'warning', 'error', 'muted'] as const).map((tint) => (
        <Card key={tint} tint={tint}>
          <CardBody>
            <Eyebrow color={tint === 'warning' ? 'warning' : tint === 'success' ? 'success' : 'link'}>
              {tint} tint
            </Eyebrow>
            <p className="mt-1 text-sm text-foreground">Status panel surface.</p>
          </CardBody>
        </Card>
      ))}
    </div>
  ),
};

export const Glow: Story = {
  render: () => (
    <Card glow style={{ width: 360 }}>
      <CardBody>
        <Eyebrow>One next action</Eyebrow>
        <CardTitle className="mt-1">Record your retest swing</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          The accent glow ring marks the single prioritized action (neon on dark themes, soft ring on light).
        </p>
      </CardBody>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card elevated style={{ width: 360 }}>
      <CardBody>
        <CardTitle>Elevated surface</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Uses the theme&apos;s elevated shadow.</p>
      </CardBody>
    </Card>
  ),
};
