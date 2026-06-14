import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 max-w-full space-y-4">
      <Progress value={28} />
      <Progress value={64} className="h-2.5" indicatorClassName="bg-accent-secondary" />
      <Progress value={92} indicatorClassName="bg-success" />
    </div>
  ),
};
