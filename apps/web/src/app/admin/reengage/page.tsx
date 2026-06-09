// ============================================================
// /admin/reengage — Drip Marketing Console (owner)
// ------------------------------------------------------------
// The whole re-engagement drip cycle in one place: an intuitive
// lifecycle timeline, a thorough per-campaign breakdown with inline
// strategy controls, and a strategy analysis battery (priority
// resolution, coverage gaps, channel mix, deliverability, health).
// Draft-first — nothing sends from this screen. Admin-guarded by
// app/admin/layout.tsx.
// ============================================================

import type { Metadata } from 'next';
import { getServerCapabilities } from '@/lib/capabilities';
import { DripConsole } from './DripConsole';

export const metadata: Metadata = { title: 'Drip Marketing | Admin', robots: 'noindex, nofollow' };

export default function AdminReengagePage() {
  // Server-only capability read so the console can be honest about which
  // channels can actually deliver (never exposes secrets to the client).
  const caps = getServerCapabilities();
  return <DripConsole emailConfigured={caps.email} />;
}
