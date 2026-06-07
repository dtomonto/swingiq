// ============================================================
// GrowthOS — AI Strategist (§31) — Server shell
// ------------------------------------------------------------
// Server component: renders the module header and hands off
// interactive UI to AiStrategistContent (client component).
// ============================================================

import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { ModuleHeader } from '../_components/ui';
import { AiStrategistContent } from './AiStrategistContent';

export const metadata: Metadata = {
  title: 'AI Strategist | GrowthOS',
  robots: 'noindex, nofollow',
};

export default function AiStrategistPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Sparkles}
        title="AI Strategist"
        description="Generate draft-first, claim-safe marketing assets from your business context."
      />
      <AiStrategistContent />
    </div>
  );
}
