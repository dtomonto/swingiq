import type { Meta, StoryObj } from '@storybook/react';
import { FixCard } from './FixCard';

const meta = {
  title: 'Report/FixCard',
  component: FixCard,
  tags: ['autodocs'],
} satisfies Meta<typeof FixCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fix: 'Let your hips finish loading before the downswing starts.',
    why: 'Your sequence shows the arms firing first, which throws the club outside the line and costs you ~12 yards of carry.',
    confidence: 'High confidence',
    confidenceNote: 'video + launch data agree',
  },
  render: (args) => (
    <div style={{ maxWidth: 460 }}>
      <FixCard {...args} />
    </div>
  ),
};

export const LowerConfidence: Story = {
  args: {
    eyebrow: 'Likely fix',
    fix: 'Quiet the trail foot through contact.',
    why: 'Based on a single angle, so treat this as a starting point rather than a verdict.',
    confidence: 'Moderate confidence',
    confidenceNote: 'one camera angle only',
  },
  render: (args) => (
    <div style={{ maxWidth: 460 }}>
      <FixCard {...args} />
    </div>
  ),
};
