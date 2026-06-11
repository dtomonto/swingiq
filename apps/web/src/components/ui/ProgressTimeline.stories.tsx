import type { Meta, StoryObj } from '@storybook/react';
import { ProgressTimeline } from './ProgressTimeline';

const meta = {
  title: 'Report/ProgressTimeline',
  component: ProgressTimeline,
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Improving: Story = {
  args: {
    points: [
      { label: 'Baseline', score: 58 },
      { label: 'Retest 1', score: 64 },
      { label: 'Retest 2', score: 71 },
      { label: 'Retest 3', score: 79 },
    ],
  },
  render: (args) => (
    <div style={{ maxWidth: 420 }}>
      <ProgressTimeline {...args} />
    </div>
  ),
};

export const SinglePoint: Story = {
  args: { points: [{ label: 'Baseline', score: 62 }] },
  render: (args) => (
    <div style={{ maxWidth: 420 }}>
      <ProgressTimeline {...args} />
    </div>
  ),
};
