'use client';

// ============================================================
// Recruiting — PacketGeneratorButton
// ------------------------------------------------------------
// One-click printable recruiting packet (coach / scout / parent
// variants). Opens a branded print view; the raw video is never
// embedded — only titles + the live profile link.
// ============================================================

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  useRecruitingStore,
  openPacketForPrint,
  shareUrl,
  isLinkActive,
  type PacketVariant,
} from '@/lib/recruiting';

const VARIANTS: { v: PacketVariant; label: string; blurb: string }[] = [
  { v: 'coach', label: 'Coach packet', blurb: 'Evaluation-focused: summary, key metrics, film, notes.' },
  { v: 'scout', label: 'Scout packet', blurb: 'Data-forward: numbers + sources, lighter on narrative.' },
  { v: 'parent', label: 'Family summary', blurb: 'Warm, plain-English read with academics included.' },
];

export function PacketGeneratorButton() {
  const state = useRecruitingStore();
  const [note, setNote] = useState<string | null>(null);

  const activeLink = state.shareLinks.find((l) => isLinkActive(l));
  const link = activeLink ? shareUrl(activeLink.slug) : undefined;

  function generate(variant: PacketVariant) {
    const ok = openPacketForPrint(state, variant, link);
    setNote(ok ? null : 'Your browser blocked the print window — allow pop-ups for this site and try again.');
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><FileDown size={17} className="text-primary" /> Recruiting packet</CardTitle></CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-muted-foreground">Generate a clean, branded one-pager to print or save as PDF. Every metric prints its source; video is never embedded.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {VARIANTS.map((v) => (
            <button key={v.v} onClick={() => generate(v.v)} className="text-left rounded-lg border border-border p-3 hover:border-primary hover:bg-muted/50 transition-colors">
              <p className="font-medium text-foreground">{v.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{v.blurb}</p>
            </button>
          ))}
        </div>
        {note && <p className="text-xs text-warning">{note}</p>}
        {!link && <p className="text-xs text-muted-foreground">Tip: create a share link so the packet includes your live profile URL.</p>}
      </CardBody>
    </Card>
  );
}
