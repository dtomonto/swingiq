import type { Meta, StoryObj } from '@storybook/react';
import { IndexGrid } from './IndexGrid';

const meta = {
  title: 'Marketing/IndexGrid',
  component: IndexGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof IndexGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Emoji: Story = {
  args: {
    items: [
      { href: '/tools/golf-slice-fixer', emoji: '⛳', name: 'Golf Slice Fixer', desc: 'Diagnose your slice and get drills + a 7-day plan.' },
      { href: '/tools/swing-mistake-quiz', emoji: '🏏', name: 'Swing Mistake Quiz', desc: 'Find your likely top issue across 7 sports.' },
      { href: '/tools/practice-plan-generator', emoji: '📅', name: 'Practice Plan Generator', desc: 'A focused 7-day plan with retests.' },
      { href: '/tools/equipment-diagnostic', emoji: '🔧', name: 'Equipment Diagnostic', desc: 'Spot possible equipment fit-risk flags.' },
    ],
  },
};

export const Eyebrow: Story = {
  args: {
    items: [
      { href: '/challenges/golf-slice', eyebrow: 'Golf', name: '7-Day Slice Fix', desc: 'Daily focus + a retest to prove it worked.' },
      { href: '/challenges/line-drive', eyebrow: 'Softball', name: '7-Day Line-Drive', desc: 'Stop popping up — groove a flatter path.' },
    ],
  },
};
