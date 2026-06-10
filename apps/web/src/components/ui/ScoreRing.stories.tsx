import type { Meta, StoryObj } from '@storybook/react';
import { ScoreRing } from './ScoreRing';

const meta = {
  title: 'UI/ScoreRing',
  component: ScoreRing,
  tags: ['autodocs'],
} satisfies Meta<typeof ScoreRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GlowOn: Story = { args: { score: 86, size: 100, strokeWidth: 8, label: 'Overall', glow: true } };
export const GlowOff: Story = { args: { score: 86, size: 100, strokeWidth: 8, label: 'Overall' } };

export const AcrossGrades: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      {[92, 78, 62, 48, 32].map((s) => (
        <ScoreRing key={s} score={s} size={72} strokeWidth={6} label={String(s)} glow />
      ))}
    </div>
  ),
};
