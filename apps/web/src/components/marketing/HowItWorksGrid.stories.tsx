import type { Meta, StoryObj } from '@storybook/react';
import { HowItWorksGrid } from './HowItWorksGrid';

const meta = {
  title: 'Marketing/HowItWorksGrid',
  component: HowItWorksGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof HowItWorksGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'How Golf Swing Analysis Works',
    steps: [
      { name: 'Upload Your Data', text: 'Import a CSV from your launch monitor, upload a screenshot, or enter key metrics.' },
      { name: 'AI Diagnoses Your Faults', text: 'The rules engine cross-references 20+ biomechanical benchmarks to find your top issues.' },
      { name: 'Get Your Practice Plan', text: 'Receive drill recommendations, a weekly schedule, and benchmarks to track improvement.' },
    ],
  },
};

export const MutedBackground: Story = {
  args: { ...Default.args!, bg: 'muted' },
};
