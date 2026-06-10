import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './MetricCard';

const meta = {
  title: 'UI/MetricCard',
  component: MetricCard,
  tags: ['autodocs'],
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Good: Story = { args: { label: 'Smash factor', value: 1.48, status: 'good', trend: 'up' } };
export const Warning: Story = { args: { label: 'Club path', value: '-3.2°', status: 'warning', trend: 'down' } };

export const Grid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 160px)', gap: 12 }}>
      <MetricCard label="Carry" value="165 yds" status="good" />
      <MetricCard label="Face to path" value="+3.5°" status="warning" />
      <MetricCard label="Ball speed" value="118 mph" status="neutral" />
      <MetricCard label="Dispersion" value="42 ft" status="danger" />
    </div>
  ),
};
