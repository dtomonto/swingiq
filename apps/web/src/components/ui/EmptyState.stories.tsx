import type { Meta, StoryObj } from '@storybook/react';
import { Activity } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Activity,
    title: 'No sessions yet',
    description: 'Import a CSV to get your first analysis.',
    action: { label: 'Import session', href: '#' },
  },
};

export const Compact: Story = {
  args: {
    compact: true,
    icon: Activity,
    title: 'No reports yet',
    description: 'Import a CSV to generate your first report.',
  },
};
