'use client';

// Tabs — in-page tab panels on @radix-ui/react-tabs (already a dependency).
// Radix supplies roving arrow-key focus, the tablist/tab/tabpanel ARIA wiring,
// and automatic/manual activation. Token-styled underline tabs.
//
// NOTE: this is for switching panels WITHIN one page. Cross-route navigation
// that happens to look like tabs (e.g. admin HealthTabs) should stay a <nav> of
// <Link>s with aria-current — not this component.

import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('flex flex-wrap gap-1 overflow-x-auto border-b border-border', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      '-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
      'hover:text-foreground',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      'data-[state=active]:border-primary data-[state=active]:text-link',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
