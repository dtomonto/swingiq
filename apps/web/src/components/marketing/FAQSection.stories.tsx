import type { Meta, StoryObj } from '@storybook/react';
import { FAQSection } from './FAQSection';

const meta = {
  title: 'Marketing/FAQSection',
  component: FAQSection,
  tags: ['autodocs'],
} satisfies Meta<typeof FAQSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        question: 'Is my swing data private?',
        answer:
          'Yes — analysis runs locally in your browser when possible. We never sell your data, and you can delete it at any time.',
      },
      {
        question: 'Do I need a launch monitor?',
        answer: 'No. Upload a swing video, or enter metrics manually from any source — even a range session.',
      },
      {
        question: 'How much does it cost?',
        answer: 'The core analysis is free, with no account required to start.',
      },
    ],
  },
};
