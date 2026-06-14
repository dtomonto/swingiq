import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Field } from './Field';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-72 max-w-full">
      <Field label="Sport">
        <Select defaultValue="golf">
          <SelectTrigger>
            <SelectValue placeholder="Pick a sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="golf">Golf</SelectItem>
            <SelectItem value="tennis">Tennis</SelectItem>
            <SelectItem value="pickleball">Pickleball</SelectItem>
            <SelectItem value="padel">Padel</SelectItem>
            <SelectItem value="baseball">Baseball</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  ),
};
