import type { Meta, StoryObj } from '@storybook/react';
import { SportChip } from './SportChip';
import type { SportId } from '@swingiq/core';

const SPORTS: SportId[] = ['golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast', 'pickleball', 'padel'];

const meta = {
  title: 'UI/SportChip',
  component: SportChip,
  tags: ['autodocs'],
} satisfies Meta<typeof SportChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveAllSports: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {SPORTS.map((s) => (
        <SportChip key={s} sport={s} active />
      ))}
    </div>
  ),
};

export const SelectableTint: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {SPORTS.map((s) => (
        <SportChip key={s} sport={s} onClick={() => {}} />
      ))}
    </div>
  ),
};

export const Small: Story = {
  args: { sport: 'tennis', active: true, size: 'sm' },
};
