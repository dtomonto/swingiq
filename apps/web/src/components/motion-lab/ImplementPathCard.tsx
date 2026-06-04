'use client';

// ============================================================
// SwingIQ — Motion Lab: Implement Path Card
// ------------------------------------------------------------
// Visualizes the ESTIMATED implement (club/bat/racket) head path and
// contact zone from lib/motion-lab/objectTracking. An auto-framed inline
// SVG draws the head arc, the grip→head line at contact, and the contact
// marker. Everything is labeled estimated/low-confidence — this is an
// inference from arm motion, not true object detection.
// ============================================================

import { Spline, Target, Info } from 'lucide-react';
import type { ObjectTrackingResult } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';

const IMPLEMENT_LABEL: Record<string, string> = {
  club: 'Club path',
  bat: 'Bat path',
  racket: 'Racket path',
  none: 'Implement path',
};

const APPROACH_LABEL: Record<string, string> = {
  ascending: 'Swinging up (ascending)',
  descending: 'Swinging down (descending)',
  level: 'Level through contact',
  unknown: 'Direction unclear',
};

function confidenceWord(c: number): string {
  return c >= 0.4 ? 'moderate' : c >= 0.2 ? 'low' : 'very low';
}

interface Props {
  tracking: ObjectTrackingResult;
  accent?: string;
}

export function ImplementPathCard({ tracking, accent = '#22C55E' }: Props) {
  const pts = tracking.trace.points;
  if (!tracking.available || pts.length < 2) return null;

  // Auto-fit viewBox around the head arc (+ grip points), with padding.
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of pts) {
    xs.push(p.head.x, p.grip.x);
    ys.push(p.head.y, p.grip.y);
  }
  if (tracking.contactZone) {
    xs.push(tracking.contactZone.x);
    ys.push(tracking.contactZone.y);
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = Math.max(0.04, (maxX - minX) * 0.12);
  const padY = Math.max(0.04, (maxY - minY) * 0.12);
  const vbX = minX - padX;
  const vbY = minY - padY;
  const vbW = Math.max(0.08, maxX - minX + padX * 2);
  const vbH = Math.max(0.08, maxY - minY + padY * 2);

  const headPath = pts.map((p) => `${p.head.x.toFixed(4)},${p.head.y.toFixed(4)}`).join(' ');
  const contact = tracking.contactZone;
  const contactPoint = contact ? pts.find((p) => p.frame === contact.frame) : undefined;
  const markerR = Math.max(vbW, vbH) * 0.035;

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Spline className="w-4 h-4 text-primary" style={{ color: accent }} />
          <p className="text-sm font-semibold text-foreground">{IMPLEMENT_LABEL[tracking.implement] ?? 'Implement path'}</p>
          <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-warning bg-warning/10 rounded px-1.5 py-0.5">
            Estimated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,200px)_1fr] gap-4 items-center">
          {/* Auto-framed arc */}
          <div className="rounded-lg bg-[#0b1220] border border-border p-2">
            <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full aspect-square" preserveAspectRatio="xMidYMid meet">
              {/* grip→head line at contact (the implement, at the strike) */}
              {contact && contactPoint && (
                <line
                  x1={contactPoint.grip.x}
                  y1={contactPoint.grip.y}
                  x2={contactPoint.head.x}
                  y2={contactPoint.head.y}
                  stroke="rgba(148,163,184,0.7)"
                  strokeWidth={Math.max(vbW, vbH) * 0.012}
                  strokeLinecap="round"
                />
              )}
              {/* head arc */}
              <polyline
                points={headPath}
                fill="none"
                stroke={accent}
                strokeWidth={Math.max(vbW, vbH) * 0.018}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.85}
              />
              {/* contact zone marker */}
              {contact && (
                <g>
                  <circle cx={contact.x} cy={contact.y} r={markerR} fill="none" stroke="#f97316" strokeWidth={markerR * 0.5} />
                  <circle cx={contact.x} cy={contact.y} r={markerR * 0.35} fill="#f97316" />
                </g>
              )}
            </svg>
            <p className="text-[10px] text-muted-foreground text-center mt-1 flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-orange-500" /> contact zone · arc = estimated head path
            </p>
          </div>

          {/* Read-out */}
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Approach through contact</p>
              <p className="font-semibold text-foreground">
                {APPROACH_LABEL[tracking.swingPath.approach]}
                {tracking.swingPath.verticalApproachDeg != null && (
                  <span className="text-muted-foreground font-normal tabular-nums"> · {tracking.swingPath.verticalApproachDeg > 0 ? '+' : ''}{tracking.swingPath.verticalApproachDeg}°</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tracking confidence</p>
              <p className="font-semibold text-foreground capitalize">
                {confidenceWord(tracking.confidence)} <span className="text-muted-foreground font-normal tabular-nums">({Math.round(tracking.confidence * 100)}%)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Honesty: disclaimer + any capture warnings */}
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground border-t border-border pt-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{tracking.disclaimer}</p>
            {tracking.warnings.length > 0 && (
              <ul className="list-disc list-inside text-warning/90">
                {tracking.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
