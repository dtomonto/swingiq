import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { children: 'Analyze My Swing' } };
export const Outline: Story = { args: { children: 'Secondary', variant: 'outline' } };

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// `asChild` renders the button styling onto a link (or any element) via Radix
// Slot — so a Figma "Button" maps to ONE code component whether it's an <a> or
// a <button>. The rendered element here is a real <a href>, styled as a Button.
export const AsLink: Story = {
  render: () => (
    <Button asChild>
      <a href="/start">Start free</a>
    </Button>
  ),
};
