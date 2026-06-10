import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardTitle } from './Card';

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
