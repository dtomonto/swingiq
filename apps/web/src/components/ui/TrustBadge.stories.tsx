import type { Meta, StoryObj } from '@storybook/react';
import { Lock, Sparkles } from 'lucide-react';
import { TrustBadge } from './TrustBadge';

const meta = {
  title: 'UI/TrustBadge',
  component: TrustBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof TrustBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Signals: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TrustBadge>No ads, no data sales</TrustBadge>
      <TrustBadge icon={Lock}>Keyless by default</TrustBadge>
      <TrustBadge icon={Sparkles} variant="verified">
        Free while in the Founding 1,000
      </TrustBadge>
    </div>
  ),
};
