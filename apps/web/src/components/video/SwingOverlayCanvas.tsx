'use client';

import { useRef, useEffect, useState } from 'react';
import type { SwingOverlayData } from '@swingiq/core';

interface SwingOverlayCanvasProps {
  overlayData: SwingOverlayData | null;
  videoWidth: number;
  videoHeight: number;
  showSkeleton: boolean;
  showPlane: boolean;
  showShaft: boolean;
  className?: string;
}

export function SwingOverlayCanvas({
  overlayData,
  videoWidth,
  videoHeight,
  showSkeleton,
  showPlane,
  showShaft,
  className,
}: SwingOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (!overlayData) return;

    const px = (x: number) => x * W;
    const py = (y: number) => y * H;

    // Helper to draw a single overlay line
    const drawLine = (line: { from: { x: number; y: number }; to: { x: number; y: number }; color: string; width: number; dashed?: boolean }) => {
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.setLineDash(line.dashed ? [5, 4] : []);
      ctx.moveTo(px(line.from.x), py(line.from.y));
      ctx.lineTo(px(line.to.x), py(line.to.y));
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw skeleton lines
    if (showSkeleton && overlayData.lines.length > 0) {
      for (const line of overlayData.lines) {
        drawLine(line);
      }

      // Draw joint circles at landmark positions
      if (overlayData.landmarks) {
        const landmarks = overlayData.landmarks;
        const joints = [
          landmarks.head,
          landmarks.left_shoulder, landmarks.right_shoulder,
          landmarks.left_hip, landmarks.right_hip,
          landmarks.left_knee, landmarks.right_knee,
          landmarks.left_ankle, landmarks.right_ankle,
          landmarks.left_wrist, landmarks.right_wrist,
        ];
        for (const joint of joints) {
          if (!joint) continue;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.arc(px(joint.x), py(joint.y), 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // Draw swing plane line
    if (showPlane && overlayData.swing_plane_line) {
      drawLine(overlayData.swing_plane_line);
    }

    // Draw shaft angle line
    if (showShaft && overlayData.shaft_angle_line) {
      ctx.lineWidth = overlayData.shaft_angle_line.width;
      ctx.strokeStyle = overlayData.shaft_angle_line.color;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(px(overlayData.shaft_angle_line.from.x), py(overlayData.shaft_angle_line.from.y));
      ctx.lineTo(px(overlayData.shaft_angle_line.to.x), py(overlayData.shaft_angle_line.to.y));
      ctx.stroke();
    }

    // Draw labels
    for (const label of overlayData.labels) {
      const x = px(label.position.x);
      const y = py(label.position.y);
      const fontSize = label.fontSize;

      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;

      // Background
      if (label.background) {
        const metrics = ctx.measureText(label.text);
        const padding = 3;
        ctx.fillStyle = label.background;
        ctx.beginPath();
        ctx.roundRect(
          x - padding,
          y - fontSize - padding,
          metrics.width + padding * 2,
          fontSize + padding * 2,
          3,
        );
        ctx.fill();
      }

      ctx.fillStyle = label.color;
      ctx.fillText(label.text, x, y);
    }
  }, [overlayData, showSkeleton, showPlane, showShaft]);

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth || 1920}
      height={videoHeight || 1080}
      className={className}
      style={{ pointerEvents: 'none' }} // pass through clicks to video
    />
  );
}
