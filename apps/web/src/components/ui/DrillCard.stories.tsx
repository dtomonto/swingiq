import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DrillCard } from './DrillCard';

const meta = {
  title: 'Report/DrillCard',
  component: DrillCard,
  tags: ['autodocs'],
} satisfies Meta<typeof DrillCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
  args: {
    n: 1,
    name: 'Pause-at-the-top reps',
    reps: '3×10 swings',
    how: 'Swing to the top, hold for one beat to feel the hips set, then fire.',
  },
  render: (args) => (
    <div style={{ maxWidth: 460 }}>
      <DrillCard {...args} />
    </div>
  ),
};

export const Checkable: Story = {
  render: () => {
    const [done, setDone] = useState(false);
    return (
      <div style={{ maxWidth: 460 }}>
        <DrillCard
          n={2}
          name="Step-through tempo drill"
          reps="2×8"
          how="Step toward the target as you start down to sync the lower body."
          done={done}
          onToggle={setDone}
        />
      </div>
    );
  },
};

export const OnPaper: Story = {
  args: {
    n: 3,
    name: 'Slow-motion sequence',
    reps: '5 reps',
    how: 'Half-speed swings rehearsing hips-then-arms.',
    onPaper: true,
    done: true,
  },
  render: (args) => (
    <div className="bg-document rounded-2xl p-5" style={{ maxWidth: 460 }}>
      <DrillCard {...args} onToggle={() => {}} />
    </div>
  ),
};
