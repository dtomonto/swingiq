import type { Meta, StoryObj } from '@storybook/react';
import { MetricsGrid } from './MetricsGrid';

const meta = {
  title: 'Marketing/MetricsGrid',
  component: MetricsGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof MetricsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Golf Metrics SwingVantage Analyzes',
    intro: 'Every metric is compared to tour-calibrated benchmarks for your club and skill level.',
    items: [
      { label: 'Ball Speed', detail: 'Energy transfer from club to ball. Target smash factor 1.45–1.50.' },
      { label: 'Club Path', detail: 'In-to-out vs. out-to-in path is the #1 factor in shot shape.' },
      { label: 'Launch Angle', detail: 'Vertical angle off the face. Optimal 10–14° for driver.' },
      { label: 'Spin Rate', detail: 'Backspin and sidespin govern curve and descent.' },
    ],
  },
};
