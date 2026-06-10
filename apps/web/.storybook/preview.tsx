import * as React from 'react';
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

// The 7 shipped themes (see globals.css [data-theme] blocks). Dark Performance
// (B) is the app default, so it's the default here too.
const THEMES = [
  'dark-performance',
  'standard',
  'coach-mode',
  'heritage-club',
  'field-court',
  'arcade-practice',
  'bird-print',
] as const;

const preview: Preview = {
  parameters: {
    layout: 'centered',
    a11y: { test: 'todo' },
  },
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'dark-performance',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: THEMES.map((t) => ({ value: t, title: t })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      const theme = (ctx.globals.theme as string) ?? 'dark-performance';
      return (
        <div
          data-theme={theme}
          className={theme === 'dark-performance' ? 'dark' : undefined}
          style={{ padding: 32, minWidth: 360, background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
