'use client';

import { PacketGeneratorButton, ShareLinkManager } from '@/components/recruiting';

export default function PacketGeneratorPage() {
  return (
    <div className="space-y-5">
      <PacketGeneratorButton />
      <ShareLinkManager />
    </div>
  );
}
