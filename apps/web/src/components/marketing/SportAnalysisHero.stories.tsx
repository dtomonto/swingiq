import type { Meta, StoryObj } from '@storybook/react';
import { SportAnalysisHero } from './SportAnalysisHero';

const meta = {
  title: 'Marketing/SportAnalysisHero',
  component: SportAnalysisHero,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof SportAnalysisHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Golf: Story = {
  args: {
    accentVar: '--sport-golf',
    eyebrow: 'Free Tool',
    title: 'AI Golf Swing Analysis',
    titleAccent: '— Powered by Launch Monitor Data',
    subtitle:
      'Import your FlightScope, TrackMan, or Foresight data. Get instant fault diagnosis, drill recommendations, and a personalized practice plan — free.',
    primaryCta: { label: 'Import CSV Data', href: '#' },
    secondaryCta: { label: 'Upload Swing Video', href: '#' },
  },
};

export const Baseball: Story = {
  args: {
    accentVar: '--sport-baseball',
    eyebrow: 'Free Tool',
    title: 'AI Baseball Swing Analysis',
    titleAccent: '— Exit Velocity to Bat Path',
    subtitle: 'Import HitTrax, Rapsodo, or Blast Motion data. Upload a swing video. Get instant AI diagnosis — free.',
    primaryCta: { label: 'Import Hitting Data', href: '#' },
    secondaryCta: { label: 'Upload Swing Video', href: '#' },
  },
};
