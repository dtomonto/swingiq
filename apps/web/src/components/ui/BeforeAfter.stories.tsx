import type { Meta, StoryObj } from '@storybook/react';
import { BeforeAfter } from './BeforeAfter';

const meta = {
  title: 'Report/BeforeAfter',
  component: BeforeAfter,
  tags: ['autodocs'],
} satisfies Meta<typeof BeforeAfter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Improved: Story = {
  args: {
    label: 'Club path',
    before: '-4.2',
    after: '-1.8',
    unit: '°',
    better: true,
    note: '+2.4°',
  },
  render: (args) => (
    <div style={{ maxWidth: 460 }}>
      <BeforeAfter {...args} />
    </div>
  ),
};

export const Regressed: Story = {
  args: {
    label: 'Tempo ratio',
    before: '3.1',
    after: '2.7',
    better: false,
    note: 'watch this',
  },
  render: (args) => (
    <div style={{ maxWidth: 460 }}>
      <BeforeAfter {...args} />
    </div>
  ),
};
