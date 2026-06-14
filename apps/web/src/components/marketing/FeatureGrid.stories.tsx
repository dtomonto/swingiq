import type { Meta, StoryObj } from '@storybook/react';
import { ShieldCheck, Target, Zap } from 'lucide-react';
import { FeatureGrid } from './FeatureGrid';

const meta = {
  title: 'Marketing/FeatureGrid',
  component: FeatureGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof FeatureGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { icon: ShieldCheck, title: 'Private by default', desc: 'Analysis runs in your browser when possible; your data is never shared and never sold.' },
      { icon: Target, title: 'Pro-grade accuracy', desc: 'Frame-by-frame biomechanics, graded against your level — not tour pros.' },
      { icon: Zap, title: 'Instant feedback', desc: 'Your top fix, matched drills, and a practice plan in minutes — no waiting.' },
    ],
  },
};
