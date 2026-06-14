import type { Meta, StoryObj } from '@storybook/react';
import { BenefitGrid } from './BenefitGrid';

const meta = {
  title: 'Marketing/BenefitGrid',
  component: BenefitGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof BenefitGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { title: 'Free to start', desc: 'No cost to run your first analysis — no credit card, no account required.' },
      { title: 'Private by default', desc: 'Analysis runs in your browser when possible; we never sell your data.' },
      { title: 'Works with coaching', desc: 'A second set of eyes between lessons — not a replacement for your coach.' },
    ],
  },
};
