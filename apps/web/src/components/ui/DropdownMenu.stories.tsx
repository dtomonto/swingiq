import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';
import { Button } from './Button';

const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Actions: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Swing</DropdownMenuLabel>
        <DropdownMenuItem>Re-analyze</DropdownMenuItem>
        <DropdownMenuItem>Share report</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-error-text">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

// Select-one (how LanguageToggle uses it): a radio group with a checked indicator.
export const SelectOne: Story = {
  render: () => {
    const [sport, setSport] = useState('golf');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Sport: {sport}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup value={sport} onValueChange={setSport}>
            <DropdownMenuRadioItem value="golf">Golf</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="tennis">Tennis</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="pickleball">Pickleball</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};
