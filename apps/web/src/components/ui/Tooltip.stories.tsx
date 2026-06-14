import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';
import { Button } from './Button';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// In the app a single <TooltipProvider> is mounted in Providers; Storybook has
// no app shell, so the story provides its own.
export const Default: Story = {
  render: () => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">Re-analyze</Button>
        </TooltipTrigger>
        <TooltipContent>Runs a fresh analysis on your latest swing.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
