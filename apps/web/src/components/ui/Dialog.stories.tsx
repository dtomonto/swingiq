import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';
import { Button } from './Button';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Uncontrolled: Radix manages open state from the trigger. Focus-trap, ESC,
// scroll-lock and return-focus are all handled by the primitive.
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this swing?</DialogTitle>
          <DialogDescription>
            This permanently removes the clip and its analysis. You can&apos;t undo this.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" size="sm">
            Cancel
          </Button>
          <Button variant="danger" size="sm">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Controlled: drive `open` yourself (how ConfirmDialog uses it).
export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Publish</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish to production?</DialogTitle>
              <DialogDescription>This makes the change live for all athletes.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};
