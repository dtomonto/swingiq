import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Field } from './Field';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { placeholder: 'you@example.com' } };

// <Field> wires label/hint/error + aria across the control automatically.
export const WithField: Story = {
  render: () => (
    <div className="w-80 max-w-full space-y-4">
      <Field label="Email" hint="We never share it.">
        <Input type="email" placeholder="you@example.com" />
      </Field>
      <Field label="Display name" required>
        <Input placeholder="Alex" />
      </Field>
      <Field label="Handicap" error="Enter a number between -10 and 54.">
        <Input inputMode="numeric" defaultValue="abc" />
      </Field>
      <Field label="Notes">
        <Textarea placeholder="Anything your coach should know?" />
      </Field>
    </div>
  ),
};
