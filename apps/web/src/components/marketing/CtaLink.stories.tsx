import type { Meta, StoryObj } from '@storybook/react';
import { CtaLink } from './CtaLink';

const meta = {
  title: 'Marketing/CtaLink',
  component: CtaLink,
  tags: ['autodocs'],
} satisfies Meta<typeof CtaLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {
  args: { href: '/start', children: 'Analyze My Swing — Free' },
};

export const Inverse: Story = {
  args: { href: '/start', variant: 'inverse', children: 'Get started' },
  // Inverse is meant to sit on a primary panel:
  decorators: [(Story) => <div className="bg-primary p-10">{Story()}</div>],
};

export const Large: Story = {
  args: { href: '/start', size: 'lg', children: 'Ready to fix your swing?' },
};
